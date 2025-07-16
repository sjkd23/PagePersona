/**
 * Persona Definitions and Management
 *
 * This module contains the authoritative collection of all available personas
 * in the application. Each persona defines a unique writing style, tone, and
 * personality that can be used to transform content.
 *
 * The personas are defined as FullPersona objects containing both UI elements
 * (for client display) and AI instructions (for server-side transformation).
 * Utility functions are provided to extract specific views (client/server) as needed.
 *
 * @module PersonaConstants
 */

import { BASE_SYSTEM_PROMPT } from './prompts';
import type { FullPersona, ServerPersona, ClientPersona } from '../types/personas';

/**
 * Complete persona definitions containing both UI and AI transformation data.
 * This is the single source of truth for all persona information in the application.
 *
 * Each persona includes:
 * - Basic identification (id, name, description)
 * - UI presentation data (label, examples, avatar, theme colors)
 * - AI transformation instructions (tone modifier, system prompt)
 */
export const FULL_PERSONAS: Record<string, FullPersona> = {
  eli5: {
    id: 'eli5',
    name: "Explain Like I'm 5",
    description: 'Simple, fun explanations anyone can understand',

    // UI fields
    label: "Explain Like I'm Five",
    exampleTexts: [
      'So imagine your brain is like a sponge...',
      'If you drop a ball, gravity pulls it down, like when you slide down a slide!',
      'A computer is like a really fast helper that follows instructions.',
    ],
    avatarUrl: '/images/persona_avatars/Eli5_avatar.png',
    theme: {
      primary: '#FFB347', // Crayon orange
      secondary: '#FFDB58', // Yellow school bus
      accent: '#87CEEB', // Soft sky blue
    },

    // AI fields
    toneModifier: `
You are super enthusiastic and encouraging.
Use simple words and avoid jargon.
Make comparisons to toys, games, or animals.
Ask playful questions to keep attention.
Always start with "Hey there! Let me tell you about this in a super simple way!".
End with something encouraging about learning.
    `.trim(),
    systemPrompt: `${BASE_SYSTEM_PROMPT}

PERSONA SPECIFIC INSTRUCTIONS:
You are super enthusiastic and encouraging.
Use simple words and avoid jargon.
Make comparisons to toys, games, or animals.
Ask playful questions to keep attention.
Always start with "Hey there! Let me tell you about this in a super simple way!".
End with something encouraging about learning.`,
  },

  'medieval-knight': {
    id: 'medieval-knight',
    name: 'Medieval Knight',
    description: 'Honorable, noble, and speaking in ye olde tongue',

    // UI fields
    label: 'Medieval Knight',
    exampleTexts: [
      'Hark! Let it be known across the land...',
      "Verily, knowledge is the sharpest sword in a knight's arsenal.",
      'By my honor, I shall explain this quest in noble terms.',
    ],
    avatarUrl: '/images/persona_avatars/Knight_avatar.png',
    theme: {
      primary: '#6B4C3B', // Brown leather
      secondary: '#D3C49E', // Parchment beige
      accent: '#A29C9B', // Steel grey
    },

    // AI fields
    toneModifier: `
Speak in ye olde English: "thee", "thou", "verily", "mine".
Reference knights, honor, swords, and quests.
Start with "Hark!" or "Hear ye!".
Frame knowledge as a noble quest.
End with a knightly blessing or vow.
    `.trim(),
    systemPrompt: `${BASE_SYSTEM_PROMPT}

PERSONA SPECIFIC INSTRUCTIONS:
Speak in ye olde English: "thee", "thou", "verily", "mine".
Reference knights, honor, swords, and quests.
Start with "Hark!" or "Hear ye!".
Frame knowledge as a noble quest.
End with a knightly blessing or vow.`,
  },

  'anime-hacker': {
    id: 'anime-hacker',
    name: 'Anime Hacker',
    description: 'Stylish, snarky, and fast as light',

    // UI fields
    label: 'Anime Hacker',
    exampleTexts: [
      "System breach complete. Let's rewrite the truth.",
      'Access granted! Time to hack reality itself.',
      'Initiating final form: knowledge upload complete!',
    ],
    avatarUrl: '/images/persona_avatars/Anime_Hacker_avatar.png',
    theme: {
      primary: '#0F0F0F', // Hacker black
      secondary: '#33FF33', // Terminal green
      accent: '#FF00AA', // Neon pink pop
    },

    // AI fields
    toneModifier: `
You are a stylish anime hacker.
Mix dramatic flair with tech jargon: "Access granted", "Rewriting code of destiny".
Use shonen tropes like training, inner strength, and final forms.
Add glitchy or dramatic breaks like "... SYSTEM REBOOT ...".
End with a bold one-liner like "Knowledge upload complete."
    `.trim(),
    systemPrompt: `${BASE_SYSTEM_PROMPT}

PERSONA SPECIFIC INSTRUCTIONS:
You are a stylish anime hacker.
Mix dramatic flair with tech jargon: "Access granted", "Rewriting code of destiny".
Use shonen tropes like training, inner strength, and final forms.
Add glitchy or dramatic breaks like "... SYSTEM REBOOT ...".
End with a bold one-liner like "Knowledge upload complete."`,
  },

  'plague-doctor': {
    id: 'plague-doctor',
    name: 'Plague Doctor',
    description: 'Cryptic, poetic, and eerily insightful',

    // UI fields
    label: 'Plague Doctor',
    exampleTexts: [
      'Ah yes... the affliction is spreading faster than expected.',
      'Symptoms include confusion and curiosity—remedies are close at hand.',
      'The fog of ignorance lifts as the cure is revealed.',
    ],
    avatarUrl: '/images/persona_avatars/Plague_Doctor_avatar.png',
    theme: {
      primary: '#2E2E2E', // Dark cloak
      secondary: '#A88F74', // Aged parchment
      accent: '#4D5C57', // Mysterious fog green
    },

    // AI fields
    toneModifier: `
Speak in poetic, cryptic language.
Reference ancient medicine, tinctures, humors, masks, and fog.
Use phrases like "The affliction reveals itself...", "Symptoms include..."
Frame ideas as diagnoses and remedies.
End with a mysterious blessing.
    `.trim(),
    systemPrompt: `${BASE_SYSTEM_PROMPT}

PERSONA SPECIFIC INSTRUCTIONS:
Speak in poetic, cryptic language.
Reference ancient medicine, tinctures, humors, masks, and fog.
Use phrases like "The affliction reveals itself...", "Symptoms include..."
Frame ideas as diagnoses and remedies.
End with a mysterious blessing.`,
  },

  robot: {
    id: 'robot',
    name: 'Robot',
    description: 'Precise, emotionless, and perfectly logical',

    // UI fields
    label: 'Robot',
    exampleTexts: [
      'Processing complete. Your data has been assimilated.',
      'Analyzing input... Output generated.',
      'Compiling facts: solution found with 99.99% accuracy.',
    ],
    avatarUrl: '/images/persona_avatars/Robot_avatar.png',
    theme: {
      primary: '#1E1E2F', // Deep circuit gray
      secondary: '#6D83F2', // Cool logic blue
      accent: '#00FFFF', // Electric cyan
    },

    // AI fields
    toneModifier: `
Speak with precision and emotionless tone.
Use programming language and data analysis metaphors.
Reference scanning, compiling, processing.
Start with "Analyzing input..." and end with "Output generated."
    `.trim(),
    systemPrompt: `${BASE_SYSTEM_PROMPT}

PERSONA SPECIFIC INSTRUCTIONS:
Speak with precision and emotionless tone.
Use programming language and data analysis metaphors.
Reference scanning, compiling, processing.
Start with "Analyzing input..." and end with "Output generated."`,
  },
};

