import CryptoJS from "crypto-js";
import forge from "node-forge";
import config from "../../lib/config/environment";

// RSA Public Key for Roadshow API (public keys are safe to hardcode)
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzXhD57NjO7zAa6Ot0Bmx
feB6RzdxzpeEzVYi14QdpINjMczoc4lQoUxa3ei+OXFRIHY9mtvpwHWneeayhDzA
EiXwNIJU+IL+nC25afVfajfy736Tphpd+DIsuLPxeUBm77Zt4dW0blBYZcTiUa2P
tw+v2Hpm/r5ahaedjJYrLpzTLCqDxhroqtESdPUf9Y/fO1XVnG75DnkRkIB8n/72
29EpiLCfbuKOqWTQkFOGNg8B4fSEjyy1mLpYoBiGc8D7/8ztZfHmOCt0Ji92HShU
ems7uMrKxJSm+sqj2c7HoVSnawyDYV4UU2XcJAKenh65Q7xjKCxFErMQrlIphc+I
cQIDAQAB
-----END PUBLIC KEY-----`;

// Cache the parsed RSA public key (parsing is expensive)
let cachedPublicKey: forge.pki.rsa.PublicKey | null = null;

function getPublicKey(): forge.pki.rsa.PublicKey {
  if (!cachedPublicKey) {
    cachedPublicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY);
  }
  return cachedPublicKey;
}

interface RoadshowOrderPayload {
  [key: string]: any;
}

interface EncryptedPayload {
  key: string;
  iv: string;
  data: string;
  delay: number;
}

// Encryption session to reuse key/IV for batch operations
interface EncryptionSession {
  aesKey: CryptoJS.lib.WordArray;
  iv: CryptoJS.lib.WordArray;
  encryptedKeyBase64: string;
  ivBase64: string;
}

/**
 * Creates a new encryption session with generated AES key and IV
 * Use this when encrypting multiple orders to avoid regenerating key/IV
 */
export function createEncryptionSession(): EncryptionSession {
  try {
    // Generate random AES key (32 bytes) and IV (16 bytes)
    const aesKeyBytes = forge.random.getBytesSync(32);
    const ivBytes = forge.random.getBytesSync(16);
    
    // Convert to CryptoJS format
    const aesKeyHex = forge.util.bytesToHex(aesKeyBytes);
    const ivHex = forge.util.bytesToHex(ivBytes);
    const aesKey = CryptoJS.enc.Hex.parse(aesKeyHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    
    // Encrypt AES key with RSA-OAEP (reuse cached public key)
    const publicKey = getPublicKey();
    const encryptedKey = publicKey.encrypt(aesKeyBytes, "RSA-OAEP", {
      md: forge.md.sha1.create(),
    });
    
    // Base64 encode key and IV
    const encryptedKeyBase64 = forge.util.encode64(encryptedKey);
    const ivBase64 = forge.util.encode64(ivBytes);
    
    return {
      aesKey,
      iv,
      encryptedKeyBase64,
      ivBase64,
    };
  } catch (error) {
    console.error("❌ Session creation error:", error);
    throw new Error(`Session creation failed: ${error}`);
  }
}

/**
 * Encrypts data using an existing encryption session
 * This is optimized for batch operations - key and IV are already prepared
 */
export function encryptWithSession(
  orderData: RoadshowOrderPayload,
  session: EncryptionSession
): EncryptedPayload {
  try {
    // Encrypt order data with AES-256-CBC using session's key and IV
    const payloadJson = JSON.stringify(orderData);
    const encrypted = CryptoJS.AES.encrypt(payloadJson, session.aesKey, {
      iv: session.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const encryptedDataBase64 = encrypted.ciphertext.toString(
      CryptoJS.enc.Base64
    );

    return {
      key: session.encryptedKeyBase64,
      iv: session.ivBase64,
      data: encryptedDataBase64,
      delay: 0,
    };
  } catch (error) {
    console.error("❌ Encryption error:", error);
    throw new Error(`Encryption failed: ${error}`);
  }
}

/**
 * Encrypts roadshow order data using AES-256-CBC + RSA-OAEP
 * Matches PHP's openssl_encrypt and openssl_public_encrypt
 * 
 * Note: This creates a new session for each call. For batch operations,
 * use createEncryptionSession() + encryptWithSession() instead.
 */
export async function encryptRoadshowOrder(
  orderData: RoadshowOrderPayload
): Promise<EncryptedPayload> {
  try {
    // Create a new session and encrypt the data
    const session = createEncryptionSession();
    return encryptWithSession(orderData, session);
  } catch (error) {
    console.error("❌ Encryption error:", error);
    throw new Error(`Encryption failed: ${error}`);
  }
}

/**
 * Encrypts multiple orders using the same encryption session (optimized)
 * This is much faster than calling encryptRoadshowOrder() for each order
 * 
 * @param orders Array of order data to encrypt
 * @returns Array of encrypted payloads with the same key/IV
 */
export function encryptBatchOrders(
  orders: RoadshowOrderPayload[]
): EncryptedPayload[] {
  // Create one session for all orders
  const session = createEncryptionSession();
  
  // Encrypt each order with the same session
  return orders.map(order => encryptWithSession(order, session));
}

/**
 * Posts encrypted roadshow order to server
 * @param orderData - The order data to encrypt and upload
 * @param uploadUrl - Optional URL to override the default from config
 */
export async function postRoadshowOrder(
  orderData: RoadshowOrderPayload,
  uploadUrl?: string
): Promise<any> {
  try {
    const encryptedPayload = await encryptRoadshowOrder(orderData);
    const url = uploadUrl || config.ROADSHOW_UPLOAD_URL;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(encryptedPayload),
    });

    const result = await response.json();

    if (result.msgg === "error" || result.msg === "error" || !response.ok) {
      throw new Error(
        result.description || result.title || `HTTP ${response.status}`
      );
    }

    return result;
  } catch (error) {
    console.error("❌ Upload error:", error);
    throw error;
  }
}
