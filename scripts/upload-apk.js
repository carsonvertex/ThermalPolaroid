const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");

const log = (msg) => console.log(`[upload-apk] ${msg}`);
const error = (msg) => console.error(`[upload-apk] ${msg}`);

async function main() {
  const projectRoot = process.cwd();

  // Helper: find latest APK in a directory
  const findLatestApk = (dir) => {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir);
    const apks = entries
      .filter((f) => f.toLowerCase().endsWith(".apk"))
      .map((f) => {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        return { full, mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    return apks[0]?.full || null;
  };

  // APK path (default release output). If missing, pick latest APK in release folder.
  const releaseDir = path.join(
    projectRoot,
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    "release"
  );

  let apkPath =
    process.env.APK_PATH ||
    path.join(releaseDir, "app-release.apk");

  if (!fs.existsSync(apkPath)) {
    const latest = findLatestApk(releaseDir);
    if (latest) {
      apkPath = latest;
      log(`APK not at default name; using latest in release folder: ${path.basename(apkPath)}`);
    }
  }

  if (!fs.existsSync(apkPath)) {
    throw new Error(
      `APK not found. Looked for:\n` +
      `- ${path.join(releaseDir, "app-release.apk")}\n` +
      `- any *.apk in ${releaseDir}\n` +
      `Set APK_PATH env to override. Run npm run build:apk first.`
    );
  }

  // Read version info from app.json unless overridden by env
  const appJsonPath = path.join(projectRoot, "app.json");
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  const versionCode =
    process.env.VERSION_CODE ||
    appJson?.expo?.android?.versionCode ||
    appJson?.expo?.versionCode;
  const versionName =
    process.env.VERSION_NAME || appJson?.expo?.version || "1.0.0";

  if (!versionCode) {
    throw new Error("versionCode not found. Set VERSION_CODE env or app.json expo.android.versionCode.");
  }

  // Upload target
  const apiBase =
    process.env.UPLOAD_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    // Fall back to the same production default as environment.ts
    "http://172.31.235.136:8080/api";
  const apiUrl = `${apiBase.replace(/\/$/, "")}/app-update/upload`;
  const token = process.env.UPLOAD_TOKEN || process.env.API_TOKEN;

  // Compute checksum
  const fileBuffer = fs.readFileSync(apkPath);
  const checksum = createHash("sha256").update(fileBuffer).digest("hex");
  const fileSize = fileBuffer.length;
  const fileName = path.basename(apkPath);

  log(`APK: ${apkPath}`);
  log(`Size: ${(fileSize / (1024 * 1024)).toFixed(1)} MB`);
  log(`SHA256: ${checksum}`);
  log(`versionCode: ${versionCode}, versionName: ${versionName}`);
  log(`Upload URL: ${apiUrl}`);

  // Build multipart form using built-in FormData/Blob (Node 18+)
  const form = new FormData();
  form.append("versionCode", String(versionCode));
  form.append("versionName", String(versionName));
  form.append("checksum", checksum);
  form.append(
    "file",
    new Blob([fileBuffer], {
      type: "application/vnd.android.package-archive",
    }),
    fileName
  );

  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: form,
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // leave as text
  }

  if (!response.ok) {
    error(`Upload failed (${response.status}): ${text.slice(0, 500)}`);
    process.exit(1);
  }

  log("Upload complete ✅");
  if (parsed) {
    log(`Response: ${JSON.stringify(parsed).slice(0, 500)}`);
  } else {
    log(`Response: ${text.slice(0, 500)}`);
  }
}

main().catch((err) => {
  error(err.message || err);
  process.exit(1);
});

