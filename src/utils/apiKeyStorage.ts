/**
 * Secure API Key Storage Utility
 * 
 * This module provides secure storage for user-provided Google API keys using:
 * - Web Crypto API for encryption
 * - IndexedDB for persistent storage
 * - Device-specific salt for additional security
 */

interface StoredApiKey {
  encryptedKey: ArrayBuffer;
  iv: ArrayBuffer;
  salt: ArrayBuffer;
  timestamp: number;
}

class ApiKeyStorage {
  private readonly DB_NAME = 'RecettierSecureStorage';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'apiKeys';
  private readonly KEY_ID = 'googleApiKey';
  
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  /**
   * Generate a device-specific salt for key derivation
   */
  private async getDeviceSalt(): Promise<ArrayBuffer> {
    const stored = localStorage.getItem('recettier_device_salt');
    if (stored) {
      return Uint8Array.from(atob(stored), c => c.charCodeAt(0)).buffer;
    }

    // Generate new salt
    const salt = crypto.getRandomValues(new Uint8Array(32));
    localStorage.setItem('recettier_device_salt', btoa(String.fromCharCode(...salt)));
    return salt.buffer;
  }

  /**
   * Derive an encryption key from the device salt and current session
   */
  private async deriveKey(salt: ArrayBuffer): Promise<CryptoKey> {
    // Use a combination of device salt and session identifier
    const sessionId = sessionStorage.getItem('recettier_session') || 'default_session';
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(sessionId),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt and store the API key
   */
  async storeApiKey(apiKey: string): Promise<void> {
    try {
      const db = await this.initDB();
      const salt = await this.getDeviceSalt();
      const key = await this.deriveKey(salt);
      
      // Generate random IV for encryption
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the API key
      const encodedKey = new TextEncoder().encode(apiKey);
      const encryptedKey = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedKey
      );

      const storedData: StoredApiKey = {
        encryptedKey,
        iv: iv.buffer,
        salt,
        timestamp: Date.now()
      };

      // Store in IndexedDB
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(storedData, this.KEY_ID);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error('Failed to store API key:', error);
      throw new Error('Failed to securely store API key');
    }
  }

  /**
   * Retrieve and decrypt the API key
   */
  async getApiKey(): Promise<string | null> {
    try {
      const db = await this.initDB();
      
      // Retrieve from IndexedDB
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const storedData = await new Promise<StoredApiKey | null>((resolve, reject) => {
        const request = store.get(this.KEY_ID);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (!storedData) return null;

      // Check if key is too old (optional: implement expiration)
      const daysSinceStored = (Date.now() - storedData.timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceStored > 30) {
        // Key is older than 30 days, remove it
        await this.removeApiKey();
        return null;
      }

      // Derive the same key used for encryption
      const key = await this.deriveKey(storedData.salt);
      
      // Decrypt the API key
      const decryptedKey = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: storedData.iv },
        key,
        storedData.encryptedKey
      );

      return new TextDecoder().decode(decryptedKey);

    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  /**
   * Remove the stored API key
   */
  async removeApiKey(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(this.KEY_ID);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error('Failed to remove API key:', error);
      throw new Error('Failed to remove API key');
    }
  }

  /**
   * Check if an API key is stored
   */
  async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return key !== null;
  }

  /**
   * Validate that an API key is properly formatted
   */
  static validateApiKey(apiKey: string): boolean {
    // Google API keys typically start with "AIza" and are 39 characters long,
    // but formats may vary. This regex matches the most common format.
    const googleApiKeyRegex = /^AIza[0-9A-Za-z-_]{35}$/;
    return googleApiKeyRegex.test(apiKey);
  }

  /**
   * Clear all stored data (useful for logout)
   */
  async clearAllData(): Promise<void> {
    await this.removeApiKey();
    localStorage.removeItem('recettier_device_salt');
    sessionStorage.removeItem('recettier_session');
  }
}

// Create and export a singleton instance
export const apiKeyStorage = new ApiKeyStorage();

// Export the class for static method access and testing
export { ApiKeyStorage };

// Initialize session ID if not present
if (!sessionStorage.getItem('recettier_session')) {
  sessionStorage.setItem('recettier_session', crypto.randomUUID());
}