import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY!;
  if (key.length < 32) {
    // Pad the key if it's too short
    return crypto.scryptSync(key, 'salt', 32);
  }
  return Buffer.from(key.slice(0, 32));
}

function encryptToken(text: string): {
  encryptedData: string;
  iv: string;
} {
  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Get key
  const key = getKey();
  
  // Create cipher
  const cipher = crypto.createCipher(ALGORITHM, key);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
  };
}

export function encryptGitHubToken(token: string): object {
  const encrypted = encryptToken(token);
  return {
    encrypted: true,
    data: encrypted.encryptedData,
    iv: encrypted.iv,
    algorithm: ALGORITHM,
    createdAt: new Date().toISOString(),
  };
}

function decryptToken(encryptedObj: {
  encryptedData: string;
  iv: string;
}): string {
  const { encryptedData, iv } = encryptedObj;
  
  // Get key
  const key = getKey();
  
  // Create decipher
  const decipher = crypto.createDecipher(ALGORITHM, key);
  
  // Decrypt
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function decryptGitHubToken(encryptedToken: any): string {
  if (typeof encryptedToken === 'string') {
    // Handle plain text tokens (backward compatibility)
    return encryptedToken;
  }
  
  if (!encryptedToken?.encrypted || !encryptedToken?.data) {
    throw new Error('Invalid encrypted token format');
  }
  
  try {
    return decryptToken({
      encryptedData: encryptedToken.data,
      iv: encryptedToken.iv,
    });
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt GitHub token');
  }
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}