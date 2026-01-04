import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';

class ClassificaScreen extends StatefulWidget {
  const ClassificaScreen({super.key});

  @override
  State<ClassificaScreen> createState() => _ClassificaScreenState();
}

class _ClassificaScreenState extends State<ClassificaScreen> {
  @override
  void initState() {
    super.initState();
    // Carica i dati solo se non sono già stati precaricati
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ClassificaProvider>();
      if (!provider.hasLoaded) {
        _loadData();
      }
    });
  }

  void _loadData() {
    context.read<ClassificaProvider>().loadClassifica();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ClassificaProvider, AuthProvider>(
      builder: (context, classifica, auth, _) {
        return RefreshIndicator(
          onRefresh: () async {
            _loadData();
          },
          child: CustomScrollView(
            slivers: [
              // Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Classifica Generale',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                ),
              ),

              // Loading
              if (classifica.isLoading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),

              // Errore
              if (classifica.errorMessage != null)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: AppTheme.errorColor.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          classifica.errorMessage!,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadData,
                          child: const Text('Riprova'),
                        ),
                      ],
                    ),
                  ),
                ),

              // Classifica - Mostra solo quando i dati sono completamente caricati
              if (!classifica.isLoading && classifica.classifica.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final giocatore = classifica.classifica[index];
                        final isCurrentUser = auth.user?.id == giocatore['id_giocatore'];
                        final posizione = index + 1;
                        
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: _buildClassificaItem(
                            context,
                            posizione: posizione,
                            nome: giocatore['nome'] ?? '',
                            cognome: giocatore['cognome'] ?? '',
                            punti: giocatore['punti_totali'] ?? 0,
                            risultatiEsatti: giocatore['risultati_esatti'] ?? 0,
                            esitiPresi: giocatore['esiti_presi'] ?? 0,
                            isCurrentUser: isCurrentUser,
                          ),
                        );
                      },
                      childCount: classifica.classifica.length,
                    ),
                  ),
                ),

              // Spazio in fondo per la navbar
              const SliverToBoxAdapter(
                child: SizedBox(height: 80),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildClassificaItem(
    BuildContext context, {
    required int posizione,
    required String nome,
    required String cognome,
    required int punti,
    required int risultatiEsatti,
    required int esitiPresi,
    required bool isCurrentUser,
  }) {
    Color? posizioneColor;
    IconData? posizioneIcon;
    
    switch (posizione) {
      case 1:
        posizioneColor = const Color(0xFFFFD700);
        posizioneIcon = Icons.emoji_events;
        break;
      case 2:
        posizioneColor = const Color(0xFFC0C0C0);
        posizioneIcon = Icons.emoji_events;
        break;
      case 3:
        posizioneColor = const Color(0xFFCD7F32);
        posizioneIcon = Icons.emoji_events;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCurrentUser 
            ? AppTheme.secondaryColor.withValues(alpha: 0.1) 
            : AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: isCurrentUser
            ? Border.all(color: AppTheme.secondaryColor, width: 2)
            : null,
      ),
      child: Row(
        children: [
          // Posizione
          SizedBox(
            width: 40,
            child: posizioneIcon != null
                ? Icon(posizioneIcon, color: posizioneColor, size: 28)
                : Text(
                    '$posizione',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppTheme.textMuted,
                    ),
                    textAlign: TextAlign.center,
                  ),
          ),
          const SizedBox(width: 12),
          
          // Nome
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$nome $cognome',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
                Row(
                  children: [
                    _buildStatBadge('✓✓✓', risultatiEsatti, AppTheme.pronosticoEsatto),
                    const SizedBox(width: 8),
                    _buildStatBadge('✓', esitiPresi, AppTheme.pronosticoCorretto),
                  ],
                ),
              ],
            ),
          ),
          
          // Punti
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.secondaryColor.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '$punti pt',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppTheme.secondaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatBadge(String icon, int value, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          icon,
          style: TextStyle(color: color, fontSize: 10),
        ),
        const SizedBox(width: 2),
        Text(
          '$value',
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}



