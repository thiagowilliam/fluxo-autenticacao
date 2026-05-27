/* eslint-disable class-methods-use-this */
import jwtDecode from 'jwt-decode';
import Keycloak, { KeycloakInstance, KeycloakConfig } from 'keycloak-js';

import config from 'src/configs/config';

import AuthDataStore from './authDataStore';
import GoogleTagManager from './googleTagManager';
import PreAuthStore from './preAuthStore';

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
      // eslint-disable-next-line camelcase
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
  public setExternalToken(
    token: string,
    customerId?: string,
    customersGroupId?: string,
  ): void {
    const decoded = jwtDecode(token) as Record<string, any>;

    // Mapeia os campos do JWT do PreAuth para a interface User
    const user: User = {
      customer_id: customerId || decoded.customer_id || decoded.sub || '',
      email: decoded.email || decoded.preferred_username || '',
      name: decoded.name || '',
      customers_group_id:
        customersGroupId || decoded.customers_group_id || '',
    };

    // eslint-disable-next-line camelcase
    const { customer_id, email } = user;
    GoogleTagManager.setUserProperties(customer_id, email);

    Auth.lastProcessedToken = token;
    AuthDataStore.setUserData(user, token);
  }

  public logout(): void {
    Auth.lastProcessedToken = null;
    AuthDataStore.clearAuthData();

    // Se autenticado via PreAuth, não redireciona pro Keycloak
    const preAuthData = PreAuthStore.get();
    if (preAuthData?.accessToken) {
      PreAuthStore.clear();
      window.location.href = '/';
      return;
    }

    this.keycloak.logout();
  }

  /**
   * Extrai todas as roles do JWT decodificado (realm + resource)
   */
  private static getPreAuthRoles(accessToken: string): {
    realmRoles: string[];
    resourceRoles: string[];
  } {
    const decoded = jwtDecode(accessToken) as Record<string, any>;

    const realmRoles: string[] = decoded.realm_access?.roles || [];
    const resourceRoles: string[] = Object.values(
      decoded.resource_access || {},
    ).flatMap((resource: any) => resource.roles || []);

    return { realmRoles, resourceRoles };
  }

  public authenticateByRoles(roles: string[]): boolean {
    // Fluxo PreAuth: lê roles direto do token decodificado
    const preAuthData = PreAuthStore.get();
    if (preAuthData?.accessToken) {
      const { realmRoles, resourceRoles } = Auth.getPreAuthRoles(
        preAuthData.accessToken,
      );

      return roles.some(
        (role) =>
          realmRoles.includes(role) || resourceRoles.includes(role),
      );
    }

    // Fluxo Keycloak normal
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
    // Fluxo PreAuth: lê roles direto do token decodificado
    const preAuthData = PreAuthStore.get();
    if (preAuthData?.accessToken) {
      const { realmRoles, resourceRoles } = Auth.getPreAuthRoles(
        preAuthData.accessToken,
      );

      return roles.every(
        (role) =>
          realmRoles.includes(role) || resourceRoles.includes(role),
      );
    }

    // Fluxo Keycloak normal
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