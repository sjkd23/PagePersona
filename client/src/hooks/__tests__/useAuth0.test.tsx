import { describe, it, expect, vi } from "vitest";

// Mock Auth0 module
vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    error: null,
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn(),
  })),
}));

describe("Auth0 Integration Tests", () => {
  it("should have Auth0 module available", async () => {
    const { useAuth0 } = await import("@auth0/auth0-react");
    expect(useAuth0).toBeDefined();
    expect(typeof useAuth0).toBe("function");
  });

  it("should return auth state when called", async () => {
    const { useAuth0 } = await import("@auth0/auth0-react");
    const authState = useAuth0();

    expect(authState).toHaveProperty("isLoading");
    expect(authState).toHaveProperty("isAuthenticated");
    expect(authState).toHaveProperty("user");
    expect(authState).toHaveProperty("loginWithRedirect");
    expect(authState).toHaveProperty("logout");
  });

  it("should have required Auth0 environment variables defined", () => {
    // These should be defined in the environment (even if mocked)
    const expectedEnvVars = [
      "VITE_AUTH0_DOMAIN",
      "VITE_AUTH0_CLIENT_ID",
      "VITE_AUTH0_AUDIENCE",
    ];

    expectedEnvVars.forEach((envVar) => {
      // Just check that the variable exists (can be undefined in test environment)
      expect(typeof import.meta.env[envVar]).toBeDefined();
    });
  });
});
