import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:share_plus/share_plus.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import '../../widgets/match_card.dart';
import '../../widgets/pronostico_modal.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Timer? _countdownTimer;
  String _countdown = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _loadData() {
    final auth = context.read<AuthProvider>();
    if (auth.user != null) {
      context.read<DashboardProvider>().loadDashboard(auth.user!.id);
    }
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      final dashboard = context.read<DashboardProvider>();
      final remaining = dashboard.tempoRimanente;
      
      if (remaining == Duration.zero) {
        timer.cancel();
        setState(() {
          _countdown = 'Tempo scaduto!';
        });
      } else {
        final days = remaining.inDays;
        final hours = remaining.inHours % 24;
        final minutes = remaining.inMinutes % 60;
        final seconds = remaining.inSeconds % 60;
        
        setState(() {
          _countdown = '${days}g ${hours}h ${minutes}m ${seconds}s';
        });
      }
    });
  }

  void _shareOnWhatsApp(RecapPunti recap, String turnoDescrizione) {
    final message = '''
Ecco il mio score per il *$turnoDescrizione*:

Punteggio: ${recap.puntiTotali}
Risultati esatti: ${recap.risultatiEsatti}
Esiti Presi: ${recap.esitiPresi}

Gioca anche tu su totohockey.it!
''';
    Share.share(message);
  }

  void _showPronosticoModal(PartitaModel partita) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PronosticoModal(
        partita: partita,
        onSave: (casa, ospite) async {
          final auth = context.read<AuthProvider>();
          final dashboard = context.read<DashboardProvider>();
          
          final success = await dashboard.salvaPronostico(
            userId: auth.user!.id,
            partitaId: partita.id,
            pronosticoCasa: casa,
            pronosticoOspite: ospite,
          );
          
          if (mounted) {
            Navigator.pop(context);
            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Pronostico salvato!'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Errore nel salvataggio'),
                  backgroundColor: AppTheme.errorColor,
                ),
              );
            }
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<DashboardProvider>(
      builder: (context, dashboard, _) {
        if (dashboard.turnoAttuale != null && _countdown.isEmpty) {
          _startCountdown();
        }

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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Prossime Partite',
                        style: Theme.of(context).textTheme.headlineMedium,
                      )
                          .animate()
                          .fadeIn(duration: 600.ms)
                          .slideX(begin: -0.2, end: 0),
                      
                      const SizedBox(height: 8),
                      
                      // News banner
                      _buildNewsBanner()
                          .animate()
                          .fadeIn(delay: 200.ms, duration: 600.ms),
                    ],
                  ),
                ),
              ),

              // Countdown o Recap
              if (dashboard.turnoAttuale != null)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: dashboard.isPronosticoScaduto
                        ? _buildRecap(dashboard)
                        : _buildCountdown(dashboard),
                  )
                      .animate()
                      .fadeIn(delay: 300.ms, duration: 600.ms),
                ),

              // Loading
              if (dashboard.isLoading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),

              // Nessuna partita
              if (!dashboard.isLoading && dashboard.partite.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.sports_hockey,
                          size: 64,
                          color: AppTheme.textMuted.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Nessuna partita in programma',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Lista partite
              if (!dashboard.isLoading && dashboard.partite.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final partita = dashboard.partite[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: MatchCard(
                            partita: partita,
                            isScaduto: dashboard.isPronosticoScaduto,
                            onTap: dashboard.isPronosticoScaduto || partita.hasRisultato
                                ? null
                                : () => _showPronosticoModal(partita),
                          ),
                        )
                            .animate()
                            .fadeIn(delay: (100 * index).ms, duration: 400.ms)
                            .slideY(begin: 0.1, end: 0);
                      },
                      childCount: dashboard.partite.length,
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

  Widget _buildNewsBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.secondaryColor.withValues(alpha: 0.2),
            AppTheme.primaryColor.withValues(alpha: 0.2),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.secondaryColor.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.campaign, color: AppTheme.secondaryColor, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: Theme.of(context).textTheme.bodyMedium,
                children: const [
                  TextSpan(
                    text: 'Novità! ',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  TextSpan(text: 'Abbiamo introdotto le '),
                  TextSpan(
                    text: 'Leghe Private',
                    style: TextStyle(
                      color: AppTheme.secondaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  TextSpan(text: '! Creane una per sfidare i tuoi amici!'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCountdown(DashboardProvider dashboard) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.secondaryColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        children: [
          Text(
            'Hai tempo fino a ${_formatDataLimite(dashboard.turnoAttuale!.dataLimite)} per inserire i tuoi pronostici!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            _countdown.isEmpty ? '...' : _countdown,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: AppTheme.secondaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecap(DashboardProvider dashboard) {
    final recap = dashboard.recapPunti;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.successColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        children: [
          Text(
            'Riepilogo Punti',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildRecapItem('Punti', recap.puntiTotali.toString(), AppTheme.secondaryColor),
              _buildRecapItem('Risultati', recap.risultatiEsatti.toString(), AppTheme.pronosticoEsatto),
              _buildRecapItem('Esiti', recap.esitiPresi.toString(), AppTheme.pronosticoCorretto),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _shareOnWhatsApp(recap, dashboard.turnoAttuale?.descrizione ?? 'turno'),
              icon: const Icon(Icons.share),
              label: const Text('Condividi'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecapItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppTheme.textMuted,
          ),
        ),
      ],
    );
  }

  String _formatDataLimite(DateTime data) {
    const giorni = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
    const mesi = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 
                  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    
    final giorno = giorni[data.weekday - 1];
    final mese = mesi[data.month - 1];
    final ora = '${data.hour.toString().padLeft(2, '0')}:${data.minute.toString().padLeft(2, '0')}';
    
    return '$giorno ${data.day} $mese alle $ora';
  }
}



