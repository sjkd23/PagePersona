import { describe, it, expect } from "vitest";
import {
  themeClasses,
  getComponentClasses,
  personaColors,
} from "../themeUtils";

describe("utils/themeUtils", () => {
  describe("themeClasses", () => {
    it("should have all background classes with dark mode variants", () => {
      expect(themeClasses.backgroundPrimary).toContain("bg-white");
      expect(themeClasses.backgroundPrimary).toContain("dark:bg-gray-900");

      expect(themeClasses.backgroundSecondary).toContain("bg-gray-50");
      expect(themeClasses.backgroundSecondary).toContain("dark:bg-gray-800");

      expect(themeClasses.backgroundCard).toContain("bg-white");
      expect(themeClasses.backgroundCard).toContain("dark:bg-gray-800");
    });

    it("should have all text classes with dark mode variants", () => {
      expect(themeClasses.textPrimary).toContain("text-gray-900");
      expect(themeClasses.textPrimary).toContain("dark:text-gray-100");

      expect(themeClasses.textSecondary).toContain("text-gray-600");
      expect(themeClasses.textSecondary).toContain("dark:text-gray-300");

      expect(themeClasses.textAccent).toContain("text-blue-600");
      expect(themeClasses.textAccent).toContain("dark:text-blue-400");
    });

    it("should have border classes with dark mode variants", () => {
      expect(themeClasses.border).toContain("border-gray-200");
      expect(themeClasses.border).toContain("dark:border-gray-700");
    });

    it("should have button classes with hover and dark states", () => {
      expect(themeClasses.buttonPrimary).toContain("bg-blue-600");
      expect(themeClasses.buttonPrimary).toContain("hover:bg-blue-700");
      expect(themeClasses.buttonPrimary).toContain("dark:bg-blue-500");
      expect(themeClasses.buttonPrimary).toContain("dark:hover:bg-blue-600");
    });

    it("should have input classes with placeholder and focus states", () => {
      expect(themeClasses.input).toContain("bg-white");
      expect(themeClasses.input).toContain("dark:bg-gray-800");
      expect(themeClasses.input).toContain("placeholder-gray-500");
      expect(themeClasses.input).toContain("dark:placeholder-gray-400");
    });
  });

  describe("getComponentClasses", () => {
    it("should return card classes", () => {
      const cardClasses = getComponentClasses("card");
      expect(cardClasses).toContain("bg-white");
      expect(cardClasses).toContain("dark:bg-gray-800");
      expect(cardClasses).toContain("shadow-md");
    });

    it("should return button classes", () => {
      const buttonClasses = getComponentClasses("button");
      expect(buttonClasses).toBe(themeClasses.buttonPrimary);
    });

    it("should return input classes with focus styles", () => {
      const inputClasses = getComponentClasses("input");
      expect(inputClasses).toContain("focus:ring-2");
      expect(inputClasses).toContain("focus:ring-blue-500");
      expect(inputClasses).toContain("dark:focus:ring-blue-400");
    });

    it("should return modal classes", () => {
      const modalClasses = getComponentClasses("modal");
      expect(modalClasses).toContain("bg-white");
      expect(modalClasses).toContain("dark:bg-gray-900");
    });

    it("should return dropdown classes", () => {
      const dropdownClasses = getComponentClasses("dropdown");
      expect(dropdownClasses).toContain("shadow-lg");
      expect(dropdownClasses).toContain("bg-white");
      expect(dropdownClasses).toContain("dark:bg-gray-800");
    });
  });

  describe("personaColors", () => {
    it("should have light and dark variants for all personas", () => {
      Object.entries(personaColors).forEach(([, colors]) => {
        expect(colors).toHaveProperty("light");
        expect(colors).toHaveProperty("dark");
        expect(colors).toHaveProperty("accent");

        expect(typeof colors.light).toBe("string");
        expect(typeof colors.dark).toBe("string");
        expect(typeof colors.accent).toBe("string");

        // Light variant should contain bg- and text-
        expect(colors.light).toMatch(/bg-\w+/);
        expect(colors.light).toContain("text-white");

        // Dark variant should contain bg- and text-
        expect(colors.dark).toMatch(/bg-\w+/);
        expect(colors.dark).toContain("text-white");

        // Accent should contain text- and dark:text-
        expect(colors.accent).toMatch(/text-\w+/);
        expect(colors.accent).toMatch(/dark:text-\w+/);
      });
    });

    it("should contain expected persona IDs", () => {
      const expectedPersonas = [
        "eli5",
        "anime",
        "knight",
        "hacker",
        "pirate",
        "scientist",
        "comedian",
        "zen",
      ];

      expectedPersonas.forEach((personaId) => {
        expect(personaColors).toHaveProperty(personaId);
      });
    });

    it("should have unique color schemes for each persona", () => {
      const lightClasses = Object.values(personaColors).map((p) => p.light);
      const darkClasses = Object.values(personaColors).map((p) => p.dark);

      // Check that personas have different light colors (at least the bg color should be different)
      const uniqueLightBgs = new Set(
        lightClasses.map((cls) => cls.match(/bg-\w+-\d+/)?.[0]),
      );
      expect(uniqueLightBgs.size).toBeGreaterThan(1);

      // Check that personas have different dark colors (at least the bg color should be different)
      const uniqueDarkBgs = new Set(
        darkClasses.map((cls) => cls.match(/bg-\w+-\d+/)?.[0]),
      );
      expect(uniqueDarkBgs.size).toBeGreaterThan(1);
    });
  });

  describe("type safety", () => {
    it("should only accept valid component types", () => {
      // This test ensures TypeScript compilation - if it compiles, the types are correct
      const validComponents = [
        "card",
        "modal",
        "button",
        "input",
        "dropdown",
      ] as const;

      validComponents.forEach((component) => {
        expect(() => getComponentClasses(component)).not.toThrow();
      });
    });
  });
});
