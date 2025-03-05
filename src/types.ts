import { Partita, Pronostico } from './services/supabase';

export type PartitaWithPronostico = Partita & {
  pronostico?: Pronostico | null;
};

export type PronosticoFormData = {
  pronostico_casa: number;
  pronostico_ospite: number;
}; 