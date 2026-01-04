import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';

class PartecipaLegaScreen extends StatefulWidget {
  final String? codiceInvito;

  const PartecipaLegaScreen({
    super.key,
    this.codiceInvito,
  });

  @override
  State<PartecipaLegaScreen> createState() => _PartecipaLegaScreenState();
}

class _PartecipaLegaScreenState extends State<PartecipaLegaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codiceController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.codiceInvito != null) {
      _codiceController.text = widget.codiceInvito!;
    }
  }

  @override
  void dispose() {
    _codiceController.dispose();
    super.dispose();
  }

  Future<void> _handlePartecipa() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    final legheProvider = context.read<LegheProvider>();
    final result = await legheProvider.partecipaConCodice(
      _codiceController.text.trim().toUpperCase(),
    );

    setState(() {
      _isLoading = false;
    });

    if (result != null && result['success'] == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Hai partecipato alla lega!'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      Navigator.pop(context);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result?['message'] ?? 'Errore nella partecipazione'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Partecipa a una Lega'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Icona
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.secondaryColor.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.link,
                      size: 40,
                      color: AppTheme.secondaryColor,
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Titolo
                Text(
                  'Inserisci il codice invito',
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 8),
                
                Text(
                  'Il codice ti è stato condiviso dall\'amministratore della lega',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textMuted,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                const SizedBox(height: 32),
                
                // Campo codice
                TextFormField(
                  controller: _codiceController,
                  textCapitalization: TextCapitalization.characters,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    letterSpacing: 4,
                  ),
                  decoration: const InputDecoration(
                    hintText: 'ABCD1234',
                    prefixIcon: Icon(Icons.vpn_key_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Inserisci il codice invito';
                    }
                    if (value.length < 6) {
                      return 'Il codice deve avere almeno 6 caratteri';
                    }
                    return null;
                  },
                ),
                
                const SizedBox(height: 24),
                
                // Info
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.warningColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.warningColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.timer_outlined,
                        color: AppTheme.warningColor,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'I link di invito scadono dopo 12 ore dalla generazione.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.warningColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const Spacer(),
                
                // Pulsante partecipa
                SizedBox(
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handlePartecipa,
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Partecipa'),
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



