import 'package:flutter/material.dart';

void main() => runApp(const FixHappensApp());

class FixHappensApp extends StatelessWidget {
  const FixHappensApp({super.key});

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFFFF5AA5);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Fix Happens',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: accent,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF111427),
      ),
      home: const FixHappensHome(),
    );
  }
}

class FixHappensHome extends StatelessWidget {
  const FixHappensHome({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF111427), Color(0xFF261233), Color(0xFF1B1A2E)],
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Text('Fix Happens'),
          actions: const [
            Padding(
              padding: EdgeInsets.only(right: 16),
              child: Icon(Icons.search),
            ),
          ],
        ),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              _CrystalCard(
                title: 'Current Case',
                body: 'Wi-Fi connected but no internet',
                chips: ['No route to host', 'No IP assigned', 'VPN inactive'],
              ),
              SizedBox(height: 16),
              _CrystalCard(
                title: 'Recommended Next Tests',
                body: 'ping 8.8.8.8\nroute -n get default\nipconfig getifaddr en0\nnetworksetup -getinfo Wi-Fi',
              ),
              SizedBox(height: 16),
              _CrystalCard(
                title: 'Status',
                body: 'Clear crystal UI · pink accent · soft blur · layered depth',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CrystalCard extends StatelessWidget {
  const _CrystalCard({required this.title, required this.body, this.chips = const []});

  final String title;
  final String body;
  final List<String> chips;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.25)),
        boxShadow: const [BoxShadow(blurRadius: 30, color: Colors.black26)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          Text(body, style: const TextStyle(fontSize: 16, height: 1.4)),
          if (chips.isNotEmpty) ...[
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: chips
                  .map((chip) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF5AA5).withOpacity(0.18),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: Colors.white.withOpacity(0.14)),
                        ),
                        child: Text(chip),
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}
