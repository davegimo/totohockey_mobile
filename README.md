# TotoHockey Mobile

App Flutter per pronostici sull'hockey su ghiaccio italiano.

## 📱 Piattaforme Supportate

- iOS
- Android

## 🚀 Quick Start

### Prerequisiti

- Flutter SDK >= 3.10.3
- Xcode (per iOS)
- Android Studio (per Android)
- CocoaPods (per iOS)

### Installazione

```bash
# Clona il repository
git clone <repo-url>
cd "totohockey mobile"

# Installa le dipendenze
flutter pub get

# Per iOS, installa i pod
cd ios && pod install && cd ..

# Avvia l'app
flutter run
```

## 🔧 Configurazione

### Supabase

Configura le credenziali Supabase in `lib/config/supabase_config.dart`:

```dart
class SupabaseConfig {
  static const String supabaseUrl = 'YOUR_SUPABASE_URL';
  static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
}
```

Oppure passale come variabili d'ambiente durante il build:

```bash
flutter run --dart-define=SUPABASE_URL=https://xxx.supabase.co --dart-define=SUPABASE_ANON_KEY=xxx
```

## 📁 Struttura del Progetto

```
lib/
├── config/           # Configurazioni app e Supabase
├── models/           # Modelli dati (User, Partita, Pronostico, Lega, ecc.)
├── providers/        # State management con Provider
├── screens/          # Schermate dell'app
│   ├── auth/         # Login, Signup, Forgot Password
│   ├── home/         # Dashboard, Classifica, Profilo
│   └── leagues/      # Leghe (lista, dettaglio, creazione)
├── services/         # Servizi (Supabase)
├── theme/            # Tema e stili
├── utils/            # Utility e helpers
└── widgets/          # Widget riutilizzabili
```

## ✨ Funzionalità

- 🔐 **Autenticazione**: Login, registrazione, recupero password
- 🏒 **Pronostici**: Inserisci pronostici sulle partite di hockey
- 📊 **Classifica**: Visualizza la classifica generale
- 👥 **Leghe Private**: Crea e gestisci leghe con i tuoi amici
- 🔗 **Inviti**: Condividi link per invitare altri giocatori
- 📱 **UI Moderna**: Design dark mode con animazioni fluide

## 🎨 Design

L'app utilizza un tema dark moderno con:
- Colori primari: Blu navy (#1E3A5F) e blu (#3498DB)
- Font: Poppins (via Google Fonts)
- Animazioni fluide con flutter_animate

## 📦 Dipendenze Principali

- `supabase_flutter`: Backend e autenticazione
- `provider`: State management
- `go_router`: Navigazione
- `google_fonts`: Tipografia
- `flutter_animate`: Animazioni
- `cached_network_image`: Cache immagini

## 🏗️ Build

### iOS

```bash
flutter build ios --release
```

### Android

```bash
flutter build apk --release
# oppure
flutter build appbundle --release
```

## 📄 Licenza

Proprietario - Tutti i diritti riservati.
