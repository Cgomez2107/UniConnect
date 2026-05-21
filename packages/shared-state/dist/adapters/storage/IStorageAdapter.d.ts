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
export declare class WebStorageAdapter implements IStorageAdapter {
    private storage;
    constructor(storage?: Storage);
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
}
/**
 * No-op Storage Adapter
 * For environments without persistent storage (CI, tests)
 */
export declare class NoopStorageAdapter implements IStorageAdapter {
    private data;
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
}
/**
 * Session Storage Adapter
 * Uses sessionStorage (cleared on browser close)
 */
export declare class SessionStorageAdapter extends WebStorageAdapter {
    constructor();
}
//# sourceMappingURL=IStorageAdapter.d.ts.map