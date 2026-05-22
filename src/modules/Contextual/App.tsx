import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ReactKeycloakProvider } from '@react-keycloak/web';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';

import { AuthProvider } from 'src//hooks/auth';
import ContextualMenu from 'src/components/layout/ContextualMenu';
import Header from 'src/components/layout/Header';
import LoadingPage from 'src/components/layout/LoadingPage';
import { BulkBlocklistProvider } from 'src/modules/Contextual/BulkBlocklist/contexts/BulkBlocklistContext';
import NewsModal from 'src/components/modules/Contextual/NewsModal';
import PreAuthGate from 'src/components/PreAuthGate';
import PreAuthStore from 'src/helpers/preAuthStore';
import { UserGuidingProvider } from 'src/components/providers/UserGuidingProvider';
import ErrorBoundaryMessage from 'src/components/shared/ErrorBoundary';
import Auth from 'src/helpers/auth';
import { useUserData } from 'src/hooks/useUserData';
import { i18n } from 'src/i18n';
import { DashboardContextProvider } from 'src/modules/Contextual/contexts/dashboard';
import Routes from 'src/modules/Contextual/routes';
import GlobalStyles from 'src/styles/global';
import theme from 'src/styles/theme';

import { CopyableIDProvider } from './contexts/copyableID';
import { FilterProvider } from './contexts/filters';
import { NewsModalProvider } from './contexts/newsModal';

export const contextualQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const [openModalNews, setOpenModalNews] = useState(false);
  const { user, company } = useUserData();
  const currentUser = user;
  const currentCompany = company;

  return (
    <React.StrictMode>
      <AuthProvider>
        <UserGuidingProvider user={currentUser} company={currentCompany}>
          <DashboardContextProvider>
            <BulkBlocklistProvider>
              <ThemeProvider theme={theme}>
                <FilterProvider>
                  <NewsModalProvider>
                    <CopyableIDProvider>
                      <ErrorBoundary fallback={<ErrorBoundaryMessage />}>
                        <Header
                          moduleTitle={i18n.t(
                            'shared.deviceIntelligence',
                          )}
                          showNews
                          openModal={() => setOpenModalNews(true)}
                        >
                          {openModalNews && (
                            <NewsModal
                              disableNotShow
                              onCloseClick={() => setOpenModalNews(false)}
                            />
                          )}
                          <ContextualMenu>
                            <Routes />
                          </ContextualMenu>
                        </Header>
                      </ErrorBoundary>
                    </CopyableIDProvider>
                    <GlobalStyles />
                  </NewsModalProvider>
                </FilterProvider>
              </ThemeProvider>
            </BulkBlocklistProvider>
          </DashboardContextProvider>
        </UserGuidingProvider>
      </AuthProvider>
    </React.StrictMode>
  );
};

const App: React.FC = () => {
  const isPreAuthed = !!PreAuthStore.get()?.token;

  // Se já autenticado via PreAuth, pula o ReactKeycloakProvider
  if (isPreAuthed) {
    return (
      <QueryClientProvider client={contextualQueryClient}>
        <PreAuthGate>
          <AppContent />
        </PreAuthGate>
      </QueryClientProvider>
    );
  }

  // Fluxo normal: PreAuthGate verifica se tem params na URL,
  // se não tiver, segue pro Keycloak normalmente
  return (
    <QueryClientProvider client={contextualQueryClient}>
      <PreAuthGate>
        <ReactKeycloakProvider
          authClient={Auth.getInstance().sso}
          initOptions={{
            onLoad: 'login-required',
            pkceMethod: 'S256',
          }}
          LoadingComponent={
            <div>
              <LoadingPage />
            </div>
          }
        >
          <AppContent />
        </ReactKeycloakProvider>
      </PreAuthGate>
    </QueryClientProvider>
  );
};

export default App;
