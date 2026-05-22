/* eslint-disable @typescript-eslint/explicit-function-return-type */
// src/helpers/preAuthStore.ts
class PreAuthStore {
  private static STORAGE_KEY = 'pre_auth_data';

  static set(data: any) {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static get() {
    const data = sessionStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  static clear() {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}

export default PreAuthStore;
