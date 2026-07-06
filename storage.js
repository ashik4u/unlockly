/**
 * Storage module - handles both local and cloud storage for unlock links
 * Cloud storage enables cross-device link persistence
 */

const SUPABASE_URL = "https://wymwpbokfrowqzalgqns.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bXdwYm9rZnJvd3F6YWxncW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjQzNzYsImV4cCI6MjA5ODg0MDM3Nn0.7IW4XtF_XSTFWbSRc2wF0-lTCRo0TI1WMOR4CVit1hs";

class StorageManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.hasSupabase = !!SUPABASE_URL && !!SUPABASE_KEY;
    this.db = null;
    this.initPromise = null;
    
    console.log("[Storage] Initializing with Supabase:", this.hasSupabase ? "enabled" : "disabled");
    
    // Eagerly initialize Supabase on page load
    if (this.hasSupabase) {
      this.initSupabase().catch(err => console.warn("[Storage] Failed to init Supabase:", err));
    }
    
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("[Storage] Online - syncing queue");
      this.syncQueue();
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("[Storage] Offline - queuing saves");
    });
  }

  /**
   * Initialize Supabase connection for cloud storage
   */
  async initSupabase() {
    if (!this.hasSupabase) {
      console.log("[Storage] Supabase not configured");
      return false;
    }
    if (this.db) {
      console.log("[Storage] Supabase already initialized");
      return true;
    }
    if (this.initPromise) {
      console.log("[Storage] Supabase initialization in progress...");
      return this.initPromise;
    }
    
    console.log("[Storage] Starting Supabase initialization...");
    this.initPromise = (async () => {
      try {
        const supabase = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
        const createSupabaseClient = supabase.createClient || supabase.default?.createClient;
        if (!createSupabaseClient) {
          throw new Error("Supabase createClient export was not found");
        }
        this.db = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("[Storage] Supabase initialized successfully");
        return true;
      } catch (error) {
        console.warn("[Storage] Supabase initialization failed:", error);
        this.db = null;
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
    console.log("[Storage] Saved to localStorage:", upperCode);

    // Try to sync to cloud if available
    if (this.hasSupabase && this.isOnline) {
      try {
        const result = await this.syncToCloud(upperCode, config);
        if (result) {
          console.log("[Storage] Cloud sync successful:", upperCode);
          return true;
        }
        throw new Error("Cloud sync returned false");
      } catch (error) {
        console.warn("[Storage] Cloud sync failed, queued for retry:", error);
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
    console.log("[Storage] Loading:", upperCode);

    // Try cloud first if available
    if (this.hasSupabase && this.isOnline) {
      try {
        const cloudData = await this.loadFromCloud(upperCode);
        if (cloudData) {
          console.log("[Storage] Loaded from cloud:", upperCode);
          return cloudData;
        }
      } catch (error) {
        console.debug("[Storage] Cloud load failed, falling back to localStorage:", error);
      }
    }

    // Fall back to localStorage
    const local = localStorage.getItem(`unlockly:locker:${upperCode}`);
    if (local) {
      console.log("[Storage] Loaded from localStorage:", upperCode);
      return JSON.parse(local);
    }
    
    console.log("[Storage] Not found:", upperCode);
    return null;
  }

  /**
   * Sync configuration to Supabase
   */
  async syncToCloud(code, config) {
    if (!this.db) {
      const initialized = await this.initSupabase();
      if (!initialized) return false;
    }

    if (!this.db) {
      console.error("[Storage] Supabase client not available");
      return false;
    }

    try {
      console.log("[Storage] Syncing to cloud:", code);
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

      if (error) {
        console.error("[Storage] Supabase error:", error);
        throw error;
      }
      console.log("[Storage] Cloud sync complete:", code);
      return true;
    } catch (error) {
      console.error("[Storage] Cloud sync failed:", error);
      throw error;
    }
  }

  /**
   * Load configuration from Supabase
   */
  async loadFromCloud(code) {
    if (!this.db) {
      const initialized = await this.initSupabase();
      if (!initialized) {
        console.log("[Storage] Supabase not initialized, skipping cloud load");
        return null;
      }
    }

    if (!this.db) {
      console.error("[Storage] Supabase client not available");
      return null;
    }

    try {
      console.log("[Storage] Loading from cloud:", code);
      const { data, error } = await this.db
        .from("unlocks")
        .select("config")
        .eq("code", code)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("[Storage] Supabase query error:", error);
        throw error;
      }
      
      if (data?.config) {
        console.log("[Storage] Cloud data found:", code);
        return data.config;
      }
      
      console.log("[Storage] Cloud data not found:", code);
      return null;
    } catch (error) {
      console.debug("[Storage] Cloud load failed:", error);
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
        console.log("[Storage] Queued for sync:", code);
      }
    } catch (error) {
      console.error("[Storage] Failed to queue sync:", error);
    }
  }

  /**
   * Process queued items when connection is restored
   */
  async syncQueue() {
    if (!this.isOnline || !this.db) return;

    try {
      const queue = JSON.parse(localStorage.getItem("unlockly:syncQueue") || "[]");
      console.log("[Storage] Processing sync queue, items:", queue.length);
      
      for (const item of queue) {
        try {
          await this.syncToCloud(item.code, item.config);
        } catch (error) {
          console.warn(`[Storage] Failed to sync ${item.code}:`, error);
          break; // Stop on first error to maintain queue order
        }
      }

      localStorage.removeItem("unlockly:syncQueue");
      console.log("[Storage] Sync queue processed");
    } catch (error) {
      console.error("[Storage] Queue sync failed:", error);
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
