import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../config/app_config.dart';

class MatchCard extends StatelessWidget {
  final PartitaModel partita;
  final bool isScaduto;
  final VoidCallback? onTap;

  const MatchCard({
    super.key,
    required this.partita,
    this.isScaduto = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final campionatoColor = AppConfig.getCampionatoColor(partita.campionato);
    
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: campionatoColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        children: [
          // Header con campionato
          _buildHeader(context, campionatoColor),
          
          // Contenuto partita
          _buildContent(context),
          
          // Footer con azione
          if (onTap != null && !partita.hasRisultato && !isScaduto)
            _buildFooter(context),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            partita.campionato ?? 'Elite Maschile',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
          
          // Indicatore risultato
          if (partita.hasRisultato && partita.pronostico != null)
            _buildResultIndicator(context),
        ],
      ),
    );
  }

  Widget _buildResultIndicator(BuildContext context) {
    final result = partita.pronosticoResult;
    
    if (result == null) return const SizedBox.shrink();
    
    Color color;
    String text;
    String points;
    
    switch (result) {
      case PronosticoResult.esatto:
        color = AppTheme.pronosticoEsatto;
        text = '✓✓✓';
        points = '+3';
        break;
      case PronosticoResult.corretto:
        color = AppTheme.pronosticoCorretto;
        text = '✓';
        points = '+1';
        break;
      case PronosticoResult.sbagliato:
        color = AppTheme.pronosticoSbagliato;
        text = '✗';
        points = '0';
        break;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            text,
            style: TextStyle(color: color, fontSize: 12),
          ),
          const SizedBox(width: 4),
          Text(
            points,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // Squadra Casa
          Expanded(
            child: _buildTeam(
              context,
              partita.squadraCasa?.nome ?? 'Casa',
              partita.squadraCasa?.logoUrl,
            ),
          ),
          
          // Centro (risultato o pronostico)
          _buildCenter(context),
          
          // Squadra Ospite
          Expanded(
            child: _buildTeam(
              context,
              partita.squadraOspite?.nome ?? 'Ospite',
              partita.squadraOspite?.logoUrl,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeam(BuildContext context, String nome, String? logoUrl) {
    return Column(
      children: [
        // Logo
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            shape: BoxShape.circle,
          ),
          child: logoUrl != null
              ? ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: logoUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => _buildLogoPlaceholder(nome),
                    errorWidget: (_, __, ___) => _buildLogoPlaceholder(nome),
                  ),
                )
              : _buildLogoPlaceholder(nome),
        ),
        const SizedBox(height: 8),
        Text(
          nome,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildLogoPlaceholder(String nome) {
    return Center(
      child: Text(
        nome.isNotEmpty ? nome[0].toUpperCase() : '?',
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }

  Widget _buildCenter(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Data
          Text(
            _formatData(partita.data),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.textMuted,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          
          // Risultato o Pronostico
          if (partita.hasRisultato)
            _buildScore(
              context,
              partita.risultatoCasa!,
              partita.risultatoOspite!,
              isResult: true,
            )
          else if (partita.pronostico != null)
            _buildScore(
              context,
              partita.pronostico!.pronosticoCasa,
              partita.pronostico!.pronosticoOspite,
              isResult: false,
            )
          else if (isScaduto)
            Text(
              'In attesa',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textMuted,
              ),
            )
          else
            Text(
              'Nessun\npronostico',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.warningColor,
              ),
              textAlign: TextAlign.center,
            ),
        ],
      ),
    );
  }

  Widget _buildScore(
    BuildContext context,
    int casa,
    int ospite, {
    required bool isResult,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isResult 
            ? AppTheme.surfaceColor 
            : AppTheme.secondaryColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: isResult
            ? null
            : Border.all(
                color: AppTheme.secondaryColor.withValues(alpha: 0.3),
              ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$casa',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: isResult ? AppTheme.textPrimary : AppTheme.secondaryColor,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              ':',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppTheme.textMuted,
              ),
            ),
          ),
          Text(
            '$ospite',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: isResult ? AppTheme.textPrimary : AppTheme.secondaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 12),
          ),
          child: Text(
            partita.pronostico != null 
                ? 'Modifica pronostico' 
                : 'Inserisci pronostico',
          ),
        ),
      ),
    );
  }

  String _formatData(DateTime data) {
    const giorni = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
    const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 
                  'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
    
    final giorno = giorni[data.weekday - 1];
    final mese = mesi[data.month - 1];
    
    return '$giorno ${data.day} $mese';
  }
}



