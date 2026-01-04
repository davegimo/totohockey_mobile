import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../../theme/app_theme.dart';
import 'crea_lega_screen.dart';
import 'lega_detail_screen.dart';
import 'partecipa_lega_screen.dart';

class LegheScreen extends StatefulWidget {
  const LegheScreen({super.key});

  @override
  State<LegheScreen> createState() => _LegheScreenState();
}

class _LegheScreenState extends State<LegheScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    context.read<LegheProvider>().loadLegheUtente();
  }

  void _navigateToCreateLega() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CreaLegaScreen()),
    ).then((_) => _loadData());
  }

  void _navigateToPartecipa() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PartecipaLegaScreen()),
    ).then((_) => _loadData());
  }

  void _navigateToLegaDetail(LegaModel lega) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => LegaDetailScreen(legaId: lega.id)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LegheProvider>(
      builder: (context, leghe, _) {
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
                        'Le tue Leghe',
                        style: Theme.of(context).textTheme.headlineMedium,
                      )
                          .animate()
                          .fadeIn(duration: 600.ms)
                          .slideX(begin: -0.2, end: 0),
                      
                      const SizedBox(height: 16),
                      
                      // Azioni
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _navigateToCreateLega,
                              icon: const Icon(Icons.add),
                              label: const Text('Crea Lega'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _navigateToPartecipa,
                              icon: const Icon(Icons.link),
                              label: const Text('Partecipa'),
                            ),
                          ),
                        ],
                      )
                          .animate()
                          .fadeIn(delay: 200.ms, duration: 600.ms),
                    ],
                  ),
                ),
              ),

              // Loading
              if (leghe.isLoading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),

              // Nessuna lega
              if (!leghe.isLoading && leghe.leghe.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.group_outlined,
                          size: 64,
                          color: AppTheme.textMuted.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Non fai parte di nessuna lega',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Crea una nuova lega o partecipa con un codice invito!',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textMuted,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),

              // Lista leghe
              if (!leghe.isLoading && leghe.leghe.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final lega = leghe.leghe[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _buildLegaCard(lega),
                        )
                            .animate()
                            .fadeIn(delay: (100 * index).ms, duration: 400.ms)
                            .slideY(begin: 0.1, end: 0);
                      },
                      childCount: leghe.leghe.length,
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

  Widget _buildLegaCard(LegaModel lega) {
    return GestureDetector(
      onTap: () => _navigateToLegaDetail(lega),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: lega.isPubblica 
                ? AppTheme.successColor.withValues(alpha: 0.3)
                : AppTheme.secondaryColor.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          children: [
            // Logo placeholder
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: lega.isPubblica 
                    ? AppTheme.successColor.withValues(alpha: 0.2)
                    : AppTheme.secondaryColor.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: lega.logoUrl != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        lega.logoUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _buildLogoPlaceholder(lega),
                      ),
                    )
                  : _buildLogoPlaceholder(lega),
            ),
            
            const SizedBox(width: 16),
            
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          lega.nome,
                          style: Theme.of(context).textTheme.titleLarge,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (lega.isPubblica)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.successColor.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Pubblica',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.successColor,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (lega.descrizione != null && lega.descrizione!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      lega.descrizione!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textMuted,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.people_outline,
                        size: 16,
                        color: AppTheme.textMuted,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${lega.numeroPartecipanti ?? 0} partecipanti',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const Icon(
              Icons.chevron_right,
              color: AppTheme.textMuted,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoPlaceholder(LegaModel lega) {
    return Center(
      child: Text(
        lega.nome.isNotEmpty ? lega.nome[0].toUpperCase() : 'L',
        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
          color: lega.isPubblica ? AppTheme.successColor : AppTheme.secondaryColor,
        ),
      ),
    );
  }
}



