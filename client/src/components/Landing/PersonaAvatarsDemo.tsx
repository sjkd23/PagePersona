import { getClientPersona } from "@pagepersonai/shared";
import type { ClientPersona } from "@pagepersonai/shared";

interface PersonaAvatar {
  id: string;
  name: string;
  imagePath: string;
  alt: string;
  className: string;
}

interface PersonaAvatarsDemoProps {
  personas?: PersonaAvatar[];
  className?: string;
}

const personaIds = ["plague-doctor", "eli5", "anime-hacker"] as const;

const defaultPersonas: PersonaAvatar[] = personaIds
  .map((id) => getClientPersona(id))
  .filter((persona): persona is ClientPersona => Boolean(persona))
  .map((persona) => ({
    id: persona.id,
    name: persona.label,
    imagePath: persona.avatarUrl,
    alt: persona.label,
    className:
      persona.id === "plague-doctor"
        ? "plague_doctor"
        : persona.id === "eli5"
          ? "eli5"
          : persona.id === "anime-hacker"
            ? "anime_hacker"
            : persona.id.replace(/[^a-z0-9-]/gi, "_"), // e.g. 'plague-doctor', 'eli5', 'anime-hacker'
  }));

export default function PersonaAvatarsDemo({
  personas = defaultPersonas,
  className = "",
}: PersonaAvatarsDemoProps) {
  return (
    <div className={`visual-item ${className}`}>
      <div className="persona-avatars">
        {personas.map((persona) => (
          <div key={persona.id} className={`avatar ${persona.className}`}>
            <img src={persona.imagePath} alt={persona.alt} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}
