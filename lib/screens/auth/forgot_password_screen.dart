import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  final VoidCallback onBackTap;

  const ForgotPasswordScreen({
    super.key,
    required this.onBackTap,
  });

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.resetPassword(_emailController.text.trim());

    setState(() {
      _isLoading = false;
      if (success) {
        _emailSent = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: widget.onBackTap,
        ),
        title: const Text('Recupera Password'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _emailSent ? _buildSuccessContent() : _buildFormContent(),
        ),
      ),
    );
  }

  Widget _buildFormContent() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 24),
          
          // Icona
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppTheme.secondaryColor.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.lock_reset,
              size: 40,
              color: AppTheme.secondaryColor,
            ),
          )
              .animate()
              .fadeIn(duration: 600.ms)
              .scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1)),
          
          const SizedBox(height: 24),
          
          // Titolo
          Text(
            'Password dimenticata?',
            style: Theme.of(context).textTheme.headlineMedium,
            textAlign: TextAlign.center,
          )
              .animate()
              .fadeIn(delay: 200.ms, duration: 600.ms),
          
          const SizedBox(height: 12),
          
          // Descrizione
          Text(
            'Inserisci la tua email e ti invieremo un link per reimpostare la password.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          )
              .animate()
              .fadeIn(delay: 300.ms, duration: 600.ms),
          
          const SizedBox(height: 32),
          
          // Email field
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _handleResetPassword(),
            decoration: const InputDecoration(
              labelText: 'Email',
              hintText: 'La tua email',
              prefixIcon: Icon(Icons.email_outlined),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Inserisci la tua email';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                return 'Inserisci una email valida';
              }
              return null;
            },
          )
              .animate()
              .fadeIn(delay: 400.ms, duration: 600.ms)
              .slideY(begin: 0.2, end: 0),
          
          const SizedBox(height: 24),
          
          // Submit button
          SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleResetPassword,
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Invia Link'),
            ),
          )
              .animate()
              .fadeIn(delay: 500.ms, duration: 600.ms)
              .slideY(begin: 0.2, end: 0),
          
          const SizedBox(height: 16),
          
          // Back to login
          TextButton(
            onPressed: widget.onBackTap,
            child: const Text('Torna al login'),
          )
              .animate()
              .fadeIn(delay: 600.ms, duration: 600.ms),
        ],
      ),
    );
  }

  Widget _buildSuccessContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 48),
        
        // Icona successo
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: AppTheme.successColor.withValues(alpha: 0.2),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.mark_email_read,
            size: 50,
            color: AppTheme.successColor,
          ),
        )
            .animate()
            .fadeIn(duration: 600.ms)
            .scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1)),
        
        const SizedBox(height: 32),
        
        // Titolo
        Text(
          'Email inviata!',
          style: Theme.of(context).textTheme.headlineMedium,
          textAlign: TextAlign.center,
        )
            .animate()
            .fadeIn(delay: 200.ms, duration: 600.ms),
        
        const SizedBox(height: 16),
        
        // Descrizione
        Text(
          'Abbiamo inviato un link per reimpostare la password all\'indirizzo:\n\n${_emailController.text}',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: AppTheme.textSecondary,
          ),
          textAlign: TextAlign.center,
        )
            .animate()
            .fadeIn(delay: 300.ms, duration: 600.ms),
        
        const SizedBox(height: 8),
        
        Text(
          'Controlla anche la cartella spam.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppTheme.textMuted,
          ),
          textAlign: TextAlign.center,
        )
            .animate()
            .fadeIn(delay: 400.ms, duration: 600.ms),
        
        const SizedBox(height: 48),
        
        // Torna al login
        SizedBox(
          height: 56,
          child: ElevatedButton(
            onPressed: widget.onBackTap,
            child: const Text('Torna al Login'),
          ),
        )
            .animate()
            .fadeIn(delay: 500.ms, duration: 600.ms)
            .slideY(begin: 0.2, end: 0),
      ],
    );
  }
}



