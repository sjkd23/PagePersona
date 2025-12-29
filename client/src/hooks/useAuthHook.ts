/**
 * Auth0 Hook (Re-export)
 *
 * Re-exports the useAuth hook to solve the React Fast Refresh issue
 * where hooks and components shouldn't be in the same file.
 */

export { useAuth } from "./useAuth";
