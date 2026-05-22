/* eslint-disable camelcase */
interface User {
  customer_id: string;
  email: string;
  name: string;
  customers_group_id: string;
  sub?: string;
}

interface AuthData {
  user: User | null;
  token: string | null;
  customerId: string | null;
  email: string | null;
  customerName: string | null;
}

class AuthDataStore {
  private static readonly STORAGE_KEY = 'authDataStore';

  private static readonly EVENT_NAME = 'authDataChanged';

  private static initializeStore(): void {
    if (typeof window !== 'undefined' && !window.authDataStore) {
      window.authDataStore = {
        user: null,
        token: null,
        customerId: null,
        email: null,
        customerName: null,
      };

      this.loadFromStorage();
    }
  }

  private static getStore(): AuthData {
    this.initializeStore();
    return (
      window.authDataStore || {
        user: null,
        token: null,
        customerId: null,
        email: null,
        customerName: null,
      }
    );
  }

  private static updateStore(data: Partial<AuthData>): void {
    this.initializeStore();

    window.authDataStore = {
      ...window.authDataStore,
      ...data,
    };

    this.saveToStorage();

    if (typeof window !== 'undefined') {
      const event = new CustomEvent(this.EVENT_NAME, {
        detail: window.authDataStore,
      });
      window.dispatchEvent(event);
    }
  }

  public static setUserData(user: User, token: string): void {
    this.updateStore({
      user,
      token,
      customerId: user.customer_id,
      email: user.email,
    });
  }

  public static setUserProperties(customerId: string, email: string): void {
    const currentStore = this.getStore();

    const user = currentStore.user || {
      customer_id: customerId,
      email,
      name: '',
      customers_group_id: '',
      sub: '',
    };

    this.updateStore({
      customerId,
      email,
      user,
    });
  }

  public static setCustomerName(customerName: string): void {
    this.updateStore({
      customerName,
    });
  }

  public static setCustomerData(
    customerId: string,
    customerName: string,
  ): void {
    this.updateStore({
      customerId,
      customerName,
    });
  }

  public static getAuthData(): AuthData {
    const store = this.getStore();
    return {
      user: store.user ? { ...store.user } : null,
      token: store.token,
      customerId: store.customerId,
      email: store.email,
      customerName: store.customerName,
    };
  }

  public static getUser(): User | null {
    const store = this.getStore();
    return store.user ? { ...store.user } : null;
  }

  public static getCustomerName(): string | null {
    const store = this.getStore();
    return store.customerName;
  }

  public static clearAuthData(): void {
    this.updateStore({
      user: null,
      token: null,
      customerId: null,
      email: null,
      customerName: null,
    });

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(this.STORAGE_KEY);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
      }
    }
  }

  public static onChange(callback: (data: AuthData) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {
        // eslint-disable-next-line no-console
        console.log('on change state');
      };
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<AuthData>;
      callback(customEvent.detail);
    };

    window.addEventListener(this.EVENT_NAME, handler);
    return () => {
      window.removeEventListener(this.EVENT_NAME, handler);
    };
  }

  private static saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const store = this.getStore();
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save auth data to sessionStorage:', e);
    }
  }

  private static loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        window.authDataStore = data;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load auth data from sessionStorage:', e);
    }
  }

  public static hasAuthData(): boolean {
    const store = this.getStore();
    return !!(store.user && store.email);
  }
}

declare global {
  interface Window {
    authDataStore: AuthData;
  }
}

export default AuthDataStore;
