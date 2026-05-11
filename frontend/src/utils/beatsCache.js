// Simple cache for beats data to prevent multiple API calls
class BeatsCache {
  constructor() {
    this.data = null;
    this.isLoading = false;
    this.hasLoaded = false;
    this.callbacks = [];
  }

  async getBeats(fetchFunction) {
    // If already loaded, return cached data
    if (this.hasLoaded && this.data) {
      return { success: true, data: { results: this.data } };
    }

    // If already loading, wait for the current request
    if (this.isLoading) {
      return new Promise((resolve) => {
        this.callbacks.push(resolve);
      });
    }

    // Start loading
    this.isLoading = true;

    try {
      const response = await fetchFunction();
      
      if (response.success) {
        this.data = response.data.results || [];
        this.hasLoaded = true;
        
        // Notify all waiting callbacks
        this.callbacks.forEach(callback => {
          callback({ success: true, data: { results: this.data } });
        });
        this.callbacks = [];
        
        return response;
      } else {
        // Notify all waiting callbacks of error
        this.callbacks.forEach(callback => {
          callback(response);
        });
        this.callbacks = [];
        
        return response;
      }
    } catch (error) {
      // Notify all waiting callbacks of error
      const errorResponse = { success: false, error: error.message };
      this.callbacks.forEach(callback => {
        callback(errorResponse);
      });
      this.callbacks = [];
      
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Clear cache (useful for refresh scenarios)
  clearCache() {
    this.data = null;
    this.hasLoaded = false;
    this.isLoading = false;
    this.callbacks = [];
  }

  // Check if data is cached
  isCached() {
    return this.hasLoaded && this.data;
  }
}

// Export a singleton instance
export const beatsCache = new BeatsCache();