import 'package:flutter/material.dart';

void main() => runApp(const FixHappensApp());

const Color kAccent = Color(0xFFFF5AA5);
const Color kBg = Color(0xFF111427);

class FixHappensApp extends StatelessWidget {
  const FixHappensApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Fix Happens',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: kAccent,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: kBg,
      ),
      home: const CaseWorkspaceScreen(),
    );
  }
}

class CaseWorkspaceScreen extends StatefulWidget {
  const CaseWorkspaceScreen({super.key});

  @override
  State<CaseWorkspaceScreen> createState() => _CaseWorkspaceScreenState();
}

class _CaseWorkspaceScreenState extends State<CaseWorkspaceScreen> {
  final List<String> _evidence = [
    'Wi-Fi shows connected, no internet access',
    'no route to host',
    'VPN was used earlier today',
  ];

  final _input = TextEditingController();

  List<Map<String, dynamic>> get _hypotheses {
    // Lightweight mirror of core/diagnosticEngine scoring for field UI
    final text = _evidence.join('\n').toLowerCase();
    final bases = <String, int>{
      'DHCP Failure': 40,
      'Network Preference Corruption': 30,
      'VPN Route Corruption': 15,
      'DNS Failure': 25,
    };
    if (text.contains('no route') || text.contains('no ip')) {
      bases['DHCP Failure'] = (bases['DHCP Failure']! + 35).clamp(0, 100);
    }
    if (text.contains('vpn')) {
      bases['VPN Route Corruption'] =
          (bases['VPN Route Corruption']! + 40).clamp(0, 100);
    }
    if (text.contains('dns')) {
      bases['DNS Failure'] = (bases['DNS Failure']! + 30).clamp(0, 100);
    }
    final list = bases.entries
        .map((e) => {'cause': e.key, 'confidence': e.value})
        .toList()
      ..sort((a, b) =>
          (b['confidence'] as int).compareTo(a['confidence'] as int));
    return list;
  }

  void _addEvidence() {
    final v = _input.text.trim();
    if (v.isEmpty) return;
    setState(() {
      _evidence.add(v);
      _input.clear();
    });
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final top = _hypotheses.isNotEmpty ? _hypotheses.first : null;

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
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Case hero
            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Wi-Fi connected but no internet',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: kAccent,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Case #1042 · MacBook Pro · Diagnosing',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (top != null)
                    Text(
                      'Next: ipconfig getifaddr en0 · Confidence ${top['confidence']}%',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: const [
                      ChipLabel('No route to host'),
                      ChipLabel('No IP assigned'),
                      ChipLabel('VPN inactive'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Hypotheses
            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle('Hypotheses'),
                  ..._hypotheses.map((h) {
                    final c = h['confidence'] as int;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(child: Text(h['cause'] as String)),
                              Text(
                                '$c%',
                                style: const TextStyle(
                                  color: kAccent,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(999),
                            child: LinearProgressIndicator(
                              value: c / 100,
                              minHeight: 5,
                              backgroundColor: Colors.white12,
                              color: kAccent,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Evidence
            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle('Evidence'),
                  ..._evidence.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(e, style: const TextStyle(height: 1.35)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _input,
                          style: const TextStyle(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Add evidence note…',
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.06),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(
                                color: Colors.white.withOpacity(0.2),
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(
                                color: Colors.white.withOpacity(0.2),
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                          ),
                          onSubmitted: (_) => _addEvidence(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: _addEvidence,
                        style: FilledButton.styleFrom(
                          backgroundColor: kAccent.withOpacity(0.35),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Add'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Commands
            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SectionTitle('Commands'),
                  CommandRow('ping 8.8.8.8'),
                  CommandRow('route -n get default'),
                  CommandRow('ipconfig getifaddr en0'),
                  CommandRow('networksetup -getinfo Wi-Fi'),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Center(
              child: Text(
                'Clear Crystal · Liquid Glass · Android field companion',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.45),
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CrystalCard extends StatelessWidget {
  const CrystalCard({super.key, required this.child});
  final Widget child;

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
      child: child,
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.6,
          color: Colors.white.withOpacity(0.65),
        ),
      ),
    );
  }
}

class ChipLabel extends StatelessWidget {
  const ChipLabel(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: kAccent.withOpacity(0.18),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withOpacity(0.14)),
      ),
      child: Text(label, style: const TextStyle(fontSize: 12)),
    );
  }
}

class CommandRow extends StatelessWidget {
  const CommandRow(this.cmd, {super.key});
  final String cmd;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.14)),
        ),
        child: Text(
          cmd,
          style: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
