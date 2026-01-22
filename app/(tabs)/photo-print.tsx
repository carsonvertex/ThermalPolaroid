import { useDeviceInfo } from "@/hooks/use-device-info";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  useTheme,
} from "react-native-paper";

// Lazy load Sunmi printer libraries
let SunmiPrinterLibrary: any = null;
let ThermalPrinter: any = null;

try {
  SunmiPrinterLibrary = require("@mitsuharu/react-native-sunmi-printer-library");
} catch (e) {
  console.log("Sunmi printer library not available");
}

try {
  ThermalPrinter = require("@haroldtran/react-native-thermal-printer");
} catch (e) {
  console.log("Thermal printer library not available");
}

export default function  PhotoPrintScreen() {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const deviceInfo = useDeviceInfo();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageDimensions, setSelectedImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is admin
  const isAdmin =
    user?.role === "admin" || user?.role === "developer";

  // Check if device is Sunmi
  const isSunmiDevice =
    deviceInfo.brand?.toLowerCase().includes("sunmi") ||
    deviceInfo.modelName?.toLowerCase().includes("sunmi");

 

  const pickImage = async () => {
    try {
      setIsLoading(true);

      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          language === "en" ? "Permission Required" : "需要權限",
          language === "en"
            ? "Permission to access media library is required to select images."
            : "需要媒體庫權限才能選擇圖片。"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log("Selected image:", selectedAsset.uri, `${selectedAsset.width}x${selectedAsset.height}`);
        setSelectedImage(selectedAsset.uri);
        setSelectedImageDimensions(null); // Clear previous dimensions
        if (selectedAsset.width && selectedAsset.height) {
          setSelectedImageDimensions({ width: selectedAsset.width, height: selectedAsset.height });
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(
        language === "en" ? "Error" : "錯誤",
        language === "en"
          ? "Failed to pick image. Please try again."
          : "選擇圖片失敗。請重試。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);

      // Request permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          language === "en" ? "Permission Required" : "需要權限",
          language === "en"
            ? "Camera permission is required to take photos."
            : "需要相機權限才能拍攝照片。"
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedAsset = result.assets[0];
        console.log("Captured photo:", capturedAsset.uri, `${capturedAsset.width}x${capturedAsset.height}`);
        setSelectedImage(capturedAsset.uri);
        setSelectedImageDimensions(null); // Clear previous dimensions
        if (capturedAsset.width && capturedAsset.height) {
          setSelectedImageDimensions({ width: capturedAsset.width, height: capturedAsset.height });
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert(
        language === "en" ? "Error" : "錯誤",
        language === "en"
          ? "Failed to take photo. Please try again."
          : "拍攝照片失敗。請重試。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resize image for thermal printer compatibility while maintaining aspect ratio
  const resizeImageForPrinter = async (imageUri: string): Promise<string> => {
    try {
      console.log("Resizing image for thermal printer while maintaining aspect ratio...");

      // Thermal printer specifications (58mm paper = 384px width)
      const MAX_WIDTH = 384;  // Maximum width for 58mm thermal paper
      const MAX_HEIGHT = 1200; // Allow taller images but maintain aspect ratio

      // Use stored dimensions from image picker/camera
      let originalWidth = selectedImageDimensions?.width || MAX_WIDTH;
      let originalHeight = selectedImageDimensions?.height || MAX_WIDTH;

      console.log(`Using stored dimensions: ${originalWidth}x${originalHeight}`);

      // Calculate new dimensions maintaining aspect ratio
      const aspectRatio = originalWidth / originalHeight;
      let newWidth = MAX_WIDTH;
      let newHeight = Math.round(MAX_WIDTH / aspectRatio);

      // If calculated height is too tall, constrain it
      if (newHeight > MAX_HEIGHT) {
        newHeight = MAX_HEIGHT;
        newWidth = Math.round(MAX_HEIGHT * aspectRatio);

        // Ensure width doesn't exceed maximum
        if (newWidth > MAX_WIDTH) {
          newWidth = MAX_WIDTH;
          newHeight = Math.round(MAX_WIDTH / aspectRatio);
        }
      }

      console.log(`Calculated dimensions with aspect ratio: ${newWidth}x${newHeight} (ratio: ${aspectRatio.toFixed(2)})`);

      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: newWidth,
              height: newHeight,
            },
          },
        ],
        {
          compress: 0.8, // Good quality balance
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log("Image resized successfully:", manipResult.uri);
      console.log(`Final dimensions: ${manipResult.width}x${manipResult.height}`);

      return manipResult.uri;
    } catch (error) {
      console.error("Error resizing image:", error);
      // If resizing fails, return original URI and let printing handle it
      console.log("Resizing failed, using original image");
      return imageUri;
    }
  };

  // Convert image to monochrome bitmap (thermal printers work best with 1-bit images)
  const convertToMonochrome = async (imageUri: string): Promise<string> => {
    try {
      console.log("Converting image to monochrome for thermal printer...");

      // Apply extreme compression to create black and white effect
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: 384,
              height: 384, // Square format often works better
            },
          },
        ],
        {
          compress: 0.1, // Very low quality to force simple colors
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log("Monochrome conversion completed");
      return manipResult.uri;
    } catch (error) {
      console.error("Error converting to monochrome:", error);
      return imageUri; // Return original if conversion fails
    }
  };

  // Generate SVG for photo printing with embedded image data
  const generatePhotoSvg = async (imageUri: string): Promise<string> => {
    try {
      console.log("Generating SVG with embedded image data:", imageUri);

      // Note: imageUri should already be resized at this point
      let cleanedUri = imageUri
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .trim();

      console.log("Cleaned URI (should be resized):", cleanedUri);

      // For thermal printers, we MUST embed the actual image data
      // First, read the image file and convert to base64
      let imageBase64 = '';
      let mimeType = 'image/jpeg'; // default

      try {
        console.log("Reading image file as base64...");

        // Determine if it's a file that needs to be read or already a data URI
        if (cleanedUri.startsWith('data:')) {
          // Already a data URI, extract the base64 part
          const dataUriParts = cleanedUri.split(',');
          if (dataUriParts.length >= 2) {
            imageBase64 = dataUriParts[1];
            // Extract mime type from data URI
            const mimeMatch = cleanedUri.match(/data:([^;]+)/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
          }
          console.log(`Data URI processed, size: ${imageBase64.length} chars, type: ${mimeType}`);
        } else {
          // Read file from filesystem - try multiple methods like we did for APK files
          console.log("Reading file from filesystem:", cleanedUri);

          // Method 1: Try the standard readAsStringAsync (may be deprecated but still works)
          try {
            const fileContent = await FileSystem.readAsStringAsync(cleanedUri, {
              encoding: 'base64',
            });

            if (fileContent && fileContent.length > 0) {
              imageBase64 = fileContent;
              console.log(`File read with base64 encoding, size: ${imageBase64.length}`);
            } else {
              throw new Error("Empty file content");
            }
          } catch (method1Error) {
            console.log("Method 1 failed, trying alternative approach:", method1Error);

            // Method 2: Try without specifying encoding type (fallback)
            try {
              const fileContent = await FileSystem.readAsStringAsync(cleanedUri);
              if (fileContent && fileContent.length > 0) {
                // Convert to base64 if needed
                imageBase64 = Buffer.from(fileContent, 'binary').toString('base64');
                console.log(`File read and converted to base64, size: ${imageBase64.length}`);
              } else {
                throw new Error("Empty file content");
              }
            } catch (method2Error) {
              console.log("Method 2 failed, trying legacy API:", method2Error);

              // Method 3: Try legacy FileSystem API (like we did for APK files)
              try {
                const LegacyFS = require('expo-file-system/legacy');
                const fileContent = await LegacyFS.readAsStringAsync(cleanedUri, {
                  encoding: 'base64',
                });

                if (fileContent && fileContent.length > 0) {
                  imageBase64 = fileContent;
                  console.log(`File read with legacy API, size: ${imageBase64.length}`);
                } else {
                  throw new Error("Empty file content from legacy API");
                }
              } catch (method3Error) {
                console.log("All file reading methods failed");

                // Method 4: Try downloading the file to a temp location first (like APK approach)
                try {
                  console.log("Attempting to copy file to temp location...");
                  const documentDir = (FileSystem as any).documentDirectory ?? '';
                  const tempUri = documentDir + `temp_image_${Date.now()}.jpg`;

                  // Try to copy/download the file
                  if (cleanedUri.startsWith('file://')) {
                    // For file:// URIs, try copying
                    await FileSystem.copyAsync({
                      from: cleanedUri,
                      to: tempUri
                    });
                  } else {
                    // For other URIs, try downloading
                    await FileSystem.downloadAsync(cleanedUri, tempUri);
                  }

                  // Now read the temp file
                  const tempContent = await FileSystem.readAsStringAsync(tempUri, {
                    encoding: 'base64',
                  });

                  if (tempContent && tempContent.length > 0) {
                    imageBase64 = tempContent;
                    console.log(`File copied and read, size: ${imageBase64.length}`);

                    // Clean up temp file
                    await FileSystem.deleteAsync(tempUri, { idempotent: true });
                  } else {
                    throw new Error("Temp file is empty");
                  }
                } catch (method4Error) {
                  console.error("All file reading methods failed completely");
                  const getErrorMessage = (error: any): string => {
                    if (error && typeof error === 'object' && error.message) {
                      return error.message;
                    }
                    return String(error || 'unknown');
                  };

                  throw new Error(
                    `File reading failed: Method1: ${getErrorMessage(method1Error)}, ` +
                    `Method2: ${getErrorMessage(method2Error)}, ` +
                    `Method3: ${getErrorMessage(method3Error)}, ` +
                    `Method4: ${getErrorMessage(method4Error)}`
                  );
                }
              }
            }
          }

          // Determine MIME type from file extension or URI
          if (cleanedUri.toLowerCase().includes('.png') || cleanedUri.toLowerCase().endsWith('.png')) {
            mimeType = 'image/png';
          } else if (cleanedUri.toLowerCase().includes('.gif') || cleanedUri.toLowerCase().endsWith('.gif')) {
            mimeType = 'image/gif';
          } else {
            mimeType = 'image/jpeg'; // default for most formats
          }
        }


        console.log(`Image processing complete, size: ${imageBase64.length} chars, type: ${mimeType}`);

      } catch (fileError) {
        console.error("Error reading image file:", fileError);
        const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
        throw new Error(
          language === "en"
            ? `Could not read image file: ${errorMessage}. Try selecting a different image or check file permissions.`
            : `無法讀取圖片檔案: ${errorMessage}。請嘗試選擇其他圖片或檢查檔案權限。`
        );
      }

      // Thermal printer dimensions (58mm paper = 384px width)
      const printerWidth = 384;
      const printerHeight = 512; // Maintain aspect ratio, adjust based on image aspect ratio if needed

      // Create SVG with EMBEDDED image data (not file reference)
      const dataUri = `data:${mimeType};base64,${imageBase64}`;
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${printerWidth}" height="${printerHeight}" viewBox="0 0 ${printerWidth} ${printerHeight}">
  <image href="${dataUri}" width="${printerWidth}" height="${printerHeight}" x="0" y="0"/>
</svg>`.trim();

      console.log("SVG with embedded image data generated successfully");
      return svgContent;

    } catch (error) {
      console.error("Error generating SVG with embedded image:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        language === "en"
          ? `Failed to generate SVG with image: ${errorMessage}`
          : `生成帶圖片的 SVG 失敗: ${errorMessage}`
      );
    }
  };

  // Convert SVG to base64 for printing (fallback method if direct SVG printing fails)
  const convertSvgToBase64 = async (svgContent: string): Promise<string> => {
    try {
      console.log("Converting SVG to base64...");

      // Convert SVG string to base64
      const svgBase64 = Buffer.from(svgContent).toString('base64');

      // Return as data URI
      const base64Uri = `data:image/svg+xml;base64,${svgBase64}`;
      console.log("SVG to base64 conversion successful");
      return base64Uri;
    } catch (error) {
      console.error("Error converting SVG to base64:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        language === "en"
          ? `Failed to convert SVG to base64: ${errorMessage}`
          : `將 SVG 轉換為 base64 失敗: ${errorMessage}`
      );
    }
  };

  // Check printer connectivity
  const checkPrinterConnectivity = async (): Promise<boolean> => {
    if (!isSunmiDevice || !SunmiPrinterLibrary) {
      return false;
    }

    try {
      // Try different methods to check connectivity
      if (SunmiPrinterLibrary.getPrinterStatus) {
        const status = await SunmiPrinterLibrary.getPrinterStatus();
        console.log("Printer status check:", status);
        return status === 0 || status === 1; // 0 = ready, 1 = printing
      }

      if (SunmiPrinterLibrary.isConnected) {
        const connected = await SunmiPrinterLibrary.isConnected();
        console.log("Printer connection check:", connected);
        return connected;
      }

      // If no status method available, try a simple prepare call
      await SunmiPrinterLibrary.prepare();
      console.log("Printer prepare successful - assuming connected");
      return true;
    } catch (error) {
      console.log("Printer connectivity check failed:", error);
      return false;
    }
  };

  const printImage = async () => {
    if (!selectedImage) {
      Alert.alert(
        language === "en" ? "No Image" : "沒有圖片",
        language === "en"
          ? "Please select an image first"
          : "請先選擇一張圖片"
      );
      return;
    }

    try {
      setIsPrinting(true);

      // Step 1: Check printer connectivity first
      console.log("Checking printer connectivity...");
      const isPrinterConnected = await checkPrinterConnectivity();

      if (!isPrinterConnected) {
        Alert.alert(
          language === "en" ? "Printer Not Connected" : "打印機未連接",
          language === "en"
            ? "The printer is not connected or not ready. Please check:\n\n• Printer is powered on\n• Printer is properly connected\n• Printer has paper\n• Device is paired with printer"
            : "打印機未連接或未準備好。請檢查：\n\n• 打印機是否開啟電源\n• 打印機是否正確連接\n• 打印機是否有紙張\n• 設備是否與打印機配對"
        );
        return;
      }

      console.log("Printer connectivity check passed");

      // Try new thermal printer library first (works with Sunmi and other thermal printers)
      if (isSunmiDevice && ThermalPrinter) {
        try {
          console.log("Using @haroldtran/react-native-thermal-printer library");
          
          // Clean the image URI (remove newlines, etc.)
          let cleanedUri = selectedImage
            .replace(/\n/g, '')
            .replace(/\r/g, '')
            .trim();
          
          // Fix file extension if needed
          if (!cleanedUri.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp)$/)) {
            if (cleanedUri.toLowerCase().endsWith('jpeg')) {
              cleanedUri = cleanedUri.replace(/jpeg$/i, '.jpeg');
            } else if (cleanedUri.toLowerCase().endsWith('jpg')) {
              cleanedUri = cleanedUri.replace(/jpg$/i, '.jpg');
            }
          }
          
          console.log("Cleaned image URI:", cleanedUri);
          
          // Check if file exists
          try {
            const { File, Directory } = FileSystem as any;
            const fileInfo =
              (File?.getInfoAsync && (await File.getInfoAsync(cleanedUri))) ||
              (Directory?.getInfoAsync && (await Directory.getInfoAsync(cleanedUri))) ||
              { exists: false };
            if (!fileInfo?.exists) {
              throw new Error(`File does not exist: ${cleanedUri}`);
            }
            console.log("File exists, size:", fileInfo.size);
          } catch (infoError) {
            console.error("Error checking file:", infoError);
            throw new Error(`Cannot access file: ${cleanedUri}`);
          }
          
          // Initialize the printer
          console.log("Initializing thermal printer...");
          await ThermalPrinter.init();
          console.log("Printer initialized");
          
          // Print the image (library handles file path directly)
          // The library may accept file path or Base64, try file path first
          console.log("Printing image from path:", cleanedUri);
          await ThermalPrinter.printImage(cleanedUri);
          console.log("✓ Image printed successfully");
          
          Alert.alert(
            language === "en" ? "Success" : "成功",
            language === "en"
              ? "Image printed successfully."
              : "圖片已成功列印。"
          );
          return;
        } catch (thermalError) {
          console.error("Thermal printer error:", thermalError);
          const errorMsg = thermalError instanceof Error ? thermalError.message : String(thermalError);
          console.log(`Thermal printer failed: ${errorMsg}, falling back to Sunmi printer library...`);
          // Fall through to try the old library
        }
      }

      // Fallback to original Sunmi printer library
      if (isSunmiDevice && SunmiPrinterLibrary) {
        try {
          // Step 1: Check printer connectivity before preparing
          console.log("Checking Sunmi printer connectivity...");

          // Try to get printer status first (if available)
          let printerConnected = false;
          try {
            if (SunmiPrinterLibrary.getPrinterStatus) {
              const status = await SunmiPrinterLibrary.getPrinterStatus();
              console.log("Printer status:", status);
              // Status 0 usually means ready/connected
              printerConnected = status === 0 || status === 1;
            } else if (SunmiPrinterLibrary.isConnected) {
              printerConnected = await SunmiPrinterLibrary.isConnected();
              console.log("Printer connected:", printerConnected);
            } else {
              // If no status method available, assume we can try to prepare
              printerConnected = true;
            }
          } catch (statusError) {
            console.log("Could not check printer status, will attempt to prepare anyway:", statusError);
            printerConnected = true; // Try anyway
          }

          if (!printerConnected) {
            throw new Error(
              language === "en"
                ? "Printer is not connected. Please check if the printer is properly connected and powered on."
                : "打印機未連接。請檢查打印機是否正確連接並開啟電源。"
            );
          }

          // Step 2: Prepare the printer
          console.log("Preparing Sunmi printer...");
          await SunmiPrinterLibrary.prepare();
          console.log("Printer ready");

          // Step 2: Resize image for thermal printer
          console.log("Resizing image for thermal printer...");
          const resizedImageUri = await resizeImageForPrinter(selectedImage);
          console.log("Image resized for printer:", resizedImageUri);

          // Step 3: Also create a monochrome version for thermal printers
          console.log("Creating monochrome version...");
          const monochromeImageUri = await convertToMonochrome(resizedImageUri);
          console.log("Monochrome version created:", monochromeImageUri);

          // Step 3: Generate SVG with embedded image data (from resized image)
          console.log("Generating SVG with embedded image data...");
          const svgContent = await generatePhotoSvg(resizedImageUri);
          console.log("SVG generated, length:", svgContent.length);

          // Step 4: Also generate SVG with monochrome image
          console.log("Generating monochrome SVG...");
          const monochromeSvgContent = await generatePhotoSvg(monochromeImageUri);
          console.log("Monochrome SVG generated, length:", monochromeSvgContent.length);

          // For thermal printers, we need to check if they can handle SVG directly
          // If not, we'll need to convert to a raster format

          // First, try to use the SVG content directly if the printer supports it
          let printData = svgContent;
          let printDataType = 'svg';

          // Convert SVG to base64 for printer compatibility (most printers need this)
          console.log("Converting SVG to base64...");
          const svgBase64Uri = await convertSvgToBase64(svgContent);
          console.log("SVG converted to base64, length:", svgBase64Uri.length);

          // Use the base64 version as it's more compatible with thermal printers
          printData = svgBase64Uri;
          printDataType = 'svg-base64';

          // Extract just the Base64 string (remove data URI prefix if present)
          // Some printer libraries need just the Base64 string, not the full data URI
          let base64Image = svgBase64Uri;
          if (svgBase64Uri.includes(',')) {
            base64Image = svgBase64Uri.split(',')[1];
            console.log("Extracted Base64 string (without data URI prefix), length:", base64Image.length);
          }

          console.log(`Using ${printDataType} format for printing`);

          // Step 3: Set alignment (optional, for better formatting)
          try {
            if (SunmiPrinterLibrary.setAlignment) {
              await SunmiPrinterLibrary.setAlignment('center');
            }
          } catch (alignError) {
            console.log("setAlignment not supported or failed:", alignError);
          }

          // Step 4: Print the image
          // Width: 384 dots for 58mm paper, 576 for 80mm paper
          // Mode: 'grayscale' for better photo quality, 'binary' for sharper/faster
          // Note: For best results, resize images to match printer width before printing
          // (e.g., 384px for 58mm, 576px for 80mm) to avoid distortion
          const printerWidth = 384; // 58mm thermal paper (adjust if using 80mm = 576)
          const printMode = 'grayscale'; // Use 'binary' for faster printing if needed
          
          console.log(`Printing image with width: ${printerWidth}, mode: ${printMode}`);

          if (!SunmiPrinterLibrary.printImage) {
            throw new Error(
              language === "en"
                ? "printImage method not available in Sunmi printer library"
                : "Sunmi 打印機庫中沒有 printImage 方法"
            );
          }

          // printImage with multiple formats for thermal printer compatibility
          let printSuccess = false;

          const printerHeight = 512; // Aspect ratio for image printing

          // Extract monochrome data for separate attempts
          let monochromeBase64 = '';
          if (monochromeSvgContent) {
            const monoMatch = monochromeSvgContent.match(/data:[^;]+;base64,([^"']+)/);
            if (monoMatch && monoMatch[1]) {
              monochromeBase64 = monoMatch[1];
              console.log("Monochrome base64 extracted, length:", monochromeBase64.length);
            }
          }

          console.log(`Attempting to print with multiple formats...`);
          console.log(`Image dimensions: ${printerWidth}x${printerHeight}, mode: ${printMode}`);
          console.log(`Color image data length: ${base64Image.length} characters`);
          console.log(`Monochrome data length: ${monochromeBase64.length} characters`);

          // First, test if printer can print at all with a simple text
          try {
            console.log("Testing printer with simple text...");
            if (SunmiPrinterLibrary.printText) {
              await SunmiPrinterLibrary.printText("=== PHOTO PRINT TEST ===\n");
              console.log("Test text sent to printer");
              // Add a small delay to let the text print
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (testError) {
            console.log("Test text failed:", testError);
          }

          // Try a simple bitmap pattern that thermal printers can definitely handle
          try {
            console.log("Testing with simple bitmap pattern...");
            // Create a simple 8x8 checkerboard pattern in base64
            // This is a minimal bitmap that should work on most thermal printers
            const simpleBitmapBase64 = "AAABAAEAAQEAAAEAAgAAAgAAAAEAIAAAAAAAAAEA" +
              "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
              "AAAAAAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA";

            console.log("Sending simple bitmap pattern...");
            await SunmiPrinterLibrary.printImage(simpleBitmapBase64, 8, 'binary');
            console.log("Simple bitmap sent successfully");
            await new Promise(resolve => setTimeout(resolve, 1000));

            // If this works, try a slightly more complex pattern
            const patternBase64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/vAA=";

            console.log("Testing with pattern image...");
            await SunmiPrinterLibrary.printImage(patternBase64, 32, 'grayscale');
            console.log("Pattern image sent successfully");
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (bitmapError) {
            console.log("Bitmap test failed:", bitmapError);
          }

          try {
            // Primary method: Send the raw image data directly (not SVG)
            console.log("Trying raw image data directly...");
            console.log("Image data preview:", base64Image.substring(0, 50) + "...");

            // Extract raw image data if it's embedded in SVG
            let imageDataToSend = base64Image;
            if (svgContent && svgContent.includes('data:image')) {
              const match = svgContent.match(/data:image\/[^;]+;base64,([^"']+)/);
              if (match && match[1]) {
                imageDataToSend = match[1];
                console.log("Using extracted image data from SVG");
              }
            }

            // Try different image sizes and modes
            console.log(`Sending image with dimensions ${printerWidth}x${printerHeight}, mode: ${printMode}`);
            await SunmiPrinterLibrary.printImage(imageDataToSend, printerWidth, printMode);
            printSuccess = true;
            console.log("✓ Raw image data sent to printer successfully");

            // Add white space after the photo
            try {
              console.log("Adding white space after photo...");
              if (SunmiPrinterLibrary.printText) {
                // Add several blank lines for white space
                await SunmiPrinterLibrary.printText("\n\n\n");
                console.log("White space added after photo");
              }

              // Try to feed paper if available
              if (SunmiPrinterLibrary.feedPaper && typeof SunmiPrinterLibrary.feedPaper === 'function') {
                try {
                  await SunmiPrinterLibrary.feedPaper(3); // Feed 3 units of paper
                  console.log("Paper fed after photo");
                } catch (feedError) {
                  console.log("Paper feed not supported or failed:", feedError);
                }
              }
            } catch (spaceError) {
              console.log("Could not add white space:", spaceError);
            }

            // Note: Monochrome version is available but not automatically printed
            // Users can request monochrome printing separately if needed
            if (monochromeBase64) {
              console.log("Monochrome version available but not printed (commented out feature)");
            }
          } catch (printError1) {
            console.log("SVG base64 print failed:", printError1);

            // Check if it's a connectivity error
            const errorMsg = printError1 instanceof Error ? printError1.message : String(printError1);
            if (errorMsg.toLowerCase().includes('connect') ||
                errorMsg.toLowerCase().includes('printer') ||
                errorMsg.toLowerCase().includes('disconnect')) {
              throw new Error(
                language === "en"
                  ? `Printer connection error: ${errorMsg}. Please check if the printer is connected and powered on.`
                  : `打印機連接錯誤：${errorMsg}。請檢查打印機是否連接並開啟電源。`
              );
            }

            // Fallback: Try with full data URI
            try {
              console.log("Trying full SVG data URI...");
              await SunmiPrinterLibrary.printImage(svgBase64Uri, printerWidth, printMode);
              printSuccess = true;
              console.log("✓ SVG data URI printed successfully");

              // Add white space after the photo
              try {
                console.log("Adding white space after SVG data URI photo...");
                if (SunmiPrinterLibrary.printText) {
                  await SunmiPrinterLibrary.printText("\n\n\n");
                }
                if (SunmiPrinterLibrary.feedPaper && typeof SunmiPrinterLibrary.feedPaper === 'function') {
                  try {
                    await SunmiPrinterLibrary.feedPaper(3);
                  } catch (feedError) {
                    console.log("Paper feed failed:", feedError);
                  }
                }
              } catch (spaceError) {
                console.log("Could not add white space:", spaceError);
              }
            } catch (printError2) {
              console.log("SVG data URI print also failed:", printError2);

              // Fallback: Try sending just the embedded image data directly
              try {
                console.log("Trying to extract and send just the embedded image data...");

                // The SVG contains: data:image/jpeg;base64,[base64data]
                // We need to extract just the [base64data] part
                const embeddedImageMatch = svgContent.match(/data:[^;]+;base64,([^"']+)/);
                if (embeddedImageMatch && embeddedImageMatch[1]) {
                  const embeddedBase64 = embeddedImageMatch[1];
                  console.log("Extracted embedded image data, length:", embeddedBase64.length);
                  console.log("Embedded data preview:", embeddedBase64.substring(0, 50) + "...");

                  await SunmiPrinterLibrary.printImage(embeddedBase64, printerWidth, printMode);
                  printSuccess = true;
                  console.log("✓ Embedded image data printed successfully");

                  // Add white space after the photo
                  try {
                    console.log("Adding white space after embedded image...");
                    if (SunmiPrinterLibrary.printText) {
                      await SunmiPrinterLibrary.printText("\n\n\n");
                    }
                    if (SunmiPrinterLibrary.feedPaper && typeof SunmiPrinterLibrary.feedPaper === 'function') {
                      try {
                        await SunmiPrinterLibrary.feedPaper(3);
                      } catch (feedError) {
                        console.log("Paper feed failed:", feedError);
                      }
                    }
                  } catch (spaceError) {
                    console.log("Could not add white space:", spaceError);
                  }
                } else {
                  console.log("Could not find embedded image data pattern in SVG");
                  console.log("SVG content preview:", svgContent.substring(0, 200) + "...");
                  throw new Error("Could not extract embedded image data from SVG");
                }
              } catch (printError3) {
                console.log("All printing methods failed:", printError3);

                const errorMsg3 = printError3 instanceof Error ? printError3.message : String(printError3);

                // Provide specific error messages based on the error
                if (errorMsg3.toLowerCase().includes('printimage is failed') ||
                    errorMsg3.toLowerCase().includes('printimage failed')) {
                  throw new Error(
                    language === "en"
                      ? "Printer error: Could not print the image. Please check:\n• Printer is connected and powered on\n• Printer has paper\n• Image format is supported\n• Try a smaller or different image"
                      : "打印機錯誤：無法打印圖片。請檢查：\n• 打印機是否連接並開啟電源\n• 打印機是否有紙張\n• 圖片格式是否支援\n• 嘗試使用較小或不同的圖片"
                  );
                }

                throw new Error(
                  language === "en"
                    ? `Image printing failed: ${errorMsg3}. The image may be too large or in an unsupported format.`
                    : `圖片打印失敗：${errorMsg3}。圖片可能太大或格式不支援。`
                );
              }
            }
          }

          if (!printSuccess) {
            // Try one final test with a known working minimal image
            try {
              console.log("Final test: trying minimal PNG...");
              const testPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
              await SunmiPrinterLibrary.printImage(testPng, 1, 'binary');
              console.log("Minimal test PNG worked - printer connection OK");

              Alert.alert(
                language === "en" ? "Printer Connection OK" : "打印機連接正常",
                language === "en"
                  ? "Printer is connected and working, but the selected image format is not compatible. Try a different image."
                  : "打印機連接正常工作，但所選圖片格式不相容。請嘗試不同的圖片。"
              );
              return;
            } catch (finalTestError) {
              console.log("Final test failed:", finalTestError);
              throw new Error(
                language === "en"
                  ? "Printer connection failed. Please check printer power and connection."
                  : "打印機連接失敗。請檢查打印機電源和連接。"
              );
            }
          }

          // If we get here, printing was successful
          console.log("Printing completed successfully");

          // Add a delay to ensure printing finishes before showing success message
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Step 5: Cut paper (if supported)
          try {
            if (SunmiPrinterLibrary.cutPaper) {
              await SunmiPrinterLibrary.cutPaper();
            }
          } catch (cutError) {
            console.log("Paper cut not supported or failed:", cutError);
          }

          // Add a delay to ensure printing finishes before showing success message
          await new Promise(resolve => setTimeout(resolve, 1000));

          Alert.alert(
            language === "en" ? "Print Command Sent" : "打印命令已發送",
            language === "en"
              ? `Print command completed!\n\nFormat: ${printDataType}\nData size: ${base64Image.length} chars\nDimensions: ${printerWidth}x${printerHeight}\n\nIf you don't see the printout, check:\n• Printer has paper\n• Image format is supported\n• Printer is not out of order`
              : `打印命令已完成！\n\n格式: ${printDataType}\n數據大小: ${base64Image.length} 字符\n尺寸: ${printerWidth}x${printerHeight}\n\n如果沒有看到列印輸出，請檢查：\n• 打印機有紙張\n• 圖片格式是否支援\n• 打印機是否正常運作`
          );
        } catch (sunmiError) {
          console.error("Sunmi print error:", sunmiError);
          const errorMsg = sunmiError instanceof Error ? sunmiError.message : String(sunmiError);
          
          // Check if it's a Base64 conversion error
          if (errorMsg.includes("Base64") || errorMsg.includes("base64")) {
            throw new Error(
              language === "en"
                ? `Image conversion error: ${errorMsg}. Please check if the image file is valid and accessible.`
                : `圖片轉換錯誤：${errorMsg}。請檢查圖片文件是否有效且可訪問。`
            );
          }
          
          throw new Error(
            language === "en"
              ? `Sunmi printer error: ${errorMsg}. Please check if printer is connected.`
              : `Sunmi 打印機錯誤：${errorMsg}。請檢查打印機是否已連接。`
          );
        }
      } else {
        // No printer available for non-Sunmi devices
        Alert.alert(
          language === "en" ? "Printer Not Available" : "打印機不可用",
          language === "en"
            ? "Photo printing is only available on Sunmi devices with a built-in printer."
            : "照片列印僅在帶有內置打印機的 Sunmi 設備上可用。"
        );
      }
    } catch (error) {
      console.error("Print error:", error);
      Alert.alert(
        language === "en" ? "Error" : "錯誤",
        language === "en"
          ? `Failed to print:\n${
              error instanceof Error ? error.message : String(error)
            }`
          : `列印失敗：\n${
              error instanceof Error ? error.message : String(error)
            }`
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        <Text
          variant="headlineMedium"
          style={{
            marginBottom: 24,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {language === "en" ? "Photo Print" : "照片列印"}
        </Text>

        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              {language === "en"
                ? "Select a photo from your gallery or take a new photo to print."
                : "從相冊選擇照片或拍攝新照片進行列印。"}
            </Text>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Button
                  mode="outlined"
                  onPress={pickImage}
                  disabled={isLoading}
                  icon="image"
                >
                  {language === "en" ? "Gallery" : "相冊"}
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  mode="outlined"
                  onPress={takePhoto}
                  disabled={isLoading}
                  icon="camera"
                >
                  {language === "en" ? "Camera" : "相機"}
                </Button>
              </View>
            </View>

            {isLoading && (
              <View style={{ alignItems: "center", padding: 16 }}>
                <ActivityIndicator size="large" />
              </View>
            )}

            {selectedImage && (
              <View style={{ marginTop: 16 }}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: "100%",
                    height: 300,
                    borderRadius: 8,
                    resizeMode: "contain",
                  }}
                />
                <Button
                  mode="contained"
                  onPress={printImage}
                  disabled={isPrinting}
                  loading={isPrinting}
                  icon="printer"
                  style={{ marginTop: 16 }}
                >
                  {language === "en" ? "Print Photo" : "列印照片"}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setSelectedImage(null)}
                  disabled={isPrinting}
                  style={{ marginTop: 8 }}
                >
                  {language === "en" ? "Clear" : "清除"}
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {isSunmiDevice && (
          <Card style={{ backgroundColor: theme.colors.primaryContainer }}>
            <Card.Content>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {language === "en"
                  ? "Sunmi printer detected. Image will be printed using the built-in printer."
                  : "檢測到 Sunmi 打印機。圖片將使用內置打印機列印。"}
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}


