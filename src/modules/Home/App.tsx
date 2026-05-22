import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ReactKeycloakProvider } from '@react-keycloak/web';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';

import BrowserNotLoading from 'src/components/layout/BrowserNotLoadingPage';
import Header from 'src/components/layout/Header';
import LoadingPage from 'src/components/layout/LoadingPage';
import PreAuthGate from 'src/components/PreAuthGate';
import PreAuthStore from 'src/helpers/preAuthStore';
import { UserGuidingProvider } from 'src/components/providers/UserGuidingProvider';
import ErrorBoundaryMessage from 'src/components/shared/ErrorBoundary';
import Auth from 'src/helpers/auth';
import { AuthProvider } from 'src/hooks/auth';
import { useUserData } from 'src/hooks/useUserData';
import Routes from 'src/modules/Home/routes';
import GlobalStyles from 'src/styles/global';
import theme from 'src/styles/theme';
import browser from 'src/utils/browser';

import { NewsModalProvider } from '../Contextual/contexts/newsModal';

export const homeQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC<{ passedTimeThreshold: boolean }> = ({
  passedTimeThreshold,
}) => {
  const { user, company } = useUserData();
  const currentUser = user;
  const currentCompany = company;

  return (
    <React.StrictMode>
      <AuthProvider>
        <UserGuidingProvider
          user={currentUser}
          company={currentCompany}
        >
          <ErrorBoundary fallback={<ErrorBoundaryMessage />}>
            <NewsModalProvider>
              <Header>
                <Routes />
              </Header>
            </NewsModalProvider>
          </ErrorBoundary>
          <GlobalStyles />
        </UserGuidingProvider>
      </AuthProvider>
    </React.StrictMode>
  );
};

const App: React.FC = () => {
  const [passedTimeThreshold, setPassedTimeThreshold] = useState(false);
  const { user, company } = useUserData();
  const currentUser = user;
  const currentCompany = company;

  useEffect(() => {
    const timeout = 5000;
    const timeoutId = setTimeout(() => {
      if (browser.isSafari()) setPassedTimeThreshold(true);
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, []);

  const isPreAuthed = !!PreAuthStore.get()?.token;

  // Se já autenticado via PreAuth, pula o ReactKeycloakProvider
  if (isPreAuthed) {
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={homeQueryClient}>
          <PreAuthGate>
            <AppContent passedTimeThreshold={passedTimeThreshold} />
          </PreAuthGate>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  // Fluxo normal: PreAuthGate verifica params na URL,
  // se não tiver, segue pro Keycloak
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={homeQueryClient}>
        <PreAuthGate>
          <ReactKeycloakProvider
            authClient={Auth.getInstance().sso}
            initOptions={{
              onLoad: 'login-required',
              pkceMethod: 'S256',
            }}
            LoadingComponent={
              <div>
                {passedTimeThreshold ? (
                  <BrowserNotLoading />
                ) : (
                  <LoadingPage />
                )}
              </div>
            }
          >
            <AppContent passedTimeThreshold={passedTimeThreshold} />
          </ReactKeycloakProvider>
        </PreAuthGate>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
