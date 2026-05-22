/* eslint-disable prefer-promise-reject-errors */
import axios, { InternalAxiosRequestConfig } from 'axios';

import config from 'src/configs/config';
import Auth from 'src/helpers/auth';
import Message from 'src/helpers/message';
import { i18n } from 'src/i18n';

const api = axios.create({
  baseURL: config.BASE_URL_API,
});

api.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  request.headers.Authorization = Auth.getInstance().headerBearerToken;
  return request;
});

api.interceptors.response.use(
  resp => resp,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const configError = error.config;
    const url = configError?.url || '';

    if (status === 500 && url.includes('/geocode')) {
      return Promise.reject(error);
    }

    switch (status) {
      case 401:
        Auth.getInstance().logout();
        break;
      case 404:
        break;
      case 500:
        Message.error(i18n.t('networkErrors.unexpectedError'));
        break;
      default:
        break;
    }

    return Promise.reject({
      ...error,
      data: error.response ? error.response.data : null,
    });
  },
);

export default api;
