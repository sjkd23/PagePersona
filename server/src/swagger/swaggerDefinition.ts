import { OpenAPIObject } from "openapi3-ts/oas30";

export const swaggerDefinition: OpenAPIObject = {
  openapi: "3.0.0",
  info: {
    title: "PagePersonAI API",
    version: "1.0.0",
    description:
      "API documentation for PagePersonAI - AI-powered content transformation service",
  },
  servers: [
    {
      url: process.env.API_URL || "http://localhost:5000",
      description: "Local server",
    },
  ],
  tags: [
    {
      name: "Transform",
      description: "Content transformation using AI personas",
    },
    {
      name: "User",
      description: "User profile and account management",
    },
    {
      name: "Admin",
      description: "Administrative operations (admin only)",
    },
    {
      name: "Monitor",
      description: "System monitoring and health checks",
    },
  ],
  paths: {}, // Will be populated by swagger-jsdoc from route annotations
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object" },
          message: { type: "string" },
          error: { type: "string" },
        },
      },
      TransformRequest: {
        type: "object",
        required: ["url", "persona"],
        properties: {
          url: {
            type: "string",
            format: "uri",
            description: "Target webpage URL to transform",
          },
          persona: {
            type: "string",
            description: "Selected persona identifier for transformation",
          },
          options: {
            type: "object",
            properties: {
              truncateLength: {
                type: "integer",
                minimum: 1,
                description: "Maximum content length for truncation",
              },
            },
          },
        },
      },
      TransformTextRequest: {
        type: "object",
        required: ["text", "persona"],
        properties: {
          text: {
            type: "string",
            description: "Direct text input to transform",
          },
          persona: {
            type: "string",
            description: "Selected persona identifier for transformation",
          },
          options: {
            type: "object",
            properties: {
              truncateLength: {
                type: "integer",
                minimum: 1,
                description: "Maximum content length for truncation",
              },
            },
          },
        },
      },
      TransformResponse: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Brief summary of the transformed content",
          },
          transformed: {
            type: "string",
            description: "AI-transformed content based on selected persona",
          },
          originalUrl: {
            type: "string",
            description: "Original URL that was transformed",
          },
          persona: {
            type: "string",
            description: "Persona used for transformation",
          },
          wordCount: {
            type: "integer",
            description: "Word count of the transformed content",
          },
        },
      },
      Persona: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Unique persona identifier",
          },
          name: {
            type: "string",
            description: "Display name of the persona",
          },
          description: {
            type: "string",
            description: "Description of the persona's characteristics",
          },
          avatarUrl: {
            type: "string",
            description: "URL to persona avatar image",
          },
          theme: {
            type: "string",
            description: "Theme color for UI representation",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          picture: { type: "string" },
          sub: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UsageStats: {
        type: "object",
        properties: {
          totalTransformations: { type: "integer" },
          totalUsers: { type: "integer" },
          transformationsByPersona: { type: "object" },
          recentActivity: { type: "array", items: { type: "object" } },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
          message: { type: "string" },
          code: { type: "string" },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};
