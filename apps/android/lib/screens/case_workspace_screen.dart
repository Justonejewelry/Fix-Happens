import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/case_record.dart';
import '../services/diagnostic_engine.dart';
import '../widgets/crystal_card.dart';

const Color kAccent = Color(0xFFFF5AA5);

class CaseWorkspaceScreen extends StatefulWidget {
  const CaseWorkspaceScreen({
    super.key,
    required this.caseRecord,
    required this.onChanged,
  });

  final CaseRecord caseRecord;
  final ValueChanged<CaseRecord> onChanged;

  @override
  State<CaseWorkspaceScreen> createState() => _CaseWorkspaceScreenState();
}

class _CaseWorkspaceScreenState extends State<CaseWorkspaceScreen> {
  late CaseRecord _case;
  final _input = TextEditingController();

  @override
  void initState() {
    super.initState();
    _case = widget.caseRecord;
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  List<Hypothesis> get _hypotheses => DiagnosticEngine.score(_case.evidence);

  void _persist() => widget.onChanged(_case);

  void _addEvidence() {
    final v = _input.text.trim();
    if (v.isEmpty) return;
    setState(() {
      _case.evidence = [..._case.evidence, v];
      _input.clear();
    });
    _persist();
  }

  Future<void> _closeCase() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1C2033),
        title: const Text('Close case?'),
        content: Text('Close #${_case.id} — ${_case.symptom}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: kAccent),
            child: const Text('Close'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() {
      _case.closed = true;
      _case.status = 'Closed';
    });
    _persist();
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final ranked = _hypotheses;
    final top = ranked.isNotEmpty ? ranked.first : null;

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
          title: Text('Case #${_case.id}'),
          actions: [
            TextButton(
              onPressed: _case.closed ? null : _closeCase,
              child: const Text('Close'),
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _case.symptom,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: kAccent,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_case.device} · ${_case.status}',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 13,
                    ),
                  ),
                  if (top != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      'Next: ${top.nextTest}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Confidence ${top.confidence}%',
                      style: TextStyle(color: Colors.white.withOpacity(0.65)),
                    ),
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: FilledButton(
                        onPressed: () async {
                          await Clipboard.setData(
                            ClipboardData(text: top.nextTest),
                          );
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Command copied')),
                          );
                        },
                        style: FilledButton.styleFrom(
                          backgroundColor: kAccent.withOpacity(0.4),
                        ),
                        child: const Text('Copy next test'),
                      ),
                    ),
                  ],
                  if (_case.pills.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _case.pills
                          .map(
                            (p) => ChipLabel(p),
                          )
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 14),
            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle('Hypotheses'),
                  if (ranked.isEmpty)
                    Text(
                      'Add evidence to rank causes',
                      style: TextStyle(color: Colors.white.withOpacity(0.55)),
                    )
                  else
                    ...ranked.map((h) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(child: Text(h.cause)),
                                Text(
                                  '${h.confidence}%',
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
                                value: h.confidence / 100,
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
            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle('Evidence'),
                  if (_case.evidence.isEmpty)
                    Text(
                      'No evidence yet',
                      style: TextStyle(color: Colors.white.withOpacity(0.55)),
                    )
                  else
                    ..._case.evidence.map(
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
                        ),
                        child: const Text('Add'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle('Commands'),
                  ...[
                    'ping 8.8.8.8',
                    'route -n get default',
                    'ipconfig getifaddr en0',
                    'networksetup -getinfo Wi-Fi',
                  ].map(
                    (cmd) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              cmd,
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 13,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: () async {
                              await Clipboard.setData(ClipboardData(text: cmd));
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Copied')),
                              );
                            },
                            child: const Text('Copy'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
