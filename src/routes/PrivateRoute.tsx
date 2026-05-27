/* eslint-disable react/jsx-curly-newline */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-confusing-arrow */
/* eslint-disable indent */
/* eslint-disable react/jsx-indent */
import React from 'react';
import {
  Redirect,
  Route,
  RouteProps as ReactDOMRouteProps,
} from 'react-router-dom';

import Auth from 'src/helpers/auth';
import PreAuthStore from 'src/helpers/preAuthStore';
import { HOME_MODULE } from 'src/modules/Home/utils/constants/routes.constants';

interface PrivateRoutesProps extends ReactDOMRouteProps {
  component: React.ComponentType;
  roles: string[];
}

const PrivateRoute: React.FC<PrivateRoutesProps> = ({
  component: Component,
  roles,
  ...rest
}) => {
  const isAuthorized = (): boolean => {
    // Se autenticado via PreAuth, permite acesso
    // (o controle de acesso é feito pelo backend no /authme/session)
    const preAuthData = PreAuthStore.get();
    if (preAuthData?.accessToken) {
      return true;
    }

    // Fluxo normal: verifica roles via Keycloak
    return Auth.getInstance().authenticateByRoles(roles);
  };

  return (
    <Route
      render={() =>
        isAuthorized() ? (
          <Component />
        ) : (
          <Redirect to={{ pathname: HOME_MODULE }} />
        )
      }
      {...rest}
    />
  );
};

export default PrivateRoute;
