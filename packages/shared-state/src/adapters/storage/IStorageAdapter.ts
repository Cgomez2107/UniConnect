/**
 * Storage Adapter Interface
 * Abstraction for persistent storage (localStorage, AsyncStorage, etc.)
 */

export interface IStorageAdapter {
  /**
   * Get value from storage
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Set value in storage
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Remove value from storage
   */
  removeItem(key: string): Promise<void>;

  /**
   * Clear all values from storage
   */
  clear(): Promise<void>;

  /**
   * Get all keys in storage
   */
  keys(): Promise<string[]>;
}

/**
 * Web Storage Adapter
 * Uses localStorage or sessionStorage
 */
export class WebStorageAdapter implements IStorageAdapter {
  private storage: Storage;

  constructor(storage: Storage = typeof window !== "undefined" ? window.localStorage : null as any) {
    if (!storage) {
      throw new Error("Web Storage not available in this environment");
    }
    this.storage = storage;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      return Object.keys(this.storage);
    } catch (error) {
      console.error("Error getting storage keys:", error);
      return [];
    }
  }
}

/**
 * No-op Storage Adapter
 * For environments without persistent storage (CI, tests)
 */
export class NoopStorageAdapter implements IStorageAdapter {
  private data: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }
}

/**
 * Session Storage Adapter
 * Uses sessionStorage (cleared on browser close)
 */
export class SessionStorageAdapter extends WebStorageAdapter {
  constructor() {
    super(typeof window !== "undefined" ? window.sessionStorage : null as any);
  }
}
