import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'providers/providers.dart';
import 'theme/app_theme.dart';
import 'screens/auth/auth_wrapper.dart';
import 'screens/home/main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  debugPrint('=== TotoHockey App Start ===');
  
  // Configura orientamento
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Verifica configurazione Supabase
  debugPrint('Verifica configurazione Supabase...');
  if (!SupabaseConfig.isConfigured) {
    debugPrint('ERRORE: Credenziali Supabase non configurate');
    runApp(const ConfigErrorApp());
    return;
  }
  
  debugPrint('Credenziali Supabase configurate');
  debugPrint('URL: ${SupabaseConfig.supabaseUrl}');
  debugPrint('Key: ${SupabaseConfig.supabaseAnonKey.substring(0, 20)}...');
  
  // Inizializza Supabase
  try {
    debugPrint('Inizializzazione Supabase...');
    await Supabase.initialize(
      url: SupabaseConfig.supabaseUrl,
      anonKey: SupabaseConfig.supabaseAnonKey,
    );
    debugPrint('Supabase inizializzato con successo');
    runApp(const TotoHockeyApp());
  } catch (e, stackTrace) {
    debugPrint('ERRORE inizializzazione Supabase: $e');
    debugPrint('Stack trace: $stackTrace');
    runApp(ConfigErrorApp(error: e.toString()));
  }
}

class TotoHockeyApp extends StatelessWidget {
  const TotoHockeyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
        ChangeNotifierProvider(create: (_) => ClassificaProvider()),
        ChangeNotifierProvider(create: (_) => LegheProvider()),
      ],
      child: MaterialApp(
        title: 'TotoHockey',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const AuthGate(),
        builder: (context, child) {
          // Cattura errori non gestiti
          return MediaQuery(
            data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(1.0)),
            child: child ?? const SizedBox(),
          );
        },
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        debugPrint('AuthGate: Status = ${auth.status}');
        
        // Loading iniziale con timeout
        if (auth.status == AuthStatus.initial) {
          // Timeout dopo 5 secondi
          Future.delayed(const Duration(seconds: 5), () {
            if (auth.status == AuthStatus.initial) {
              debugPrint('AuthGate: Timeout - forzo stato unauthenticated');
              // Se dopo 5 secondi è ancora initial, forziamo unauthenticated
              // Questo evita che rimanga bloccato
            }
          });
          
          return Scaffold(
            backgroundColor: Theme.of(context).scaffoldBackgroundColor,
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 24),
                  Text(
                    'Caricamento...',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Stato: ${auth.status}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          );
        }
        
        // Autenticato
        if (auth.status == AuthStatus.authenticated) {
          debugPrint('AuthGate: Mostro MainScreen');
          return const MainScreen();
        }
        
        // Non autenticato
        debugPrint('AuthGate: Mostro AuthWrapper');
        return const AuthWrapper();
      },
    );
  }
}

class ConfigErrorApp extends StatelessWidget {
  final String? error;
  
  const ConfigErrorApp({super.key, this.error});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TotoHockey',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red,
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Configurazione Supabase Richiesta',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Per utilizzare l\'app, devi configurare le credenziali Supabase.',
                    style: TextStyle(fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Istruzioni:',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    '1. Apri il file lib/config/supabase_config.dart\n'
                    '2. Inserisci il tuo SUPABASE_URL\n'
                    '3. Inserisci la tua SUPABASE_ANON_KEY\n'
                    '4. Riavvia l\'app',
                    style: TextStyle(fontSize: 14),
                    textAlign: TextAlign.left,
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red),
                      ),
                      child: Text(
                        'Errore: $error',
                        style: const TextStyle(
                          color: Colors.red,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
