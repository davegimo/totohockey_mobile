import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_theme.dart';
import '../../providers/providers.dart';
import 'dashboard_screen.dart';
import 'classifica_screen.dart';
import '../leagues/leghe_screen.dart';
import 'profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  bool _hasPreloaded = false;
  
  final List<Widget> _screens = const [
    DashboardScreen(),
    ClassificaScreen(),
    LegheScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    // Precarica immediatamente la classifica quando viene creato il MainScreen
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _preloadData();
    });
  }

  void _preloadData() {
    if (!_hasPreloaded) {
      _hasPreloaded = true;
      // Precarica la classifica in background - non aspetta, carica subito
      final provider = context.read<ClassificaProvider>();
      if (!provider.hasLoaded && !provider.isLoading) {
        provider.preloadClassifica();
      }
    }
  }

  void _onTabChanged(int index) {
    // Quando si cambia tab, se si va alla classifica e non è ancora caricata, caricala
    if (index == 1) {
      final provider = context.read<ClassificaProvider>();
      if (!provider.hasLoaded && !provider.isLoading) {
        provider.preloadClassifica();
      }
    }
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
      ),
      bottomNavigationBar: _buildBottomNavBar(),
    );
  }

  Widget _buildBottomNavBar() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                index: 0,
                icon: Icons.home_outlined,
                activeIcon: Icons.home,
                label: 'Home',
              ),
              _buildNavItem(
                index: 1,
                icon: Icons.leaderboard_outlined,
                activeIcon: Icons.leaderboard,
                label: 'Classifica',
              ),
              _buildNavItem(
                index: 2,
                icon: Icons.groups_outlined,
                activeIcon: Icons.groups,
                label: 'Leghe',
              ),
              _buildNavItem(
                index: 3,
                icon: Icons.person_outline,
                activeIcon: Icons.person,
                label: 'Profilo',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    final isSelected = _currentIndex == index;
    
    return GestureDetector(
      onTap: () {
        _onTabChanged(index);
      },
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? AppTheme.secondaryColor.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: isSelected ? AppTheme.secondaryColor : AppTheme.textMuted,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? AppTheme.secondaryColor : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}



