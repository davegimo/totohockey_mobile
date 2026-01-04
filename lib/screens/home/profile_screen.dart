import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        final user = auth.user;
        
        return CustomScrollView(
          slivers: [
            // Header profilo
            SliverToBoxAdapter(
              child: _buildProfileHeader(context, user)
                  .animate()
                  .fadeIn(duration: 600.ms),
            ),

            // Statistiche
            SliverToBoxAdapter(
              child: _buildStats(context, user)
                  .animate()
                  .fadeIn(delay: 200.ms, duration: 600.ms),
            ),

            // Menu opzioni
            SliverToBoxAdapter(
              child: _buildMenuSection(context, auth)
                  .animate()
                  .fadeIn(delay: 300.ms, duration: 600.ms),
            ),

            // Spazio in fondo
            const SliverToBoxAdapter(
              child: SizedBox(height: 100),
            ),
          ],
        );
      },
    );
  }

  Widget _buildProfileHeader(BuildContext context, dynamic user) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.secondaryColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        children: [
          // Avatar
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.secondaryColor,
                  AppTheme.primaryColor,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                user != null 
                    ? '${user.nome.isNotEmpty ? user.nome[0] : ''}${user.cognome.isNotEmpty ? user.cognome[0] : ''}'
                    : '??',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Nome
          Text(
            user?.nomeCompleto ?? 'Utente',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          
          const SizedBox(height: 4),
          
          // Email
          Text(
            user?.email ?? '',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textMuted,
            ),
          ),
          
          // Badge admin
          if (user?.isAdmin == true) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.warningColor.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.shield, size: 16, color: AppTheme.warningColor),
                  const SizedBox(width: 4),
                  Text(
                    'Amministratore',
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
    );
  }

  Widget _buildStats(BuildContext context, dynamic user) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              context,
              icon: Icons.star,
              label: 'Punti',
              value: '${user?.punteggio ?? 0}',
              color: AppTheme.secondaryColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              context,
              icon: Icons.check_circle,
              label: 'Esatti',
              value: '${user?.risultatiEsatti ?? 0}',
              color: AppTheme.pronosticoEsatto,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              context,
              icon: Icons.trending_up,
              label: 'Esiti',
              value: '${user?.esitiPresi ?? 0}',
              color: AppTheme.pronosticoCorretto,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuSection(BuildContext context, AuthProvider auth) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Impostazioni',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          
          Container(
            decoration: BoxDecoration(
              color: AppTheme.cardColor,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                _buildMenuItem(
                  context,
                  icon: Icons.sports_hockey,
                  title: 'Regole',
                  subtitle: 'Come funziona TotoHockey',
                  onTap: () {
                    // Naviga alle regole
                  },
                ),
                const Divider(height: 1, indent: 56),
                _buildMenuItem(
                  context,
                  icon: Icons.info_outline,
                  title: 'Informazioni',
                  subtitle: 'Versione 1.0.0',
                  onTap: () {
                    _showAboutDialog(context);
                  },
                ),
                const Divider(height: 1, indent: 56),
                _buildMenuItem(
                  context,
                  icon: Icons.logout,
                  title: 'Esci',
                  subtitle: 'Disconnetti il tuo account',
                  isDestructive: true,
                  onTap: () {
                    _showLogoutDialog(context, auth);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: isDestructive 
              ? AppTheme.errorColor.withValues(alpha: 0.1)
              : AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          icon,
          color: isDestructive ? AppTheme.errorColor : AppTheme.secondaryColor,
          size: 20,
        ),
      ),
      title: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          color: isDestructive ? AppTheme.errorColor : null,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: AppTheme.textMuted,
        ),
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: AppTheme.textMuted,
      ),
      onTap: onTap,
    );
  }

  void _showAboutDialog(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'TotoHockey',
      applicationVersion: '1.0.0',
      applicationIcon: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: AppTheme.secondaryColor.withValues(alpha: 0.2),
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Icons.sports_hockey,
          size: 32,
          color: AppTheme.secondaryColor,
        ),
      ),
      children: [
        const Text(
          'TotoHockey è l\'app per i pronostici sull\'hockey su ghiaccio italiano.\n\n'
          'Fai i tuoi pronostici, sfida i tuoi amici nelle leghe private e scala la classifica!',
        ),
      ],
    );
  }

  void _showLogoutDialog(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Esci'),
        content: const Text('Sei sicuro di voler uscire?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annulla'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              auth.signOut();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('Esci'),
          ),
        ],
      ),
    );
  }
}



