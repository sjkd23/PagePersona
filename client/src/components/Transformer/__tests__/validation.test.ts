import { describe, it, expect } from "vitest";
import {
  validateUrl,
  validateText,
  validateInput,
  formatUrl,
} from "../validation";

describe("validation utilities", () => {
  describe("validateUrl", () => {
    it("should accept valid URLs", () => {
      const result1 = validateUrl("https://example.com");
      const result2 = validateUrl("http://test.org");

      expect(result1.isValid).toBe(true);
      expect(result1.error).toBe(null);
      expect(result2.isValid).toBe(true);
      expect(result2.error).toBe(null);
    });

    it("should accept URLs without protocol", () => {
      const result = validateUrl("example.com");

      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it("should accept empty URLs", () => {
      const result = validateUrl("");

      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it("should reject invalid URLs", () => {
      const result = validateUrl("not-a-valid-url");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Please enter a valid URL");
    });
  });

  describe("validateText", () => {
    it("should accept text within length limit and above minimum", () => {
      const result = validateText(
        "Hello world this is a long enough text for validation to pass",
        100,
      );

      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it("should reject text below minimum character count", () => {
      const shortText = "Short";
      const result = validateText(shortText);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("at least 50 characters");
    });

    it("should reject text exceeding length limit", () => {
      const longText = "a".repeat(101);
      const result = validateText(longText, 100);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("100 characters or less");
    });

    it("should use default max length of 10000", () => {
      const longText = "a".repeat(10001);
      const result = validateText(longText);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("10,000 characters or less");
    });
  });

  describe("validateInput", () => {
    it("should validate URL mode correctly", () => {
      const result = validateInput("example.com", "url");

      expect(result.isValid).toBe(true);
    });

    it("should validate text mode correctly", () => {
      const result = validateInput(
        "This text content is long enough to meet the minimum character requirement of 50 characters",
        "text",
        100,
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe("formatUrl", () => {
    it("should add https to URLs without protocol", () => {
      expect(formatUrl("example.com")).toBe("https://example.com");
    });

    it("should not modify URLs with protocol", () => {
      expect(formatUrl("https://example.com")).toBe("https://example.com");
      expect(formatUrl("http://example.com")).toBe("http://example.com");
    });

    it("should handle empty strings", () => {
      expect(formatUrl("")).toBe("");
      expect(formatUrl("   ")).toBe("");
    });

    it("should trim whitespace", () => {
      expect(formatUrl("  example.com  ")).toBe("https://example.com");
    });
  });
});
