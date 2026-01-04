import 'package:flutter/material.dart';

class AppConfig {
  static const String appName = 'TotoHockey';
  static const String appVersion = '1.0.0';
  
  // Durata link di invito in ore
  static const int linkInvitoDurataOre = 12;
  
  // Punteggi
  static const int puntiRisultatoEsatto = 3;
  static const int puntiEsitoCorretto = 1;
  
  // Campionati
  static const List<String> campionati = [
    'Elite Maschile',
    'Elite Femminile',
  ];
  
  // Colori campionati
  static Color getCampionatoColor(String? campionato) {
    switch (campionato) {
      case 'Elite Femminile':
        return const Color(0xFFE91E63);
      case 'Elite Maschile':
      default:
        return const Color(0xFF1976D2);
    }
  }
}



