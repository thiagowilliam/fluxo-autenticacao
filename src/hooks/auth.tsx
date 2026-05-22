import React, { createContext, useContext } from 'react';

import Auth from '../helpers/auth';

export interface User {
  customer_id: string; //eslint-disable-line
  email: string;
  name: string;
  customers_group_id: string; //eslint-disable-line
}

interface AuthContextData {
  user: User;
}

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const data = Auth.getInstance().authData;

  return (
    <AuthContext.Provider value={{ user: data.user }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  return context;
}
