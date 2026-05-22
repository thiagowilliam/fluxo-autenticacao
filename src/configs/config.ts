const config = {
  LEGACY_BASE_URL_API: import.meta.env.VITE_LEGACY_BASE_URL_API,
  BASE_URL_API: import.meta.env.VITE_BASE_URL_API,
  SSO: {
    URL: import.meta.env.VITE_SSO_URL,
    REALM: import.meta.env.VITE_SSO_REALM,
    CLIENT_ID: import.meta.env.VITE_SSO_CLIENTID,
  },
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  VITE_STORYBOOK_FIGMA_ACCESS_TOKEN: import.meta.env
    .VITE_STORYBOOK_FIGMA_ACCESS_TOKEN,
};

export default config;
