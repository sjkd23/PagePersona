import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { validateRequest } from "../middleware/zod-validation";
import {
  transformSchema,
  transformTextSchema,
} from "../schemas/transform.schema";
import { userProfileUpdateSchema } from "../schemas/user.schema";
import { chatMessageSchema } from "../schemas/chat.schema";
import { updateMembershipSchema } from "../schemas/admin.schema";

describe("Route Validation Integration", () => {
  const createTestApp = (
    schema: any,
    target: "body" | "query" | "params" = "body",
  ) => {
    const app = express();
    app.use(express.json());

    const mockHandler = (req: any, res: any) => {
      res.json({ success: true, data: req[target] });
    };

    if (target === "body") {
      app.post("/test", validateRequest(schema, target), mockHandler);
    } else if (target === "query") {
      app.get("/test", validateRequest(schema, target), mockHandler);
    } else if (target === "params") {
      app.get("/test/:id", validateRequest(schema, target), mockHandler);
    }

    return app;
  };

  describe("Transform Schema Validation", () => {
    it("should validate transform URL request with valid data", async () => {
      const app = createTestApp(transformSchema);

      const response = await request(app)
        .post("/test")
        .send({
          url: "https://example.com",
          persona: "professional",
          options: {
            truncateLength: 1000,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject transform URL request with invalid URL", async () => {
      const app = createTestApp(transformSchema);

      const response = await request(app).post("/test").send({
        url: "not-a-url",
        persona: "professional",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["url"],
            message: expect.stringContaining("Invalid url"),
          }),
        ]),
      );
    });

    it("should reject transform URL request with empty persona", async () => {
      const app = createTestApp(transformSchema);

      const response = await request(app).post("/test").send({
        url: "https://example.com",
        persona: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["persona"],
            message: expect.stringContaining(
              "String must contain at least 1 character",
            ),
          }),
        ]),
      );
    });

    it("should validate transform text request with valid data", async () => {
      const app = createTestApp(transformTextSchema);

      const response = await request(app).post("/test").send({
        text: "This is some text to transform",
        persona: "casual",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject transform text request with empty text", async () => {
      const app = createTestApp(transformTextSchema);

      const response = await request(app).post("/test").send({
        text: "",
        persona: "casual",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("User Schema Validation", () => {
    it("should validate user profile update with valid data", async () => {
      const app = createTestApp(userProfileUpdateSchema);

      const response = await request(app).post("/test").send({
        firstName: "John",
        lastName: "Doe",
        bio: "A brief bio",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject user profile update with no fields", async () => {
      const app = createTestApp(userProfileUpdateSchema);

      const response = await request(app).post("/test").send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject user profile update with invalid field lengths", async () => {
      const app = createTestApp(userProfileUpdateSchema);

      const response = await request(app)
        .post("/test")
        .send({
          firstName: "a".repeat(51), // Too long
          bio: "Valid bio",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("Chat Schema Validation", () => {
    it("should validate chat message with valid data", async () => {
      const app = createTestApp(chatMessageSchema);

      const response = await request(app).post("/test").send({
        message: "Hello, how are you?",
        model: "gpt-4",
        temperature: 0.7,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject chat message with empty message", async () => {
      const app = createTestApp(chatMessageSchema);

      const response = await request(app).post("/test").send({
        message: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });

    it("should reject chat message with invalid model", async () => {
      const app = createTestApp(chatMessageSchema);

      const response = await request(app).post("/test").send({
        message: "Hello",
        model: "invalid-model",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });
  });

  describe("Admin Schema Validation", () => {
    it("should validate membership update with valid data", async () => {
      const app = createTestApp(updateMembershipSchema);

      const response = await request(app).post("/test").send({
        membership: "premium",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject membership update with invalid membership type", async () => {
      const app = createTestApp(updateMembershipSchema);

      const response = await request(app).post("/test").send({
        membership: "invalid-type",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
    });
  });
});
