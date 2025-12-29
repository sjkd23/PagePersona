import { describe, it, expect } from "vitest";
import { generateUsernameFromAuth0 } from "../username-generator";
import type { ProcessedAuth0User } from "../../types/common";

describe("usernameGenerator", () => {
  describe("generateUsernameFromAuth0", () => {
    it("should generate username from nickname", () => {
      const auth0User: ProcessedAuth0User = {
        id: "auth0|123456789abcdef",
        sub: "auth0|123456789abcdef",
        nickname: "johndoe",
        name: "John Doe",
        email: "john@example.com",
      };

      const result = generateUsernameFromAuth0(auth0User);

      expect(result).toBe("johndoe_abcdef");
      expect(result).toMatch(/johndoe_[a-zA-Z0-9]{6}/);
    });

    it("should fallback to name when nickname is invalid", () => {
      const auth0User: ProcessedAuth0User = {
        id: "auth0|987654321fedcba",
        sub: "auth0|987654321fedcba",
        nickname: "", // invalid
        name: "Jane Smith",
        email: "jane@example.com",
      };

      const result = generateUsernameFromAuth0(auth0User);

      expect(result).toBe("janesmith_fedcba");
      expect(result).toMatch(/janesmith_[a-zA-Z0-9]{6}/);
    });

    it("should fallback to email base when nickname and name are invalid", () => {
      const auth0User: ProcessedAuth0User = {
        id: "google-oauth2|abc123def456",
        sub: "google-oauth2|abc123def456",
        nickname: null as any,
        name: "",
        email: "testuser@example.com",
      };

      const result = generateUsernameFromAuth0(auth0User);

      expect(result).toBe("testuser_def456");
      expect(result).toMatch(/testuser_[a-zA-Z0-9]{6}/);
    });

    it("should use fallback when all fields are invalid", () => {
      const auth0User: ProcessedAuth0User = {
        id: "auth0|xyz789",
        sub: "auth0|xyz789",
        nickname: null as any,
        name: "",
        email: "",
      };

      const result = generateUsernameFromAuth0(auth0User);

      expect(result).toBe("user_xyz789");
      expect(result).toMatch(/user_[a-zA-Z0-9]{6}/);
    });

    it("should handle special characters in nickname", () => {
      const auth0User: ProcessedAuth0User = {
        id: "auth0|special123",
        sub: "auth0|special123",
        nickname: "user@#$%^&*()",
        name: "User Name",
        email: "user@example.com",
      };

      const result = generateUsernameFromAuth0(auth0User);

      expect(result).toBe("user_ial123");
      expect(result).toMatch(/user_[a-zA-Z0-9]{6}/);
    });

    it("should handle missing or malformed sub field", () => {
      const auth0User: ProcessedAuth0User = {
        id: "malformed",
        sub: "malformed",
        nickname: "testuser",
        name: "Test User",
        email: "test@example.com",
      };

      const result = generateUsernameFromAuth0(auth0User);

      expect(result).toBe("testuser_formed");
      expect(result).toMatch(/testuser_[a-zA-Z0-9]{6}/);
    });

    it("should handle very short sub field", () => {
      const auth0User: ProcessedAuth0User = {
        id: "a|b",
        sub: "a|b",
        nickname: "shortuser",
        name: "Short User",
        email: "short@example.com",
      };

      const result = generateUsernameFromAuth0(auth0User);

      expect(result).toBe("shortuser_b");
      expect(result).toMatch(/shortuser_[a-zA-Z0-9]{1}/);
    });

    it("should handle undefined auth0User gracefully", () => {
      const auth0User: ProcessedAuth0User = {
        id: "user",
        sub: undefined,
        nickname: undefined,
        name: undefined,
        email: undefined,
      };

      const result = generateUsernameFromAuth0(auth0User);

      expect(result).toBe("user_user");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
