// Storage abstraction: Electron JSON file storage if available, else localStorage

export const storage = {
  getItem(key, defaultValue) {
    try {
      if (typeof window !== 'undefined' && window.cms && typeof window.cms.storageGetSync === 'function') {
        const v = window.cms.storageGetSync(key);
        return v == null ? defaultValue : v;
      }
    } catch (e) {}
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  setItem(key, data) {
    try {
      if (typeof window !== 'undefined' && window.cms && typeof window.cms.storageSet === 'function') {
        window.cms.storageSet(key, data);
        return;
      }
    } catch (e) {}
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }
};

