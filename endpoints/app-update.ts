import { apiClient } from "@/lib/api/client";
import { config } from "@/lib/config/environment";
import { resetDatabase } from "@/endpoints/sqlite";
import { useAuthStore } from "@/lib/stores/auth-store";
import * as FileSystem from "expo-file-system";
import * as LegacyFileSystem from "expo-file-system/legacy";
import { startActivityAsync } from "expo-intent-launcher";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

export interface AppUpdateInfo {
  updateAvailable: boolean;
  latestVersion?: {
    versionCode?: number;
    versionName?: string;
    filename?: string;
    fileSize?: number;
    lastModified?: number;
  };
  currentVersion?: {
    versionCode?: number | string;
    versionName?: string;
  };
  downloadUrl?: string;
  filename?: string;
  fileSize?: number;
  lastModified?: number;
  message?: string;
  error?: string;
}

export interface LatestVersionInfo {
  versionCode?: number;
  versionName?: string;
  filename?: string;
  fileSize?: number;
  lastModified?: number;
  downloadUrl?: string;
  error?: string;
}

export interface ApkFileInfo {
  filename: string;
  size?: number;
  lastModified?: number;
}

const handleFetchError = (error: any) => {
  if (
    error.message?.includes("Failed to fetch") ||
    error.message?.includes("NetworkError") ||
    error.message?.includes("ERR_CONNECTION_REFUSED") ||
    (error.name === "TypeError" && error.message?.includes("fetch"))
  ) {
    throw new Error(
      "Server is unavailable. Please check your connection and ensure the backend is running."
    );
  }
  throw error;
};

