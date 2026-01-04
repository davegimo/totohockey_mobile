// Configurazione Supabase
// IMPORTANTE: Inserisci qui le tue credenziali Supabase
// Puoi trovarle nel dashboard di Supabase: https://app.supabase.com

class SupabaseConfig {
  // Opzione 1: Inserisci direttamente qui le credenziali (per sviluppo)
  static const String supabaseUrl = 'https://fpwoioyevwhsrlasyynp.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwd29pb3lldndoc3JsYXN5eW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzA5NDksImV4cCI6MjA1NjUwNjk0OX0.FpwUodYUow4gNpOsLabdF5vmI7OCRkrR5P3UR4zjXy4';
  
  // Opzione 2: Usa variabili d'ambiente (per produzione)
  // static const String supabaseUrl = String.fromEnvironment(
  //   'SUPABASE_URL',
  //   defaultValue: 'https://YOUR_PROJECT.supabase.co',
  // );
  // 
  // static const String supabaseAnonKey = String.fromEnvironment(
  //   'SUPABASE_ANON_KEY',
  //   defaultValue: 'YOUR_ANON_KEY',
  // );
  
  // Verifica se le credenziali sono configurate
  static bool get isConfigured {
    return supabaseUrl != 'https://YOUR_PROJECT.supabase.co' && 
           supabaseAnonKey != 'YOUR_ANON_KEY' &&
           supabaseUrl.isNotEmpty && 
           supabaseAnonKey.isNotEmpty;
  }
}



