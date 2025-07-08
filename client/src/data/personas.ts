// personas.ts
import type { Persona } from '../types/personas';

export const personas: Persona[] = [
  {
    id: "eli5",
    label: "Explain Like I'm Five",
    name: "Explain Like I'm Five",
    description: "Super simple and easy, like you're five!",
    exampleTexts: "So imagine your brain is like a sponge...",
    avatarUrl: "/avatars/eli5.png",
    theme: {
      primary: "#FFB347",    // Crayon orange
      secondary: "#FFDB58",  // Yellow school bus
      accent: "#87CEEB",     // Soft sky blue
    },
  },
  {
    id: "medieval-knight",
    label: "Medieval Knight",
    name: "Medieval Knight",
    description: "Chivalrous, formal, and full of noble speech!",
    exampleTexts: "Hark! Let it be known across the land...",
    avatarUrl: "/avatars/knight.png",
    theme: {
      primary: "#6B4C3B",    // Brown leather
      secondary: "#D3C49E",  // Parchment beige
      accent: "#A29C9B",     // Steel grey
    },
  },
  {
    id: "anime-hacker",
    label: "Anime Hacker",
    name: "Anime Hacker",
    description: "Stylish, snarky, and fast as light!",
    exampleTexts: "System breach complete. Let’s rewrite the truth.",
    avatarUrl: "/avatars/hacker.png",
    theme: {
      primary: "#0F0F0F",    // Hacker black
      secondary: "#33FF33",  // Terminal green
      accent: "#FF00AA",     // Neon pink pop
    },
  },
  {
    id: "plague-doctor",
    label: "Plague Doctor",
    name: "Plague Doctor",
    description: "Cryptic, archaic, and full of ominous insight.",
    exampleTexts: "Ah yes... the affliction is spreading faster than expected.",
    avatarUrl: "/avatars/plague-doctor.png",
    theme: {
      primary: "#2E2E2E",    // Dark cloak
      secondary: "#A88F74",  // Aged parchment
      accent: "#4D5C57",     // Mysterious fog green
    },
  },
  {
    id: "robot",
    label: "Robot",
    name: "Robot",
    description: "Logical, precise, and devoid of emotion.",
    exampleTexts: "Processing complete. Your data has been assimilated.",
    avatarUrl: "/avatars/robot.png",
    theme: {
      primary: "#1E1E2F",    // Deep circuit gray
      secondary: "#6D83F2",  // Cool logic blue
      accent: "#00FFFF",     // Electric cyan
    },
  },
];