export const appUpdateApi = {
  /**
   * Check if an update is available
   */
  async checkForUpdate(
    currentVersionCode?: number,
    currentVersionName?: string
  ): Promise<AppUpdateInfo> {
    try {
      console.log("📱 Checking for app updates...");

      interface UpdateCheckResponse {
        success?: boolean;
        data?: AppUpdateInfo;
        message?: string;
      }

      const params = new URLSearchParams();
      if (currentVersionCode !== undefined) {
        params.append("currentVersionCode", currentVersionCode.toString());
      }
      if (currentVersionName) {
        params.append("currentVersionName", currentVersionName);
      }

      const queryString = params.toString();
      const endpoint = `/app-update/check${queryString ? `?${queryString}` : ""}`;

      const result = await apiClient.get<UpdateCheckResponse>(endpoint);

      if (result && typeof result === "object") {
        if ("data" in result && result.data) {
          return result.data;
        }
        if ("updateAvailable" in result) {
          return result as AppUpdateInfo;
        }
      }

      return { updateAvailable: false, message: "Unable to check for updates" };
    } catch (error) {
      console.error("❌ Error checking for app update:", error);
      handleFetchError(error);
      throw error;
    }
  },

  /**
   * Get latest version information
   */
  async getLatestVersion(): Promise<LatestVersionInfo> {
    try {
      interface LatestVersionResponse {
        success?: boolean;
        data?: LatestVersionInfo;
        message?: string;
      }

      const result = await apiClient.get<LatestVersionResponse>(
        "/app-update/latest"
      );

      if (result && typeof result === "object") {
        if ("data" in result && result.data) {
          return result.data;
        }
        return result as LatestVersionInfo;
      }

      return { error: "Unable to get version info" };
    } catch (error) {
      console.error("❌ Error getting latest version:", error);
      handleFetchError(error);
      throw error;
    }
  },

  /**
   * Download and install APK
   */
  async downloadAndInstall(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      if (Platform.OS !== "android") {
        throw new Error("APK installation is only supported on Android");
      }

      console.log("📥 Starting APK download...");

      // Get the base URL from config
      const baseURL = config.API_BASE_URL;
      const downloadUrl = `${baseURL}/app-update/download`;

      // Create download path (documentDirectory is typed as optional in new API)
      const fsAny = FileSystem as any;
      // Prefer cache dirs first, then document/external; Sunmi may expose externalCacheDirectory
      const candidateBaseDirs = [
        fsAny.cacheDirectory,
        fsAny.directories?.cacheDirectory,
        fsAny.Directories?.cacheDirectory,
        fsAny.externalCacheDirectory,
        fsAny.directories?.externalCacheDirectory,
        fsAny.Directories?.externalCacheDirectory,
        fsAny.documentDirectory,
        fsAny.directories?.documentDirectory,
        fsAny.Directories?.documentDirectory,
        fsAny.externalDirectory,
        fsAny.externalStorageDirectory,
      ].filter(Boolean) as string[];

      const baseDir = candidateBaseDirs.find(Boolean);
      if (!baseDir) {
        throw new Error("No writable directory available for download");
      }

      const normalizedBase = baseDir.replace(/\/?$/, "/");
      const downloadDir = `${normalizedBase}downloads/`;
      let downloadPath = `${downloadDir}app-update.apk`;

      // Ensure download directory exists; fallback to base if creation fails
      const { File, Directory } = FileSystem as any;
      try {
        const dirInfo =
          (Directory?.getInfoAsync && (await Directory.getInfoAsync(downloadDir))) ||
          (File?.getInfoAsync && (await File.getInfoAsync(downloadDir))) ||
          { exists: false };
        if (!dirInfo?.exists) {
          if (Directory?.makeDirectoryAsync) {
            await Directory.makeDirectoryAsync(downloadDir, { intermediates: true });
          } else if (File?.makeDirectoryAsync) {
            await File.makeDirectoryAsync(downloadDir, { intermediates: true });
          } else {
            const Legacy = require("expo-file-system/legacy");
            await Legacy.makeDirectoryAsync(downloadDir, { intermediates: true });
          }
        }
      } catch (dirErr) {
        console.warn("⚠️ Falling back to base directory for download:", dirErr);
        downloadPath = `${normalizedBase}app-update.apk`;
      }

      // Download with progress tracking
      // Use legacy API since createDownloadResumable is deprecated in new API
      const LegacyFileSystem = require("expo-file-system/legacy");
      const downloadResumable = LegacyFileSystem.createDownloadResumable(
        downloadUrl,
        downloadPath,
        {},
        (downloadProgress: any) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          if (onProgress) {
            onProgress(progress);
          }
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result || !result.uri) {
        throw new Error("Download failed: No file received");
      }

      console.log("✅ APK downloaded successfully:", result.uri);

      // Reset database and logout user before installation
      // This ensures clean state after APK update
      console.log("🔄 Resetting database before APK installation...");
      try {
        await resetDatabase();
        console.log("✅ Database reset successfully");
        
        // Logout user
        useAuthStore.getState().logout();
        console.log("✅ User logged out");
      } catch (resetError: any) {
        console.error("❌ Error resetting database:", resetError);
        // Continue with installation even if reset fails
      }

      // Install the APK
      // On Android, we use Linking to open the file URI which triggers the package installer
      // FileSystem returns a file:// URI, which should work directly
      try {
        // Ensure we have a proper file:// URI
        let installUri = result.uri;
        if (!installUri.startsWith("file://") && !installUri.startsWith("content://")) {
          installUri = `file://${installUri}`;
        }
        
        const canOpen = await Linking.canOpenURL(installUri);
        if (canOpen) {
          await Linking.openURL(installUri);
          console.log("📦 Opening APK installer...");
        } else {
          // Try without file:// prefix (some Android versions prefer this)
          const directUri = installUri.replace("file://", "");
          await Linking.openURL(`file://${directUri}`);
        }
      } catch (linkError) {
        console.error("Error opening installer:", linkError);
        // Fallback: show manual installation instructions
        Alert.alert(
          "Download Complete",
          `APK downloaded to: ${result.uri}\n\nPlease install it manually using a file manager.`
        );
      }

      Alert.alert(
        "Download Complete",
        "The APK has been downloaded and the database has been reset.\n\n" +
        "You have been logged out. After installation, please initialize the database again.\n\n" +
        "Please follow the installation prompts on your device."
      );
    } catch (error: any) {
      console.error("❌ Error downloading/installing APK:", error);
      Alert.alert(
        "Installation Error",
        error.message || "Failed to download or install the update. Please try again."
      );
      throw error;
    }
  },

  /**
   * List all APK files on the server
   */
  async listFiles(): Promise<ApkFileInfo[]> {
    interface ListResponse {
      success?: boolean;
      data?: ApkFileInfo[];
    }
    const res = await apiClient.get<ListResponse>("/app-update/files");
    if (Array.isArray((res as any)?.data)) {
      return (res as any).data;
    }
    if (Array.isArray(res as any)) {
      return res as any;
    }
    return [];
  },

  /**
   * Delete an APK file on the server by filename
   */
  async deleteFile(filename: string): Promise<void> {
    await apiClient.delete(`/app-update/delete/${encodeURIComponent(filename)}`);
  },

  /**
   * Download and install a specific APK file by filename
   * Note: SQLite data will be preserved during installation as long as the package name and signing key match
   */
  async downloadAndInstallApk(
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      if (Platform.OS !== "android") {
        throw new Error("APK installation is only supported on Android");
      }

      console.log(`📥 Starting APK download for: ${filename}`);

      // Get the base URL from config
      const baseURL = config.API_BASE_URL;
      const downloadUrl = `${baseURL}/app-update/download/${encodeURIComponent(filename)}`;

      // Try legacy API first (has cacheDirectory/documentDirectory as direct properties)
      // Use legacy API since we're using createDownloadResumable which is deprecated in new API
      const LegacyFS = require("expo-file-system/legacy");
      let baseDir: string | null = null;
      
      // Legacy API has cacheDirectory and documentDirectory as direct properties
      if (LegacyFS.cacheDirectory) {
        baseDir = LegacyFS.cacheDirectory;
        console.log("✅ Found cacheDirectory via legacy API");
      } else if (LegacyFS.documentDirectory) {
        baseDir = LegacyFS.documentDirectory;
        console.log("✅ Found documentDirectory via legacy API");
      }
      
      // Fallback to new API if legacy doesn't have them
      if (!baseDir) {
        const fsAny = FileSystem as any;
        
        // Try new API: Paths.cache and Paths.document (new Expo SDK API)
        if (fsAny.Paths) {
          try {
            // New API uses Paths.cache and Paths.document
            if (fsAny.Paths.cache) {
              // Paths.cache might be a Directory object, get its URI
              const cachePath = fsAny.Paths.cache;
              baseDir = typeof cachePath === 'string' ? cachePath : (cachePath.uri || cachePath.path || cachePath);
              console.log("✅ Found cache directory via Paths.cache");
            } else if (fsAny.Paths.document) {
              const docPath = fsAny.Paths.document;
              baseDir = typeof docPath === 'string' ? docPath : (docPath.uri || docPath.path || docPath);
              console.log("✅ Found document directory via Paths.document");
            }
          } catch (e) {
            console.warn("⚠️ Error accessing Paths:", e);
          }
        }
        
        // Fallback to old API properties
        if (!baseDir) {
          const candidateBaseDirs = [
            fsAny.cacheDirectory,
            fsAny.directories?.cacheDirectory,
            fsAny.Directories?.cacheDirectory,
            fsAny.externalCacheDirectory,
            fsAny.directories?.externalCacheDirectory,
            fsAny.Directories?.externalCacheDirectory,
            fsAny.documentDirectory,
            fsAny.directories?.documentDirectory,
            fsAny.Directories?.documentDirectory,
            fsAny.externalDirectory,
            fsAny.externalStorageDirectory,
          ].filter(Boolean) as string[];
          
          baseDir = candidateBaseDirs.find(Boolean) || null;
          if (baseDir) {
            console.log("✅ Found directory via FileSystem properties");
          }
        }
      }
      
      if (!baseDir) {
        const fsAny = FileSystem as any;
        console.error("❌ FileSystem directory detection failed");
        console.error("  - Paths type:", typeof fsAny?.Paths);
        console.error("  - FileSystem keys:", Object.keys(FileSystem || {}).slice(0, 20));
        console.error("  - LegacyFS cacheDirectory:", LegacyFS?.cacheDirectory);
        console.error("  - LegacyFS documentDirectory:", LegacyFS?.documentDirectory);
        throw new Error(
          "FileSystem directories are not available. This may be an expo-file-system API issue.\n\n" +
          "Please try:\n" +
          "1. Update expo-file-system: npx expo install expo-file-system\n" +
          "2. Rebuild the app: npx expo run:android\n" +
          "3. This may work on a real device"
        );
      }

      console.log("✅ Using base directory:", baseDir);
      const normalizedBase = baseDir.replace(/\/?$/, "/");
      const downloadDir = `${normalizedBase}downloads/`;
      let downloadPath = `${downloadDir}${filename}`;

      // Ensure download directory exists; fallback to base if creation fails
      const { File, Directory } = FileSystem as any;
      try {
        const dirInfo =
          (Directory?.getInfoAsync && (await Directory.getInfoAsync(downloadDir))) ||
          (File?.getInfoAsync && (await File.getInfoAsync(downloadDir))) ||
          (await FileSystem.getInfoAsync(downloadDir)) ||
          { exists: false };
        if (!dirInfo?.exists) {
          if (Directory?.makeDirectoryAsync) {
            await Directory.makeDirectoryAsync(downloadDir, { intermediates: true });
          } else if (File?.makeDirectoryAsync) {
            await File.makeDirectoryAsync(downloadDir, { intermediates: true });
          } else {
            try {
              await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
            } catch {
              const Legacy = require("expo-file-system/legacy");
              await Legacy.makeDirectoryAsync(downloadDir, { intermediates: true });
            }
          }
          console.log("✅ Created download directory:", downloadDir);
        }
      } catch (dirErr: any) {
        console.warn("⚠️ Falling back to base directory for download:", dirErr);
        downloadPath = `${normalizedBase}${filename}`;
      }

      console.log("📥 Downloading to:", downloadPath);

      // Download with progress tracking
      // Use legacy API since createDownloadResumable is deprecated in new API
      const downloadResumable = LegacyFS.createDownloadResumable(
        downloadUrl,
        downloadPath,
        {},
        (downloadProgress: any) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          if (onProgress) {
            onProgress(progress);
          }
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result || !result.uri) {
        throw new Error("Download failed: No file received");
      }

      console.log("✅ APK downloaded successfully:", result.uri);

      // Reset database and logout user before installation
      // This ensures clean state after APK update
      console.log("🔄 Resetting database before APK installation...");
      try {
        await resetDatabase();
        console.log("✅ Database reset successfully");
        
        // Logout user
        useAuthStore.getState().logout();
        console.log("✅ User logged out");
      } catch (resetError: any) {
        console.error("❌ Error resetting database:", resetError);
        // Continue with installation even if reset fails
      }

      // Install the APK
      // On Android, we use Linking to open the file URI which triggers the package installer
      // The file:// URI from cache directory should be accessible by the package installer
      await appUpdateApi.installDownloadedApk(result.uri, filename);
    } catch (error: any) {
      console.error("❌ Error downloading/installing APK:", error);
      Alert.alert(
        "Installation Error",
        error.message || "Failed to download or install the update. Please try again."
      );
      throw error;
    }
  },

  /**
   * Helper function to install a downloaded APK file
   * This opens the Android package installer which handles the app replacement
   * Note: REQUEST_INSTALL_PACKAGES permission is declared in app.json
   * On Android 8.0+, users may need to grant "Install unknown apps" permission in Settings
   */
  async installDownloadedApk(apkUri: string, filename: string): Promise<void> {
    try {
      console.log("📦 Preparing to install APK from URI:", apkUri);
      
      // For Android 7.0+ (API 24+), file:// URIs are restricted and cannot be shared via Intent
      // We need to use FileProvider to convert file:// URIs to content:// URIs
      // expo-sharing handles this automatically by using FileProvider internally
      
      let installUri = apkUri;
      
      // Ensure we have a proper URI format
      if (!installUri.startsWith("file://") && !installUri.startsWith("content://")) {
        installUri = `file://${installUri}`;
      }
      
      console.log("📦 Opening installer with URI:", installUri);
      
      // Check if the URI is a file:// URI (which needs FileProvider conversion)
      if (installUri.startsWith("file://")) {
        // For file:// URIs on Android 7.0+, we need to convert to content:// URI using FileProvider
        // Use the legacy API's getContentUriAsync to convert without showing a share dialog
        try {
          console.log("📦 Converting file:// URI to content:// URI...");
          
          // Use legacy API to get content URI (converts file:// to content:// via FileProvider)
          const contentUri = await LegacyFileSystem.getContentUriAsync(installUri);
          console.log("✅ Got content URI:", contentUri);
          
          // Now use IntentLauncher to directly open the package installer
          // This bypasses the share dialog completely
          await startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              type: "application/vnd.android.package-archive",
              flags: 1, // FLAG_ACTIVITY_NEW_TASK
            }
          );
          
          console.log("✅ Successfully opened APK installer directly via IntentLauncher");
          Alert.alert(
            "Installation Started",
            `The APK installer has been opened.\n\n` +
            `Please follow the on-screen prompts to install ${filename}.\n\n` +
            `Note: Database has been reset. You will need to initialize it again after installation.`
          );
          return;
        } catch (contentUriError: any) {
          console.warn("⚠️ getContentUriAsync failed, trying fallback methods:", contentUriError);
          
          // Fallback 1: Try IntentLauncher with file:// URI (might work on older Android)
          try {
            await startActivityAsync(
              "android.intent.action.VIEW",
              {
                data: installUri,
                type: "application/vnd.android.package-archive",
                flags: 1, // FLAG_ACTIVITY_NEW_TASK
              }
            );
            console.log("✅ Opened APK installer via IntentLauncher (file:// fallback)");
            Alert.alert(
              "Installation Started",
              `The APK installer has been opened.\n\n` +
              `Please follow the on-screen prompts to install ${filename}.\n\n` +
              `Note: Database has been reset. You will need to initialize it again after installation.`
            );
            return;
          } catch (intentError: any) {
            console.warn("⚠️ IntentLauncher failed, trying Sharing as fallback:", intentError);
            
            // Fallback 2: Use Sharing (will show share dialog, but it's a last resort)
            try {
              const isAvailable = await Sharing.isAvailableAsync();
              if (isAvailable) {
                Alert.alert(
                  "Installing APK",
                  `A share menu will appear. Please select "Package Installer" or "Install" option.\n\n` +
                  `Note: Database has been reset. You will need to initialize it again after installation.`,
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Continue",
                      onPress: async () => {
                        try {
                          await Sharing.shareAsync(installUri, {
                            mimeType: "application/vnd.android.package-archive",
                            dialogTitle: `Install ${filename}`,
                          });
                          console.log("✅ Opened share dialog for APK installation (fallback)");
                          Alert.alert(
                            "Installation",
                            `Please select "Package Installer" or "Install" from the share menu.\n\n` +
                            `Note: Database has been reset. You will need to initialize it again after installation.`
                          );
                        } catch (err) {
                          console.error("❌ Error opening share dialog:", err);
                          Alert.alert("Error", "Failed to open installer. Please try again.");
                        }
                      },
                    },
                  ]
                );
                return;
              } else {
                throw new Error("Sharing not available");
              }
            } catch (shareError: any) {
              console.warn("⚠️ Sharing also failed, trying Linking as final fallback:", shareError);
              
              // Final fallback: Use Linking
              try {
                await Linking.openURL(installUri);
                console.log("✅ Opened APK installer via Linking (final fallback)");
                Alert.alert(
                  "Installation Started",
                  `The APK installer has been opened.\n\n` +
                  `Please follow the on-screen prompts to install ${filename}.`
                );
                return;
              } catch (linkError: any) {
                console.error("❌ All methods failed:", linkError);
                throw linkError;
              }
            }
          }
        }
      } else if (installUri.startsWith("content://")) {
        // If we already have a content:// URI, we can use IntentLauncher directly
        // This is the preferred method as it directly opens the package installer
        try {
          await startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: installUri,
              type: "application/vnd.android.package-archive",
              flags: 1, // FLAG_ACTIVITY_NEW_TASK
            }
          );
              console.log("✅ Successfully opened APK installer with content URI via IntentLauncher");
              Alert.alert(
                "Installation Started",
                `The APK installer has been opened.\n\n` +
                `Please follow the on-screen prompts to install ${filename}.\n\n` +
                `Note: Database has been reset. You will need to initialize it again after installation.`
              );
          return;
        } catch (intentError: any) {
          console.warn("⚠️ IntentLauncher failed, trying Linking as fallback:", intentError);
          // Fallback to Linking if IntentLauncher fails
          try {
            const canOpen = await Linking.canOpenURL(installUri);
            if (canOpen) {
              await Linking.openURL(installUri);
              console.log("✅ Successfully opened APK installer with content URI via Linking");
              Alert.alert(
                "Installation Started",
                `The APK installer has been opened.\n\n` +
                `Please follow the on-screen prompts to install ${filename}.\n\n` +
                `Note: Database has been reset. You will need to initialize it again after installation.`
              );
              return;
            } else {
              throw new Error("Cannot open content URI");
            }
          } catch (linkError: any) {
            console.error("❌ Error opening content URI:", linkError);
            throw linkError;
          }
        }
      } else {
        throw new Error(`Invalid URI format: ${installUri}`);
      }
    } catch (error: any) {
      console.error("❌ Error in installDownloadedApk:", error);
      
      const errorMessage = error?.message || String(error);
      
      // Check if it's the specific FileProvider error
      if (
        errorMessage.includes("exposed beyond app") ||
        errorMessage.includes("FileUriExposedException") ||
        errorMessage.includes("file://")
      ) {
        // This is the FileProvider error - provide helpful instructions
        Alert.alert(
          "Installation Error",
          `Unable to install APK due to Android security restrictions.\n\n` +
          `The file needs to be accessed via a file manager.\n\n` +
          `Please install manually:\n` +
          `1. Open a file manager app\n` +
          `2. Navigate to: ${apkUri}\n` +
          `3. Tap the APK file to install\n\n` +
          `Note: Database has been reset. You will need to initialize it again after installation.`
        );
      } else {
        // Other errors - show generic message
        Alert.alert(
          "Download Complete",
          `APK downloaded successfully: ${filename}\n\n` +
          `To install manually:\n` +
          `1. Open a file manager app\n` +
          `2. Navigate to: ${apkUri}\n` +
          `3. Tap the APK file to install\n\n` +
          `Note: Database has been reset. You will need to initialize it again after installation.`
        );
      }
      throw error;
    }
  },
};

