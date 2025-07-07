import type { Persona } from './types';

interface PersonaAvatarsDemoProps {
  personas?: Persona[];
  className?: string;
}

const defaultPersonas: Persona[] = [
  {
    id: 'professional',
    name: 'Plague Doctor',
    imagePath: '/images/persona_avatars/Plague_Doctor_avatar.png',
    alt: 'Plague Doctor'
  },
  {
    id: 'casual',
    name: 'Explain It Like I\'m Five',
    imagePath: '/images/persona_avatars/Explain_It_Like_Im_Five_avatar.png',
    alt: 'Explain It Like I\'m Five'
  },
  {
    id: 'technical',
    name: 'Anime Hacker',
    imagePath: '/images/persona_avatars/Anime_Hacker_avatar.png',
    alt: 'Anime Hacker'
  }
];

export default function PersonaAvatarsDemo({ personas = defaultPersonas, className = '' }: PersonaAvatarsDemoProps) {
  return (
    <div className={`visual-item ${className}`}>
      <div className="persona-avatars">
        {personas.map((persona) => (
          <div key={persona.id} className={`avatar ${persona.id}`}>
            <img src={persona.imagePath} alt={persona.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}
