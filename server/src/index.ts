/**
 * PagePersonAI Server Application
 *
 * Main entry point for the PagePersonAI backend API server.
 */

import dotenv from "dotenv";
import createServer from "./app";

// Load environment variables once
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
  debug: false,
  override: false,
});


process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
});

// Start Express server (binds to process.env.PORT)
createServer();
