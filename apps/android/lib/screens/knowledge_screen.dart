import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../widgets/crystal_card.dart';

class KnowledgePack {
  KnowledgePack({
    required this.id,
    required this.title,
    required this.version,
    required this.tips,
    required this.relatedCauses,
  });

  final String id;
  final String title;
  final int version;
  final List<String> tips;
  final List<String> relatedCauses;

  factory KnowledgePack.fromJson(Map<String, dynamic> j, String fallbackId) {
    return KnowledgePack(
      id: (j['id'] as String?) ?? fallbackId,
      title: (j['title'] as String?) ?? fallbackId,
      version: (j['version'] as num?)?.toInt() ?? 1,
      tips: (j['tips'] as List?)?.map((e) => '$e').toList() ?? const [],
      relatedCauses:
          (j['relatedCauses'] as List?)?.map((e) => '$e').toList() ?? const [],
    );
  }
}

class KnowledgeScreen extends StatefulWidget {
  const KnowledgeScreen({super.key});

  @override
  State<KnowledgeScreen> createState() => _KnowledgeScreenState();
}

class _KnowledgeScreenState extends State<KnowledgeScreen> {
  bool _loading = true;
  String? _error;
  List<KnowledgePack> _packs = [];

  static const _assetPaths = [
    'assets/knowledge/network.json',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final out = <KnowledgePack>[];
    final errors = <String>[];
    for (final path in _assetPaths) {
      try {
        final raw = await rootBundle.loadString(path);
        final map = jsonDecode(raw) as Map<String, dynamic>;
        final id = path.split('/').last.replaceAll('.json', '');
        out.add(KnowledgePack.fromJson(map, id));
      } catch (e) {
        errors.add('$path: $e');
      }
    }
    if (!mounted) return;
    setState(() {
      _packs = out;
      _loading = false;
      _error = errors.isEmpty ? null : errors.join('\n');
    });
  }

  @override
  Widget build(BuildContext context) {
    return AppGradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Row(
            children: [
              Icon(Icons.menu_book_rounded, color: kAccent, size: 22),
              SizedBox(width: 8),
              Text('Knowledge'),
            ],
          ),
          actions: [
            IconButton(
              tooltip: 'Refresh',
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: kAccent))
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: CrystalCard(
                        child: Text(
                          _error!,
                          style: const TextStyle(color: Colors.orangeAccent, fontSize: 12),
                        ),
                      ),
                    ),
                  if (_packs.isEmpty)
                    const CrystalCard(
                      child: Text(
                        'No knowledge packs bundled. Add JSON under assets/knowledge/.',
                        style: TextStyle(color: Colors.white70),
                      ),
                    )
                  else
                    ..._packs.map((p) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: CrystalCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.auto_stories_rounded,
                                      color: kAccent, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      p.title,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                                  StatusPill('v${p.version}', icon: Icons.tag),
                                ],
                              ),
                              if (p.relatedCauses.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: p.relatedCauses
                                      .map((c) => ChipLabel(
                                            c,
                                            icon: Icons.hub_outlined,
                                          ))
                                      .toList(),
                                ),
                              ],
                              const SizedBox(height: 12),
                              const SectionTitle('Tips', icon: Icons.lightbulb_outline),
                              ...p.tips.map(
                                (t) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.check_circle_outline,
                                          size: 16, color: kAccent),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          t,
                                          style: TextStyle(
                                            color: Colors.white.withOpacity(0.78),
                                            height: 1.35,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
      ),
    );
  }
}
