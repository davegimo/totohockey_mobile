import { User, Partita, Pronostico, Squadra } from '../services/supabase';

export type { User, Partita, Pronostico, Squadra };

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

export type PartitaWithPronostico = Partita & {
  pronostico?: Pronostico;
}; 