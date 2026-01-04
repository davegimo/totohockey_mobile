import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';

class CreaLegaScreen extends StatefulWidget {
  const CreaLegaScreen({super.key});

  @override
  State<CreaLegaScreen> createState() => _CreaLegaScreenState();
}

class _CreaLegaScreenState extends State<CreaLegaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _descrizioneController = TextEditingController();
  bool _isPubblica = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _nomeController.dispose();
    _descrizioneController.dispose();
    super.dispose();
  }

  Future<void> _handleCreate() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    final legheProvider = context.read<LegheProvider>();
    final lega = await legheProvider.creaLega(
      nome: _nomeController.text.trim(),
      descrizione: _descrizioneController.text.trim().isEmpty 
          ? null 
          : _descrizioneController.text.trim(),
      isPubblica: _isPubblica,
    );

    setState(() {
      _isLoading = false;
    });

    if (lega != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lega "${lega.nome}" creata con successo!'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      Navigator.pop(context);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Errore nella creazione della lega'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Crea Lega'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Nome
                TextFormField(
                  controller: _nomeController,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Nome Lega',
                    hintText: 'Es. Campioni del Hockey',
                    prefixIcon: Icon(Icons.group),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Inserisci il nome della lega';
                    }
                    if (value.length < 3) {
                      return 'Il nome deve avere almeno 3 caratteri';
                    }
                    return null;
                  },
                ),
                
                const SizedBox(height: 16),
                
                // Descrizione
                TextFormField(
                  controller: _descrizioneController,
                  maxLines: 3,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: const InputDecoration(
                    labelText: 'Descrizione (opzionale)',
                    hintText: 'Descrivi la tua lega...',
                    prefixIcon: Icon(Icons.description_outlined),
                    alignLabelWithHint: true,
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Tipo lega
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.cardColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Lega Pubblica',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Tutti possono vedere e unirsi alla lega',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: _isPubblica,
                        onChanged: (value) {
                          setState(() {
                            _isPubblica = value;
                          });
                        },
                        activeColor: AppTheme.successColor,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Info
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.infoColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.infoColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.info_outline,
                        color: AppTheme.infoColor,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Dopo la creazione potrai invitare altri giocatori condividendo un link di invito.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.infoColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Pulsante crea
                SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleCreate,
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Crea Lega'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}



