import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import api from 'src/services/api';

interface PreAuthResponse {
  email?: string;
  customer_id?: string; //eslint-disable-line
  minitoken?: string;
  token: string;
}

export const usePreAuth = () => {
  const { search } = useLocation();

  const params = new URLSearchParams(search);

  const minitoken = params.get('minitoken');
  const originClientId = params.get('originClientId');
  const userId = params.get('userId');

  const hasPreAuthParams = !!minitoken;

  const query = useQuery<PreAuthResponse>(
    ['pre-auth', minitoken],
    async () => {
      const { data } = await api.post('/auth/authme/session', {
        minitoken,
        originClientId,
        userId,
      });

      return data;
    },
    {
      enabled: hasPreAuthParams,
      retry: false,
    },
  );

  return {
    ...query,
    hasPreAuthParams,
  };
};
