/**
 * Storage module - handles both local and cloud storage for unlock links
 * Cloud storage enables cross-device link persistence
 */

const SUPABASE_URL = "" || "";
const SUPABASE_KEY = "" || "";

class StorageManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.hasSupabase = !!SUPABASE_URL && !!SUPABASE_KEY;
    this.db = null;
    this.initPromise = null;
    
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncQueue();
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  /**
   * Initialize Supabase connection for cloud storage
   */
  async initSupabase() {
    if (!this.hasSupabase) return false;
    if (this.db) return true;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = (async () => {
      try {
        const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
        this.db = createClient(SUPABASE_URL, SUPABASE_KEY);
        return true;
      } catch (error) {
        console.warn("Supabase initialization failed:", error);
        return false;
      }
    })();
    
    return this.initPromise;
  }

  /**
   * Save unlock link to storage
   * @param {string} code - Short code
   * @param {object} config - Unlock configuration
   * @returns {Promise<boolean>} Success status
   */
  async save(code, config) {
    const upperCode = code.toUpperCase();
    
    // Always save to localStorage (fallback)
    localStorage.setItem(`unlockly:locker:${upperCode}`, JSON.stringify(config));

    // Try to sync to cloud if available
    if (this.hasSupabase && this.isOnline) {
      try {
        return await this.syncToCloud(upperCode, config);
      } catch (error) {
        console.warn("Cloud sync failed, queued for retry:", error);
        this.queueForSync(upperCode, config);
      }
    }

    return true;
  }

  /**
   * Load unlock link from storage
   * @param {string} code - Short code
   * @returns {Promise<object|null>} Configuration or null
   */
  async load(code) {
    const upperCode = code.toUpperCase();

    // Try cloud first if available
    if (this.hasSupabase && this.isOnline) {
      try {
        const cloudData = await this.loadFromCloud(upperCode);
        if (cloudData) return cloudData;
      } catch (error) {
        console.debug("Cloud load failed, falling back to localStorage:", error);
      }
    }

    // Fall back to localStorage
    const local = localStorage.getItem(`unlockly:locker:${upperCode}`);
    return local ? JSON.parse(local) : null;
  }

  /**
   * Sync configuration to Supabase
   */
  async syncToCloud(code, config) {
    if (!this.db) {
      await this.initSupabase();
    }

    if (!this.db) return false;

    try {
      const { data, error } = await this.db
        .from("unlocks")
        .upsert(
          {
            code: code.toUpperCase(),
            config: config,
            created_at: new Date().toISOString()
          },
          { onConflict: "code" }
        );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Cloud sync failed:", error);
      throw error;
    }
  }

  /**
   * Load configuration from Supabase
   */
  async loadFromCloud(code) {
    if (!this.db) {
      await this.initSupabase();
    }

    if (!this.db) return null;

    try {
      const { data, error } = await this.db
        .from("unlocks")
        .select("config")
        .eq("code", code)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
      return data?.config || null;
    } catch (error) {
      console.debug("Cloud load failed:", error);
      return null;
    }
  }

  /**
   * Queue item for sync when connection is restored
   */
  queueForSync(code, config) {
    try {
      const queue = JSON.parse(localStorage.getItem("unlockly:syncQueue") || "[]");
      if (!queue.find(item => item.code === code)) {
        queue.push({ code, config, timestamp: Date.now() });
        localStorage.setItem("unlockly:syncQueue", JSON.stringify(queue));
      }
    } catch (error) {
      console.error("Failed to queue sync:", error);
    }
  }

  /**
   * Process queued items when connection is restored
   */
  async syncQueue() {
    if (!this.isOnline || !this.db) return;

    try {
      const queue = JSON.parse(localStorage.getItem("unlockly:syncQueue") || "[]");
      
      for (const item of queue) {
        try {
          await this.syncToCloud(item.code, item.config);
        } catch (error) {
          console.warn(`Failed to sync ${item.code}:`, error);
          break; // Stop on first error to maintain queue order
        }
      }

      localStorage.removeItem("unlockly:syncQueue");
    } catch (error) {
      console.error("Queue sync failed:", error);
    }
  }

  /**
   * Get storage status for UI display
   */
  getStatus() {
    return {
      online: this.isOnline,
      cloudEnabled: this.hasSupabase && !!this.db,
      storageType: this.hasSupabase && this.db ? "cloud+local" : "local"
    };
  }
}

// Export singleton instance
const storage = new StorageManager();