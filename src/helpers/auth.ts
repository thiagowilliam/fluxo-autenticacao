import jwtDecode from 'jwt-decode';
import Keycloak, { KeycloakInstance, KeycloakConfig } from 'keycloak-js';

import config from 'src/configs/config';

import AuthDataStore from './authDataStore';
import GoogleTagManager from './googleTagManager';

interface User {
  customer_id: string; //eslint-disable-line
  email: string;
  name: string;
  customers_group_id: string; //eslint-disable-line
}

interface AuthState {
  user: User;
  token: string;
}

const decodeUser = (token?: string): User =>
  (token !== undefined ? jwtDecode(token) : {}) as User;

export default class Auth {
  private static instance: Auth;

  private static lastProcessedToken: string | null = null;

  private keycloak: KeycloakInstance;

  private constructor() {
    const keyCloakConfig: KeycloakConfig = {
      url: config.SSO.URL,
      realm: config.SSO.REALM as string,
      clientId: config.SSO.CLIENT_ID as string,
    };
    this.keycloak = Keycloak(keyCloakConfig);
  }

  public static getInstance(): Auth {
    if (!Auth.instance) {
      Auth.instance = new Auth();
    }
    return Auth.instance;
  }

  public get sso(): KeycloakInstance {
    return this.keycloak;
  }

  public get authData(): AuthState {
    const { token } = this.sso;

    if (token) {
      const user = decodeUser(token);
      const { customer_id, email } = user;
      GoogleTagManager.setUserProperties(customer_id, email);

      if (Auth.lastProcessedToken !== token) {
        Auth.lastProcessedToken = token;
        AuthDataStore.setUserData(user, token);
      }

      return { user, token };
    }

    // Fallback: token externo (PreAuth)
    const storedData = AuthDataStore.getAuthData();
    if (storedData.token && storedData.user) {
      return {
        user: storedData.user,
        token: storedData.token,
      };
    }

    return {} as AuthState;
  }

  public get headerBearerToken(): string {
    const keycloakToken = this.keycloak.token;
    if (keycloakToken) {
      return `Bearer ${keycloakToken}`;
    }

    // Fallback: token externo (PreAuth)
    const storedData = AuthDataStore.getAuthData();
    if (storedData.token) {
      return `Bearer ${storedData.token}`;
    }

    return '';
  }

  /**
   * Injeta um token externo (vindo do PreAuth) no fluxo de autenticação,
   * fazendo o mesmo processamento que o Keycloak faria:
   * decode do JWT, setUserProperties no GTM e persistência no AuthDataStore.
   */
  public setExternalToken(token: string): void {
    const user = decodeUser(token);
    const { customer_id, email } = user;
    GoogleTagManager.setUserProperties(customer_id, email);

    Auth.lastProcessedToken = token;
    AuthDataStore.setUserData(user, token);
  }

  public logout(): void {
    Auth.lastProcessedToken = null;
    AuthDataStore.clearAuthData();
    this.keycloak.logout();
  }

  public authenticateByRoles(roles: string[]): boolean {
    if (this.keycloak && roles) {
      return roles.some((role) => {
        const realm = this.keycloak.hasRealmRole(role);
        const resource = this.keycloak.hasResourceRole(role);
        return realm || resource;
      });
    }
    return false;
  }

  public userHasAllRequiredRoles(roles: string[]): boolean {
    if (this.keycloak && roles) {
      return roles.every((role) => {
        const realm = this.keycloak.hasRealmRole(role);
        const resource = this.keycloak.hasResourceRole(role);
        return realm || resource;
      });
    }
    return false;
  }
}