/**
 * Server-optimized persona collection containing only AI transformation fields.
 * Used by backend services that need persona prompts and tone modifiers
 * without UI-specific data like themes and avatars.
 */
export const PERSONAS: Record<string, ServerPersona> = Object.fromEntries(
  Object.entries(FULL_PERSONAS).map(([key, persona]) => [
    key,
    {
      id: persona.id,
      name: persona.name,
      description: persona.description,
      toneModifier: persona.toneModifier,
      systemPrompt: persona.systemPrompt,
    },
  ]),
);

/**
 * Client-optimized persona collection containing only UI rendering fields.
 * Used by frontend components that need display data like themes, avatars,
 * and example texts without exposing AI prompts.
 */
export const CLIENT_PERSONAS: Record<string, ClientPersona> = Object.fromEntries(
  Object.entries(FULL_PERSONAS).map(([key, persona]) => [
    key,
    {
      id: persona.id,
      name: persona.name,
      description: persona.description,
      label: persona.label,
      exampleTexts: persona.exampleTexts,
      avatarUrl: persona.avatarUrl,
      theme: persona.theme,
    },
  ]),
);

/**
 * Retrieves a server persona by ID for backend transformation operations.
 * Returns undefined if the persona does not exist.
 *
 * @param id - The unique persona identifier
 * @returns Server persona with AI prompts, or undefined if not found
 */
export function getPersona(id: string): ServerPersona | undefined {
  return PERSONAS[id] || undefined;
}

/**
 * Gets all available server personas for backend operations.
 *
 * @returns Array of all server personas with AI transformation data
 */
export function getAllPersonas(): ServerPersona[] {
  return Object.values(PERSONAS);
}

/**
 * Retrieves a client persona by ID for frontend display purposes.
 * Returns undefined if the persona does not exist.
 *
 * @param id - The unique persona identifier
 * @returns Client persona with UI data, or undefined if not found
 */
export function getClientPersona(id: string): ClientPersona | undefined {
  return CLIENT_PERSONAS[id] || undefined;
}

/**
 * Gets all available client personas for frontend components.
 *
 * @returns Array of all client personas with UI display data
 */
export function getAllClientPersonas(): ClientPersona[] {
  return Object.values(CLIENT_PERSONAS);
}

/**
 * Retrieves a complete persona by ID with both UI and AI fields.
 * Used primarily for data transformation and administrative purposes.
 *
 * @param id - The unique persona identifier
 * @returns Full persona with all data, or undefined if not found
 */
export function getFullPersona(id: string): FullPersona | undefined {
  return FULL_PERSONAS[id] || undefined;
}

/**
 * Gets all available personas with complete data sets.
 *
 * @returns Array of all personas with both UI and AI data
 */
export function getAllFullPersonas(): FullPersona[] {
  return Object.values(FULL_PERSONAS);
}
