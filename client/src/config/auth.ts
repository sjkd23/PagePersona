/**
 * Auth0 Configuration Module
 *
 * Centralized configuration for Auth0 authentication integration.
 * Extracts environment variables for Auth0 setup including domain,
 * client ID, redirect URI, and API audience configuration.
 *
 * Environment Variables Required:
 * - VITE_AUTH0_DOMAIN: Auth0 tenant domain
 * - VITE_AUTH0_CLIENT_ID: Auth0 application client ID
 * - VITE_AUTH0_AUDIENCE: Auth0 API audience identifier
 */

// Auth0 configuration constants extracted from environment variables
export const domain =
  import.meta.env.VITE_AUTH0_DOMAIN || "dev-hnoh845pekh6xkbd.us.auth0.com";
export const clientId =
  import.meta.env.VITE_AUTH0_CLIENT_ID || "wRe1XsXoWeRCpEy526K8yLzGoWKhjlLt";

// Calculate redirect URI without query params to prevent callback issues
// Use explicit config if available, otherwise use current origin
export const redirectUri =
  import.meta.env.VITE_SITE_URL ||
  `${window.location.protocol}//${window.location.host}`;

export const audience =
  import.meta.env.VITE_AUTH0_AUDIENCE || "https://pagepersonai.dev/api";
