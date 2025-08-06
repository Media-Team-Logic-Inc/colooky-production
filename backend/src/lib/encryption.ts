import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derives a key from the encryption key using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypts sensitive data (like GitHub tokens) using AES-256-GCM
 * @param text - The text to encrypt
 * @returns Object containing encrypted data and metadata
 */
export function encryptToken(text: string): {
  encryptedData: string;
  iv: string;
  salt: string;
  tag: string;
} {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derive key from password + salt
  const key = deriveKey(process.env.ENCRYPTION_KEY, salt);
  
  // Create cipher
  const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the authentication tag
  const tag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypts data that was encrypted with encryptToken
 * @param encryptedObj - Object containing encrypted data and metadata
 * @returns The decrypted text
 */
export function decryptToken(encryptedObj: {
  encryptedData: string;
  iv: string;
  salt: string;
  tag: string;
}): string {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  if (!encryptedObj || !encryptedObj.encryptedData || !encryptedObj.iv || !encryptedObj.salt || !encryptedObj.tag) {
    throw new Error('Invalid encrypted data format');
  }

  try {
    // Convert hex strings back to buffers
    const salt = Buffer.from(encryptedObj.salt, 'hex');
    const iv = Buffer.from(encryptedObj.iv, 'hex');
    const tag = Buffer.from(encryptedObj.tag, 'hex');
    
    // Derive the same key
    const key = deriveKey(process.env.ENCRYPTION_KEY, salt);
    
    // Create decipher
    const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypts a GitHub access token for secure storage
 * @param token - The GitHub access token
 * @returns Encrypted token object suitable for database storage
 */
export function encryptGitHubToken(token: string): object {
  const encrypted = encryptToken(token);
  return {
    encrypted: true,
    data: encrypted.encryptedData,
    iv: encrypted.iv,
    salt: encrypted.salt,
    tag: encrypted.tag,
    algorithm: ALGORITHM,
    createdAt: new Date().toISOString()
  };
}

/**
 * Decrypts a GitHub access token from database storage
 * @param encryptedToken - The encrypted token object from database
 * @returns The decrypted GitHub access token
 */
export function decryptGitHubToken(encryptedToken: any): string {
  if (!encryptedToken || !encryptedToken.encrypted) {
    throw new Error('Token is not encrypted or invalid format');
  }

  return decryptToken({
    encryptedData: encryptedToken.data,
    iv: encryptedToken.iv,
    salt: encryptedToken.salt,
    tag: encryptedToken.tag
  });
}

/**
 * Generates a secure random encryption key
 * @returns A hex-encoded encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates that an encryption key is properly formatted
 * @param key - The encryption key to validate
 * @returns True if valid, throws error if invalid
 */
export function validateEncryptionKey(key: string): boolean {
  if (!key) {
    throw new Error('Encryption key cannot be empty');
  }
  
  if (key.length !== 64) {
    throw new Error('Encryption key must be exactly 64 characters (32 bytes hex-encoded)');
  }
  
  if (!/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error('Encryption key must be hex-encoded');
  }
  
  return true;
}