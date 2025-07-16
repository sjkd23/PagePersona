// src/providers/Auth0Provider.tsx
import type { ReactNode } from 'react';
import { Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react';
import { domain, clientId, redirectUri, audience } from '../config/auth';
import { AuthContextProvider } from './AuthContextProvider';

export function Auth0Provider({ children }: { children: ReactNode }) {
  if (!domain || !clientId) {
    return null;
  }

  return (
    <Auth0ProviderBase
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience,
        scope: 'openid profile email',
      }}
      useRefreshTokens={true}
      cacheLocation="memory"
      onRedirectCallback={(appState) => {
        window.history.replaceState(
          {},
          document.title,
          appState?.returnTo || window.location.pathname,
        );
      }}
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </Auth0ProviderBase>
  );
}
