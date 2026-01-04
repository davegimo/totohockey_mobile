import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class PronosticoModal extends StatefulWidget {
  final PartitaModel partita;
  final Function(int casa, int ospite) onSave;

  const PronosticoModal({
    super.key,
    required this.partita,
    required this.onSave,
  });

  @override
  State<PronosticoModal> createState() => _PronosticoModalState();
}

class _PronosticoModalState extends State<PronosticoModal> {
  late TextEditingController _casaController;
  late TextEditingController _ospiteController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _casaController = TextEditingController(
      text: widget.partita.pronostico?.pronosticoCasa.toString() ?? '',
    );
    _ospiteController = TextEditingController(
      text: widget.partita.pronostico?.pronosticoOspite.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _casaController.dispose();
    _ospiteController.dispose();
    super.dispose();
  }

  void _handleSave() {
    final casa = int.tryParse(_casaController.text);
    final ospite = int.tryParse(_ospiteController.text);
    
    if (casa == null || ospite == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Inserisci valori validi'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    widget.onSave(casa, ospite);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.textMuted.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Titolo
              Text(
                widget.partita.pronostico != null 
                    ? 'Modifica Pronostico' 
                    : 'Inserisci Pronostico',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              
              const SizedBox(height: 24),
              
              // Squadre e input
              Row(
                children: [
                  // Squadra Casa
                  Expanded(
                    child: _buildTeamColumn(
                      widget.partita.squadraCasa?.nome ?? 'Casa',
                      widget.partita.squadraCasa?.logoUrl,
                      _casaController,
                    ),
                  ),
                  
                  // Separatore
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      ':',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ),
                  
                  // Squadra Ospite
                  Expanded(
                    child: _buildTeamColumn(
                      widget.partita.squadraOspite?.nome ?? 'Ospite',
                      widget.partita.squadraOspite?.logoUrl,
                      _ospiteController,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),
              
              // Pulsante salva
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSave,
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Salva Pronostico'),
                ),
              ),
              
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTeamColumn(
    String nome,
    String? logoUrl,
    TextEditingController controller,
  ) {
    return Column(
      children: [
        // Logo
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            shape: BoxShape.circle,
          ),
          child: logoUrl != null
              ? ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: logoUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => _buildPlaceholder(nome),
                    errorWidget: (_, __, ___) => _buildPlaceholder(nome),
                  ),
                )
              : _buildPlaceholder(nome),
        ),
        
        const SizedBox(height: 8),
        
        // Nome squadra
        Text(
          nome,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        
        const SizedBox(height: 12),
        
        // Input gol
        SizedBox(
          width: 80,
          child: TextField(
            controller: controller,
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(2),
            ],
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
              filled: true,
              fillColor: AppTheme.surfaceColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                  color: AppTheme.secondaryColor,
                  width: 2,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholder(String nome) {
    return Center(
      child: Text(
        nome.isNotEmpty ? nome[0].toUpperCase() : '?',
        style: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }
}



