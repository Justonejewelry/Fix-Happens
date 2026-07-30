import 'package:flutter/material.dart';

import '../models/case_record.dart';
import '../services/case_store.dart';
import '../widgets/crystal_card.dart';
import 'case_workspace_screen.dart';

const Color kAccent = Color(0xFFFF5AA5);

class CaseListScreen extends StatefulWidget {
  const CaseListScreen({super.key});

  @override
  State<CaseListScreen> createState() => _CaseListScreenState();
}

class _CaseListScreenState extends State<CaseListScreen> {
  final _store = CaseStore();
  List<CaseRecord> _cases = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  Future<void> _reload() async {
    final list = await _store.load();
    if (!mounted) return;
    setState(() {
      _cases = list;
      _loading = false;
    });
  }

  List<CaseRecord> get _open =>
      _cases.where((c) => !c.closed).toList(growable: false);

  Future<void> _createCase() async {
    final controller = TextEditingController();
    final symptom = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1C2033),
        title: const Text('New case'),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Symptom / problem',
            hintStyle: TextStyle(color: Colors.white54),
          ),
          onSubmitted: (v) => Navigator.pop(ctx, v.trim()),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            style: FilledButton.styleFrom(backgroundColor: kAccent),
            child: const Text('Create'),
          ),
        ],
      ),
    );
    if (symptom == null || symptom.isEmpty) return;
    final created = _store.create(symptom: symptom);
    _cases = [..._cases, created];
    await _store.save(_cases);
    if (!mounted) return;
    setState(() {});
    await _openCase(created);
  }

  Future<void> _openCase(CaseRecord c) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CaseWorkspaceScreen(
          caseRecord: c,
          onChanged: (updated) async {
            final i = _cases.indexWhere((x) => x.id == updated.id);
            if (i >= 0) _cases[i] = updated;
            await _store.save(_cases);
            if (mounted) setState(() {});
          },
        ),
      ),
    );
    await _reload();
  }

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
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _reload,
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: _createCase,
          backgroundColor: kAccent.withOpacity(0.9),
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add),
          label: const Text('New case'),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: kAccent))
            : _open.isEmpty
                ? const Center(
                    child: Text(
                      'No open cases\nTap New case to start',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white70),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
                    itemCount: _open.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final c = _open[i];
                      return GestureDetector(
                        onTap: () => _openCase(c),
                        child: CrystalCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    '#${c.id}',
                                    style: const TextStyle(
                                      color: kAccent,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    c.status,
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.65),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                c.symptom,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '${c.device} · ${c.evidence.length} evidence',
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.55),
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
