// Username generation utilities for Auth0 user sync

/**
 * Generate a unique username from Auth0 user data
 * Includes Auth0 sub for uniqueness and handles edge cases
 */
import type { ProcessedAuth0User } from "../types/common";

/**
 * Generate a username from Auth0 user data
 * Provides fallback logic for different Auth0 user structures
 */
export function generateUsernameFromAuth0(
  auth0User: ProcessedAuth0User,
): string {
  const { sub, nickname, name, email } = auth0User;

  // Extract short identifier from Auth0 sub (e.g., "auth0|123abc" -> "123abc")
  const subId = sub?.split("|").pop()?.slice(-6) || "user";

  let baseUsername = "";

  // Try different sources in order of preference
  if (nickname && isValidUsernameBase(nickname)) {
    baseUsername = sanitizeUsername(nickname);
  } else if (name && isValidUsernameBase(name)) {
    baseUsername = sanitizeUsername(name);
  } else if (email && isValidUsernameBase(email)) {
    const emailBase = email.split("@")[0];
    baseUsername = sanitizeUsername(emailBase);
  } else {
    baseUsername = "user";
  }

  // Always include part of Auth0 sub for uniqueness
  return `${baseUsername}_${subId}`;
}

/**
 * Check if a string is suitable as username base
 */
function isValidUsernameBase(str: string): boolean {
  return (
    Boolean(str) &&
    str.length >= 2 &&
    str.length <= 20 &&
    !/^\d+$/.test(str) && // Not just numbers
    !/^[._-]+$/.test(str)
  ); // Not just special chars
}

/**
 * Sanitize string for username use
 */
function sanitizeUsername(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "") // Remove invalid chars
    .replace(/^[._-]+|[._-]+$/g, "") // Remove leading/trailing special chars
    .slice(0, 15); // Limit length to leave room for sub ID
}

/**
 * Ensure username uniqueness by checking database
 */
export async function ensureUniqueUsername(
  baseUsername: string,
  checkExists: (username: string) => Promise<boolean>,
): Promise<string> {
  let username = baseUsername;
  let counter = 1;

  // If base username exists, try variants
  while (await checkExists(username)) {
    username = `${baseUsername}${counter}`;
    counter++;

    // Prevent infinite loops
    if (counter > 999) {
      username = `${baseUsername}_${Date.now()}`;
      break;
    }
  }

  return username;
}
