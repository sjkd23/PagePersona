// Utility functions for PersonaSelector

export const getPersonaEmoji = (id: string): string => {
  const emojiMap: { [key: string]: string } = {
    'eli5': '🧒',
    'anime-hero': '⚔️',
    'medieval-knight': '🛡️',
    'hacker': '💻',
    'pirate': '🏴‍☠️',
    'scientist': '🧪',
    'comedian': '😂',
    'zen-master': '🧘'
  }
  return emojiMap[id] || '🎭'
}

export const getPersonaTheme = (id: string) => {
  interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
  }
  
  const themeMap: { [key: string]: ThemeColors } = {
    'eli5': { primary: '#FF6B6B', secondary: '#FFE66D', accent: '#4ECDC4' },
    'anime-hero': { primary: '#FF4757', secondary: '#FF6B7A', accent: '#FFA726' },
    'medieval-knight': { primary: '#8B4513', secondary: '#DAA520', accent: '#C0C0C0' },
    'hacker': { primary: '#00FF41', secondary: '#008F11', accent: '#000000' },
    'pirate': { primary: '#8B4513', secondary: '#DAA520', accent: '#FF6347' },
    'scientist': { primary: '#9C27B0', secondary: '#E1BEE7', accent: '#4CAF50' },
    'comedian': { primary: '#FF9800', secondary: '#FFE0B2', accent: '#F44336' },
    'zen-master': { primary: '#4CAF50', secondary: '#C8E6C9', accent: '#795548' }
  }
  return themeMap[id] || { primary: '#6B73FF', secondary: '#9096FF', accent: '#FF6B6B' }
}
