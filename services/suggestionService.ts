
// FIX: Add .ts extension to file path.
import { Suggestion, View } from '../types.ts';

const suggestions: Suggestion[] = [
  {
    id: 1,
    icon: 'breathing',
    title: 'Exercício de Respiração',
    description: 'Comece o dia com uma sessão de 5 minutos de respiração diafragmática.',
    module: View.Sanctuary,
  },
  {
    id: 2,
    // FIX: Replaced non-existent 'path' icon with 'brainCircuit'.
    icon: 'brainCircuit',
    title: 'Fundamentos da TCC',
    description: 'Continue sua jornada de aprendizado na trilha de Terapia Cognitivo-Comportamental.',
    module: View.Academy,
  },
  {
    id: 3,
    icon: 'book',
    title: 'Explorar o Estoicismo',
    description: 'Descubra como os antigos filósofos lidavam com a adversidade e o controle.',
    module: View.Library,
  },
  {
    id: 4,
    icon: 'feather',
    title: 'Check-in Emocional',
    description: 'Reserve um momento para registrar como você está se sentindo agora.',
    module: View.Sanctuary,
  },
  {
    id: 5,
    icon: 'brain',
    title: 'Insight Personalizado da IA',
    description: "Notamos seu interesse em 'apego evitativo'. Gostaria de explorar a Teoria do Apego?",
    module: View.Academy,
  },
];

export const getDailySuggestions = (): Promise<Suggestion[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(suggestions);
    }, 500); // Simulate network delay
  });
};