import { ClientPersona, ServerPersona } from '../types/personas'

/**
 * Maps a ClientPersona to a ServerPersona for API calls
 */
export function clientToServerPersona(clientPersona: ClientPersona): ServerPersona {
  // For now, we'll need to fetch the server persona data separately
  // This is a simplified mapping that just preserves the base fields
  return {
    id: clientPersona.id,
    name: clientPersona.name,
    description: clientPersona.description,
    // These would need to be fetched from the server or stored separately
    toneModifier: '', // Placeholder
    systemPrompt: ''  // Placeholder
  }
}

/**
 * Maps a ServerPersona to a ClientPersona for UI display
 */
export function serverToClientPersona(serverPersona: ServerPersona): ClientPersona {
  // This would need UI-specific data that's not in ServerPersona
  // For now, providing minimal mapping
  return {
    id: serverPersona.id,
    name: serverPersona.name,
    description: serverPersona.description,
    // These would need to come from a separate UI config
    label: serverPersona.name, // Use name as fallback
    exampleTexts: [], // Placeholder
    avatarUrl: `/avatars/${serverPersona.id}.png`, // Convention-based
    theme: {
      primary: '#6B7280',   // Default gray
      secondary: '#9CA3AF', // Default gray
      accent: '#3B82F6'     // Default blue
    }
  }
}
