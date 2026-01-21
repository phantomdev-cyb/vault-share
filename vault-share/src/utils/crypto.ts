/**
 * VAULT SHARE CRYPTOGRAPHY ENGINE
 * -------------------------------
 * Standards Compliance:
 * - NIST SP 800-38D (AES-GCM)
 * - NIST SP 800-132 (PBKDF2 Password Hashing)
 * * Security Guarantee:
 * - Zero Knowledge: The server never sees the key.
 * - Authenticated Encryption: Detects tampering.
 */

// Configuration Constants
const PBKDF2_ITERATIONS = 100000; // High cost factor to resist brute-force
const SALT_LENGTH = 16;           // 128-bit Salt
const IV_LENGTH = 12;             // 96-bit IV (Standard for GCM)
const KEY_LENGTH = 256;           // AES-256 (Top Secret clearance level)

/**
 * Encrypts a file using a password.
 * Returns a Blob containing: [Salt + IV + EncryptedData]
 */
export async function encryptFile(file: File, password: string): Promise<{ encryptedBlob: Blob; fileName: string }> {
  try {
    const textEncoder = new TextEncoder();
    
    // 1. Generate Cryptographically Secure Random Salt
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

    // 2. Import Password as Key Material
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw", 
      textEncoder.encode(password), 
      { name: "PBKDF2" }, 
      false, 
      ["deriveKey"]
    );

    // 3. Derive the AES-GCM Key
    // This transforms the weak human password into a strong 256-bit key
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: KEY_LENGTH },
      false,
      ["encrypt"]
    );

    // 4. Generate Random IV (Initialization Vector)
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // 5. Read and Encrypt File Data
    const fileBuffer = await file.arrayBuffer();
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      fileBuffer
    );

    // 6. Package the Payload
    // We combine Salt, IV, and Data into one Blob so we can store them together.
    const encryptedBlob = new Blob([salt, iv, encryptedContent], {
      type: "application/octet-stream",
    });

    return {
      encryptedBlob,
      fileName: `${file.name}.enc`, // Appending .enc avoids confusion
    };

  } catch (error) {
    console.error("Encryption Logic Failure:", error);
    throw new Error("Encryption failed. Your data was not secured.");
  }
}

/**
 * Decrypts a blob using a password.
 * Reverses the packaging process.
 */
export async function decryptFile(encryptedBlob: Blob, password: string): Promise<Blob> {
  try {
    const arrayBuffer = await encryptedBlob.arrayBuffer();
    const textEncoder = new TextEncoder();

    // 1. Extract Parameters from the Blob
    // We strictly slice the buffer based on our defined lengths.
    const salt = arrayBuffer.slice(0, SALT_LENGTH);
    const iv = arrayBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = arrayBuffer.slice(SALT_LENGTH + IV_LENGTH);

    // 2. Import Password
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw", 
      textEncoder.encode(password), 
      { name: "PBKDF2" }, 
      false, 
      ["deriveKey"]
    );

    // 3. Re-Derive the Key
    // We must use the EXACT same Salt and Iterations to get the same key.
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new Uint8Array(salt),
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: KEY_LENGTH },
      false,
      ["decrypt"]
    );

    // 4. Decrypt
    // If the password is wrong, this step will throw an error (GCM Integrity Check).
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      key,
      ciphertext
    );

    return new Blob([decryptedContent]);

  } catch (error) {
    // A specific error here usually means "Wrong Password"
    console.error("Decryption Logic Failure:", error);
    throw new Error("Decryption failed. Incorrect password or corrupted file.");
  }
}