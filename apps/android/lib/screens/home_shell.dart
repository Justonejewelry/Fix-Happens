import 'package:flutter/material.dart';

import '../widgets/crystal_card.dart';
import 'case_list_screen.dart';
import 'knowledge_screen.dart';

/// Bottom navigation shell: Cases + Knowledge.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _pages = [
    CaseListScreen(),
    KnowledgeScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return AppGradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: IndexedStack(
          index: _index,
          children: _pages,
        ),
        bottomNavigationBar: NavigationBar(
          backgroundColor: const Color(0xEE14182A),
          indicatorColor: kAccent.withOpacity(0.25),
          selectedIndex: _index,
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.folder_open_outlined),
              selectedIcon: Icon(Icons.folder_open_rounded, color: kAccent),
              label: 'Cases',
            ),
            NavigationDestination(
              icon: Icon(Icons.menu_book_outlined),
              selectedIcon: Icon(Icons.menu_book_rounded, color: kAccent),
              label: 'Knowledge',
            ),
          ],
        ),
      ),
    );
  }
}
