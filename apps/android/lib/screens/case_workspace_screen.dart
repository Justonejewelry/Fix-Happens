import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../models/case_record.dart';
import '../services/case_store.dart';
import '../services/diagnostic_engine.dart';
import '../widgets/crystal_card.dart';

const Color kAccent = Color(0xFFFF5AA5);

const _verificationLabels = <String, String>{
  'evidence_recorded': 'Evidence recorded',
  'hypotheses_scored': 'Hypotheses scored',
  'next_test_executed': 'Next test executed',
  'repair_verified': 'Repair verified',
};

class CaseWorkspaceScreen extends StatefulWidget {
  const CaseWorkspaceScreen({
    super.key,
    required this.caseRecord,
    required this.onChanged,
    required this.store,
  });

  final CaseRecord caseRecord;
  final ValueChanged<CaseRecord> onChanged;
  final CaseStore store;

  @override
  State<CaseWorkspaceScreen> createState() => _CaseWorkspaceScreenState();
}

class _CaseWorkspaceScreenState extends State<CaseWorkspaceScreen> {
  late CaseRecord _case;
  final _input = TextEditingController();
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _case = widget.caseRecord;
    _syncAutoChecks();
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  List<Hypothesis> get _hypotheses => DiagnosticEngine.score(_case.evidence);

  void _notify() => widget.onChanged(_case);

  void _syncAutoChecks() {
    final v = Map<String, bool>.from(_case.verification);
    if (_case.evidence.isNotEmpty || _case.photoPaths.isNotEmpty) {
      v['evidence_recorded'] = true;
    }
    if (_hypotheses.isNotEmpty) {
      v['hypotheses_scored'] = true;
    }
    _case.verification = v;
  }

  void _toggleCheck(String key) {
    setState(() {
      _case.verification[key] = !(_case.verification[key] ?? false);
    });
    _notify();
  }

  Future<void> _addEvidence() async {
    final v = _input.text.trim();
    if (v.isEmpty) return;
    try {
      await widget.store.addEvidence(_case.id, 'Note', v);
      setState(() {
        _case.evidence = [..._case.evidence, v];
        _input.clear();
        _syncAutoChecks();
      });
      _notify();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save evidence: $e')),
      );
    }
  }

  Future<void> _addPhoto(ImageSource source) async {
    try {
      final file = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
      );
      if (file == null) return;
      final label = 'Screenshot: ${file.name}';
      await widget.store.addEvidence(_case.id, 'Screenshot', label);
      setState(() {
        _case.photoPaths = [..._case.photoPaths, file.path];
        _case.evidence = [..._case.evidence, label];
        _syncAutoChecks();
      });
      _notify();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not add photo: $e')),
      );
    }
  }

  Future<void> _photoMenu() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1C2033),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera, color: kAccent),
              title: const Text('Take photo'),
              onTap: () {
                Navigator.pop(ctx);
                _addPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: kAccent),
              title: const Text('Choose from gallery'),
              onTap: () {
                Navigator.pop(ctx);
                _addPhoto(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
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
    try {
      await widget.store.closeCase(
        _case.id,
        resolution: 'Closed from Android workspace',
      );
      setState(() {
        _case.closed = true;
        _case.status = 'Resolved';
        _case.verification['repair_verified'] = true;
      });
      _notify();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Close failed: $e')),
      );
    }
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
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Verification',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.65),
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        '${_case.verificationDone} / ${_case.verificationTotal}',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.65),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: _case.verificationProgress,
                      minHeight: 6,
                      backgroundColor: Colors.white12,
                      color: kAccent,
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
                          setState(() {
                            _case.verification['next_test_executed'] = true;
                          });
                          _notify();
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
                      children: _case.pills.map((p) => ChipLabel(p)).toList(),
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
                  const SectionTitle('Verification'),
                  ..._verificationLabels.entries.map((e) {
                    final done = _case.verification[e.key] ?? false;
                    return InkWell(
                      onTap: () => _toggleCheck(e.key),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            Icon(
                              done
                                  ? Icons.check_box
                                  : Icons.check_box_outline_blank,
                              color: done ? kAccent : Colors.white38,
                              size: 22,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                e.value,
                                style: TextStyle(
                                  color: done
                                      ? Colors.white
                                      : Colors.white.withOpacity(0.7),
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
                  Row(
                    children: [
                      const Expanded(child: SectionTitle('Evidence')),
                      IconButton(
                        tooltip: 'Add photo',
                        onPressed: _photoMenu,
                        icon: const Icon(Icons.add_a_photo, color: kAccent),
                      ),
                    ],
                  ),
                  if (_case.photoPaths.isNotEmpty) ...[
                    SizedBox(
                      height: 96,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _case.photoPaths.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, i) {
                          final path = _case.photoPaths[i];
                          final file = File(path);
                          return ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: file.existsSync()
                                ? Image.file(
                                    file,
                                    width: 96,
                                    height: 96,
                                    fit: BoxFit.cover,
                                  )
                                : Container(
                                    width: 96,
                                    height: 96,
                                    color: Colors.white12,
                                    child: const Icon(Icons.broken_image),
                                  ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (_case.evidence.isEmpty && _case.photoPaths.isEmpty)
                    Text(
                      'No evidence yet — add a note or photo',
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
