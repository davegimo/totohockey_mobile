import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:share_plus/share_plus.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';

class LegaDetailScreen extends StatefulWidget {
  final String legaId;

  const LegaDetailScreen({
    super.key,
    required this.legaId,
  });

  @override
  State<LegaDetailScreen> createState() => _LegaDetailScreenState();
}

class _LegaDetailScreenState extends State<LegaDetailScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    context.read<LegheProvider>().loadLega(widget.legaId);
  }

  void _shareLink(String link) {
    Share.share(
      'Unisciti alla mia lega su TotoHockey!\n\n$link',
    );
  }

  void _copyLink(String link) {
    Clipboard.setData(ClipboardData(text: link));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Link copiato!'),
        backgroundColor: AppTheme.successColor,
      ),
    );
  }

  Future<void> _rigeneraLink() async {
    final result = await context.read<LegheProvider>().rigeneraLink();
    if (mounted) {
      if (result != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Link rigenerato!'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Errore nella rigenerazione'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<LegheProvider, AuthProvider>(
      builder: (context, leghe, auth, _) {
        final lega = leghe.legaSelezionata;
        
        return Scaffold(
          appBar: AppBar(
            title: Text(lega?.nome ?? 'Lega'),
          ),
          body: leghe.isLoading
              ? const Center(child: CircularProgressIndicator())
              : lega == null
                  ? Center(
                      child: Text(
                        'Lega non trovata',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async {
                        _loadData();
                      },
                      child: CustomScrollView(
                        slivers: [
                          // Header lega
                          SliverToBoxAdapter(
                            child: _buildHeader(lega, leghe.isAdmin)
                                .animate()
                                .fadeIn(duration: 600.ms),
                          ),

                          // Invito (solo admin)
                          if (leghe.isAdmin && !lega.isPubblica)
                            SliverToBoxAdapter(
                              child: _buildInviteSection(lega)
                                  .animate()
                                  .fadeIn(delay: 200.ms, duration: 600.ms),
                            ),

                          // Header classifica
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Text(
                                'Classifica',
                                style: Theme.of(context).textTheme.headlineSmall,
                              ),
                            )
                                .animate()
                                .fadeIn(delay: 300.ms, duration: 600.ms),
                          ),

                          // Lista classifica
                          if (leghe.classificaLega.isEmpty)
                            SliverFillRemaining(
                              child: Center(
                                child: Text(
                                  'Nessun partecipante',
                                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    color: AppTheme.textMuted,
                                  ),
                                ),
                              ),
                            )
                          else
                            SliverPadding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              sliver: SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) {
                                    final giocatore = leghe.classificaLega[index];
                                    final isCurrentUser = auth.user?.id == giocatore.giocatoreId;
                                    
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: _buildClassificaItem(
                                        giocatore,
                                        isCurrentUser,
                                      ),
                                    )
                                        .animate()
                                        .fadeIn(delay: (50 * index).ms, duration: 400.ms)
                                        .slideX(begin: 0.1, end: 0);
                                  },
                                  childCount: leghe.classificaLega.length,
                                ),
                              ),
                            ),

                          // Spazio in fondo
                          const SliverToBoxAdapter(
                            child: SizedBox(height: 24),
                          ),
                        ],
                      ),
                    ),
        );
      },
    );
  }

  Widget _buildHeader(dynamic lega, bool isAdmin) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: lega.isPubblica 
              ? AppTheme.successColor.withValues(alpha: 0.3)
              : AppTheme.secondaryColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        children: [
          // Logo
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: lega.isPubblica 
                  ? AppTheme.successColor.withValues(alpha: 0.2)
                  : AppTheme.secondaryColor.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                lega.nome.isNotEmpty ? lega.nome[0].toUpperCase() : 'L',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: lega.isPubblica ? AppTheme.successColor : AppTheme.secondaryColor,
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Nome
          Text(
            lega.nome,
            style: Theme.of(context).textTheme.headlineMedium,
            textAlign: TextAlign.center,
          ),
          
          if (lega.descrizione != null && lega.descrizione!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              lega.descrizione!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textMuted,
              ),
              textAlign: TextAlign.center,
            ),
          ],
          
          const SizedBox(height: 12),
          
          // Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: lega.isPubblica 
                      ? AppTheme.successColor.withValues(alpha: 0.2)
                      : AppTheme.secondaryColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  lega.isPubblica ? 'Pubblica' : 'Privata',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: lega.isPubblica ? AppTheme.successColor : AppTheme.secondaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (isAdmin) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.warningColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.shield, size: 14, color: AppTheme.warningColor),
                      const SizedBox(width: 4),
                      Text(
                        'Admin',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.warningColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInviteSection(dynamic lega) {
    final isScaduto = lega.isLinkScaduto;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isScaduto 
              ? AppTheme.errorColor.withValues(alpha: 0.3)
              : AppTheme.infoColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isScaduto ? Icons.link_off : Icons.link,
                color: isScaduto ? AppTheme.errorColor : AppTheme.infoColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Link di Invito',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const Spacer(),
              if (isScaduto)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.errorColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Scaduto',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.errorColor,
                    ),
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          if (isScaduto) ...[
            Text(
              'Il link di invito è scaduto. Rigeneralo per invitare nuovi giocatori.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _rigeneraLink,
                icon: const Icon(Icons.refresh),
                label: const Text('Rigenera Link'),
              ),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      lega.codiceInvito ?? '',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        letterSpacing: 2,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => _copyLink(lega.linkInvito),
                    icon: const Icon(Icons.copy, size: 20),
                    tooltip: 'Copia',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _rigeneraLink,
                    icon: const Icon(Icons.refresh, size: 18),
                    label: const Text('Rigenera'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _shareLink(lega.linkInvito),
                    icon: const Icon(Icons.share, size: 18),
                    label: const Text('Condividi'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildClassificaItem(dynamic giocatore, bool isCurrentUser) {
    Color? posizioneColor;
    IconData? posizioneIcon;
    
    switch (giocatore.posizione) {
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
                    '${giocatore.posizione}',
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
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        giocatore.nomeCompleto,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.w500,
                        ),
                      ),
                    ),
                    if (giocatore.isAdmin)
                      const Icon(Icons.shield, size: 16, color: AppTheme.warningColor),
                  ],
                ),
                Row(
                  children: [
                    _buildStatBadge('✓✓✓', giocatore.risultatiEsatti, AppTheme.pronosticoEsatto),
                    const SizedBox(width: 8),
                    _buildStatBadge('✓', giocatore.esitiPresi, AppTheme.pronosticoCorretto),
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
              '${giocatore.puntiTotali} pt',
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



