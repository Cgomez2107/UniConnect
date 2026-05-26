/**
 * Storage Adapter Interface
 * Abstraction for persistent storage (localStorage, AsyncStorage, etc.)
 */
/**
 * Web Storage Adapter
 * Uses localStorage or sessionStorage
 */
export class WebStorageAdapter {
    storage;
    constructor(storage = typeof window !== "undefined" ? window.localStorage : null) {
        if (!storage) {
            throw new Error("Web Storage not available in this environment");
        }
        this.storage = storage;
    }
    async getItem(key) {
        try {
            return this.storage.getItem(key);
        }
        catch (error) {
            console.error(`Error reading from storage (${key}):`, error);
            return null;
        }
    }
    async setItem(key, value) {
        try {
            this.storage.setItem(key, value);
        }
        catch (error) {
            console.error(`Error writing to storage (${key}):`, error);
            throw error;
        }
    }
    async removeItem(key) {
        try {
            this.storage.removeItem(key);
        }
        catch (error) {
            console.error(`Error removing from storage (${key}):`, error);
            throw error;
        }
    }
    async clear() {
        try {
            this.storage.clear();
        }
        catch (error) {
            console.error("Error clearing storage:", error);
            throw error;
        }
    }
    async keys() {
        try {
            return Object.keys(this.storage);
        }
        catch (error) {
            console.error("Error getting storage keys:", error);
            return [];
        }
    }
}
/**
 * No-op Storage Adapter
 * For environments without persistent storage (CI, tests)
 */
export class NoopStorageAdapter {
    data = new Map();
    async getItem(key) {
        return this.data.get(key) ?? null;
    }
    async setItem(key, value) {
        this.data.set(key, value);
    }
    async removeItem(key) {
        this.data.delete(key);
    }
    async clear() {
        this.data.clear();
    }
    async keys() {
        return Array.from(this.data.keys());
    }
}
/**
 * Session Storage Adapter
 * Uses sessionStorage (cleared on browser close)
 */
export class SessionStorageAdapter extends WebStorageAdapter {
    constructor() {
        super(typeof window !== "undefined" ? window.sessionStorage : null);
    }
}
//# sourceMappingURL=IStorageAdapter.js.map