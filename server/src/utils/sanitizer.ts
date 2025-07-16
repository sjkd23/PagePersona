/**
 * Content Sanitization Utility
 *
 * Provides HTML sanitization for user-supplied and AI-generated content
 * to prevent XSS attacks and ensure safe rendering in web applications.
 * Uses sanitize-html library with custom configuration for allowed tags
 * and attributes.
 *
 * Features:
 * - Removes malicious scripts and event handlers
 * - Allows safe HTML tags and attributes
 * - Automatically adds security attributes to links
 * - Configurable whitelist of allowed content
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * Removes potentially dangerous HTML elements and attributes while
 * preserving safe formatting elements. Automatically adds security
 * attributes to links and ensures all content is safe for rendering.
 *
 * @param content - Raw HTML content to sanitize
 * @returns Sanitized HTML content safe for rendering
 */
export function sanitize(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return sanitizeHtml(content, {
    // Allow safe HTML tags including images
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),

    // Configure allowed attributes for each tag
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height'],
      a: ['href', 'rel', 'target'],
    },

    // Allow safe URL schemes
    allowedSchemes: ['http', 'https', 'data', 'mailto'],

    // Transform links to be secure by default
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },

    // Remove any classes or styles that could be malicious
    allowedClasses: {},
    allowedStyles: {},

    // Be strict about protocol relative URLs
    allowProtocolRelative: false,

    // Additional security options
    disallowedTagsMode: 'discard',
    allowedIframeHostnames: [], // No iframes allowed
  });
}

/**
 * Sanitize plain text content by encoding HTML entities
 *
 * For content that should be displayed as plain text, this function
 * encodes HTML entities to prevent any HTML interpretation.
 *
 * @param content - Plain text content to sanitize
 * @returns HTML-encoded safe text content
 */
export function sanitizeText(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize user input fields that may contain HTML
 *
 * Specialized sanitization for user inputs that might contain
 * some HTML formatting but should be more restrictive than
 * AI-generated content.
 *
 * @param content - User input content to sanitize
 * @returns Sanitized content with limited HTML allowed
 */
export function sanitizeUserInput(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return sanitizeHtml(content, {
    // Very limited set of allowed tags for user input
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],

    // No attributes allowed for user input
    allowedAttributes: {},

    // No external schemes allowed
    allowedSchemes: [],

    // Strip all potentially dangerous content
    disallowedTagsMode: 'discard',
    allowedIframeHostnames: [],
    allowedClasses: {},
    allowedStyles: {},
    allowProtocolRelative: false,
  });
}
