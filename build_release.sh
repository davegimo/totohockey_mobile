#!/bin/bash

# Script per creare una build release dell'app TotoHockey
# Questa build funzionerà standalone senza bisogno del PC

echo "🚀 Creazione build release di TotoHockey..."
echo ""

# Pulisci il progetto
echo "📦 Pulizia progetto..."
flutter clean

# Ottieni le dipendenze
echo "📥 Installazione dipendenze..."
flutter pub get

# Installa i Pods iOS
echo "🍎 Installazione Pods iOS..."
cd ios
pod install
cd ..

# Crea la build release per iOS
echo "🔨 Creazione build release iOS..."
flutter build ios --release

echo ""
echo "✅ Build completata!"
echo ""
echo "Per installare l'app sul tuo iPhone:"
echo "1. Apri Xcode"
echo "2. Apri ios/Runner.xcworkspace"
echo "3. Seleziona il tuo dispositivo iPhone nella barra degli strumenti"
echo "4. Vai su Product > Scheme > Runner"
echo "5. Vai su Product > Destination > [Il tuo iPhone]"
echo "6. Premi Cmd+R per buildare e installare"
echo ""
echo "Oppure usa: flutter install --release"
echo ""

