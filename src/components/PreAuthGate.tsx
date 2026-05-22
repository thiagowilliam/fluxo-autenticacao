import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import Auth from 'src/helpers/auth';
import PreAuthStore from 'src/helpers/preAuthStore';
import { usePreAuth } from 'src/hooks/usePreAuth';
import ErrorValidationPage from './layout/ErrorValidationPage';
import LoadingPage from './layout/LoadingPage';

type Props = {
  children: React.ReactNode;
};

const PreAuthGate: React.FC<Props> = ({ children }) => {
  const { data, isLoading, isError, hasPreAuthParams } = usePreAuth();
  const [isPreAuthed, setIsPreAuthed] = useState(() => {
    // Se já passou pelo PreAuth antes (ex: navegação interna),
    // verifica se já tem dados no store
    return !!PreAuthStore.get()?.token;
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
    if (data?.token) {
      Auth.getInstance().setExternalToken(data.token);
      PreAuthStore.set(data);
      setIsPreAuthed(true);
    }
  }, [data]);

  // Sem params de PreAuth → fluxo normal (Keycloak)
  if (!hasPreAuthParams && !isPreAuthed) {
    return <>{children}</>;
  }

  // Já autenticado via PreAuth → renderiza app
  if (isPreAuthed) {
    return <>{children}</>;
  }

  // Carregando PreAuth
  if (isLoading) {
    return (
      <div>
        <LoadingPage />
      </div>
    );
  }

  // Erro no PreAuth
  if (isError) {
    return (
      <>
        <ErrorValidationPage />
      </>
    );
  }

  return (
    <div>
      <LoadingPage />
    </div>
  );
};

export default PreAuthGate;
