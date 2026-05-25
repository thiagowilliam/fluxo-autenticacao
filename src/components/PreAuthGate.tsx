/* eslint-disable consistent-return */
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { ThemeProvider } from 'styled-components';

import Auth from 'src/helpers/auth';
import PreAuthStore from 'src/helpers/preAuthStore';
import { usePreAuth } from 'src/hooks/usePreAuth';
import theme from 'src/styles/theme';

import ErrorValidationPage from './layout/ErrorValidationPage';
import LoadingPage from './layout/LoadingPage';

type Props = {
  children: React.ReactNode;
};

const PreAuthGate: React.FC<Props> = ({ children }) => {
  const { data, isLoading, isError, hasPreAuthParams } = usePreAuth();
  const [isPreAuthed, setIsPreAuthed] = useState(() => {
    return !!PreAuthStore.get()?.access_token;
  });

  const history = useHistory();

  useEffect(() => {
    if (isError && hasPreAuthParams) {
      const timer = setTimeout(() => {
        history.push('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isError, hasPreAuthParams, history]);

  useEffect(() => {
    if (data?.access_token && !isPreAuthed) {
      Auth.getInstance().setExternalToken(data.access_token);
      PreAuthStore.set(data);
      setIsPreAuthed(true);
    }
  }, [data, isPreAuthed]);

  // 1. Já autenticado via PreAuth → renderiza app SEM Keycloak
  if (isPreAuthed) {
    return <>{children}</>;
  }

  // 2. Está no fluxo PreAuth mas ainda não terminou → BLOQUEIA children
  if (hasPreAuthParams) {
    if (isLoading) {
      return (
        <div>
          <LoadingPage />
        </div>
      );
    }

    if (isError) {
      return (
        <ThemeProvider theme={theme}>
          <ErrorValidationPage />
        </ThemeProvider>
      );
    }

    // POST retornou mas useEffect ainda não processou o token
    return (
      <div>
        <LoadingPage />
      </div>
    );
  }

  // 3. Sem PreAuth params → fluxo normal Keycloak
  return <>{children}</>;
};

export default PreAuthGate;
