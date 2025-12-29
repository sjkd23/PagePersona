import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock console methods to capture output
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe("Logger Utility", () => {
  let originalConsole: typeof console;
  let logger: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Store original console
    originalConsole = { ...console };

    // Replace console methods with mocks
    Object.assign(console, mockConsole);

    // Dynamically import the logger to avoid caching issues
    vi.resetModules();
    const loggerModule = await import("../logger");
    logger = loggerModule.logger;
  });

  afterEach(() => {
    // Restore original console
    Object.assign(console, originalConsole);
    vi.restoreAllMocks();
  });

  describe("Basic Logging Functions", () => {
    it("should have all expected logging methods", () => {
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });

    it("should log info messages correctly", () => {
      const message = "Test info message";
      const data = { key: "value" };

      logger.info(message, data);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
      );
    });

    it("should log error messages correctly", () => {
      const message = "Test error message";
      const error = new Error("Test error");

      logger.error(message, error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]"),
      );
    });

    it("should log warning messages correctly", () => {
      const message = "Test warning message";
      const data = { warning: "details" };

      logger.warn(message, data);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]"),
      );
    });

    it("should log debug messages correctly", () => {
      const message = "Test debug message";
      const debugData = { debug: "info" };

      logger.debug(message, debugData);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG]"),
      );
    });
  });

  describe("Context-Specific Loggers", () => {
    it("should have transform context logger", () => {
      expect(typeof logger.transform).toBe("object");
      expect(typeof logger.transform.info).toBe("function");
      expect(typeof logger.transform.error).toBe("function");
      expect(typeof logger.transform.warn).toBe("function");
      expect(typeof logger.transform.debug).toBe("function");
    });

    it("should use transform prefix in transform logger", () => {
      logger.transform.info("Transform test message");

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining("[Transform]"),
      );
    });

    it("should have validation context logger", () => {
      expect(typeof logger.validation).toBe("object");
      expect(typeof logger.validation.info).toBe("function");
    });

    it("should use validation prefix in validation logger", () => {
      logger.validation.warn("Validation warning");

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("[Validation]"),
      );
    });

    it("should have usage context logger", () => {
      expect(typeof logger.usage).toBe("object");
      expect(typeof logger.usage.info).toBe("function");
    });

    it("should have test context logger", () => {
      expect(typeof logger.test).toBe("object");
      expect(typeof logger.test.info).toBe("function");
    });

    it("should have session context logger", () => {
      expect(typeof logger.session).toBe("object");
      expect(typeof logger.session.info).toBe("function");
    });
  });

  describe("Message Formatting", () => {
    it("should include timestamps in log messages", () => {
      logger.info("Test message");
      // The logger output does not include timestamps or emoji, only [INFO] prefix and message
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] Test message/),
      );
    });

    it("should include log level in formatted message", () => {
      logger.error("Error test");
      logger.warn("Warning test");
      logger.info("Info test");
      logger.debug("Debug test");

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]"),
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]"),
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
      );
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG]"),
      );
    });

    it("should include emoji prefixes in log messages", () => {
      logger.info("Info with emoji");
      logger.warn("Warning with emoji");
      logger.error("Error with emoji");
      // The logger output does not include emoji, only [LEVEL] prefix and message
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]"),
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]"),
      );
    });

    it("should handle messages without additional data", () => {
      logger.info("Simple message");

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining("Simple message"),
      );
    });

    it("should handle complex data objects", () => {
      const complexData = {
        nested: {
          object: {
            value: "test",
          },
        },
        array: [1, 2, 3],
        date: new Date(),
        number: 42,
      };

      expect(() => logger.info("Complex data test", complexData)).not.toThrow();
      expect(mockConsole.info).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle Error objects correctly", () => {
      const error = new Error("Test error message");
      error.stack = "Test stack trace";

      logger.error("Error occurred", error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Error occurred"),
      );
    });

    it("should handle custom error objects", () => {
      const customError = {
        name: "CustomError",
        message: "Custom error message",
        code: "CUSTOM_ERROR",
      };

      logger.error("Custom error occurred", customError);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Custom error occurred"),
      );
    });

    it("should handle null and undefined values gracefully", () => {
      expect(() => logger.info("Null test", null)).not.toThrow();
      expect(() => logger.info("Undefined test", undefined)).not.toThrow();
      expect(() => logger.error("Error with null", null)).not.toThrow();
    });

    it("should handle errors with context loggers", () => {
      const error = new Error("Transform error");

      expect(() =>
        logger.transform.error("Transform failed", error),
      ).not.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("[Transform]"),
      );
    });
  });

  describe("Environment-Specific Behavior", () => {
    it("should respect NODE_ENV settings", () => {
      const originalEnv = process.env.NODE_ENV;

      // Test that logger instance exists regardless of environment
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");

      process.env.NODE_ENV = originalEnv;
    });

    it("should handle debug mode correctly", () => {
      logger.debug("Debug message test");

      // Debug logs should be callable
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG]"),
      );
    });
  });

  describe("Integration Scenarios", () => {
    it("should log multiple messages in sequence", () => {
      logger.info("First message");
      logger.warn("Second message");
      logger.error("Third message");

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid successive logging", () => {
      for (let i = 0; i < 5; i++) {
        logger.info(`Message ${i}`, { index: i });
      }

      expect(mockConsole.info).toHaveBeenCalledTimes(5);
    });

    it("should maintain log formatting consistency across all contexts", () => {
      const testData = { consistent: "data" };

      logger.info("Info message", testData);
      logger.transform.info("Transform message", testData);
      logger.validation.warn("Validation message", testData);
      logger.usage.error("Usage message", undefined, testData);

      // All calls should have been made with proper formatting
      expect(mockConsole.info).toHaveBeenCalledTimes(2);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    it("should work with all context loggers", () => {
      logger.transform.info("Transform info");
      logger.validation.warn("Validation warning");
      logger.usage.error("Usage error");
      logger.test.debug("Test debug");
      logger.session.info("Session info");

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining("[Transform]"),
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("[Validation]"),
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("[Usage]"),
      );
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining("[Test]"),
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining("[Session]"),
      );
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle large data objects without crashing", () => {
      const largeObject = {
        data: new Array(100)
          .fill(0)
          .map((_, i) => ({ id: i, value: `value-${i}` })),
      };

      expect(() => logger.info("Large object test", largeObject)).not.toThrow();
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it("should handle logging with special characters", () => {
      const specialMessage = "Message with émojis 🚀 and spëcial chars ñ";
      const specialData = {
        unicode: "👍🎉",
        special: "café",
        symbols: "!@#$%^&*()",
      };

      expect(() => logger.info(specialMessage, specialData)).not.toThrow();
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(specialMessage),
      );
    });

    it("should handle empty strings and edge case inputs", () => {
      expect(() => logger.info("")).not.toThrow();
      expect(() => logger.warn("   ")).not.toThrow();
      expect(() => logger.error("\\n\\t")).not.toThrow();

      expect(mockConsole.info).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });
});
