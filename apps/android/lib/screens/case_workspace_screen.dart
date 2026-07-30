import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../models/case_record.dart';
import '../services/case_store.dart';
import '../services/diagnostic_engine.dart';
import '../services/field_tips_service.dart';
import '../widgets/crystal_card.dart';

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
  List<FieldTip> _tips = const [];

  @override
  void initState() {
    super.initState();
    _case = widget.caseRecord;
    _syncAutoChecks();
    _refreshTips();
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  List<Hypothesis> get _hypotheses => DiagnosticEngine.score(_case.evidence);

  void _notify() => widget.onChanged(_case);

  Future<void> _refreshTips() async {
    final tips = await FieldTipsService.relevant(
      symptom: _case.symptom,
      evidence: _case.evidence,
    );
    if (!mounted) return;
    setState(() => _tips = tips);
  }

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
      await _refreshTips();
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
      await _refreshTips();
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
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_rounded, color: kAccent),
              title: const Text('Take photo'),
              onTap: () {
                Navigator.pop(ctx);
                _addPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded, color: kAccent),
              title: const Text('Choose from gallery'),
              onTap: () {
                Navigator.pop(ctx);
                _addPhoto(ImageSource.gallery);
              },
            ),
            const SizedBox(height: 8),
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.task_alt_rounded, color: kAccent),
            SizedBox(width: 8),
            Text('Close case?'),
          ],
        ),
        content: Text('Close #${_case.id} — ${_case.symptom}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton.icon(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: kAccent),
            icon: const Icon(Icons.check, size: 18),
            label: const Text('Close'),
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

  Future<void> _copyAllEvidence() async {
    final text = _case.evidence.join('\n');
    if (text.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Evidence copied')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ranked = _hypotheses;
    final top = ranked.isNotEmpty ? ranked.first : null;
    final done = _case.verificationDone;

    return AppGradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Row(
            children: [
              const Icon(Icons.assignment_outlined, color: kAccent, size: 22),
              const SizedBox(width: 8),
              Text('Case #${_case.id}'),
            ],
          ),
          actions: [
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_horiz_rounded),
              color: const Color(0xFF1C2033),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              onSelected: (v) {
                if (v == 'copy') _copyAllEvidence();
                if (v == 'photo') _photoMenu();
                if (v == 'close') _closeCase();
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'photo',
                  child: ListTile(
                    dense: true,
                    leading: Icon(Icons.add_a_photo_outlined, color: kAccent),
                    title: Text('Add photo'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const PopupMenuItem(
                  value: 'copy',
                  child: ListTile(
                    dense: true,
                    leading: Icon(Icons.copy_all_rounded, color: Colors.white70),
                    title: Text('Copy evidence'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const PopupMenuItem(
                  value: 'close',
                  child: ListTile(
                    dense: true,
                    leading: Icon(Icons.close_rounded, color: Colors.white70),
                    title: Text('Close case'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
            TextButton.icon(
              onPressed: _case.closed ? null : _closeCase,
              icon: const Icon(Icons.task_alt_rounded, size: 18),
              label: const Text('Close'),
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
          children: [
            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _case.symptom,
                              style: const TextStyle(
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFFF8EC4),
                                height: 1.25,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: [
                                StatusPill(
                                  _case.status,
                                  accent: true,
                                  icon: Icons.timelapse_rounded,
                                ),
                                StatusPill(
                                  _case.device,
                                  icon: Icons.devices_rounded,
                                ),
                                if (top != null)
                                  StatusPill(
                                    '${top.confidence}%',
                                    icon: Icons.insights_rounded,
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        children: [
                          VerificationRing(
                            progress: _case.verificationProgress,
                            label: '$done/4',
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Verification',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.white.withOpacity(0.5),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  if (top != null) ...[
                    const SizedBox(height: 14),
                    Text(
                      'Next test',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white.withOpacity(0.5),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      top.nextTest,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w600,
                        fontSize: 13.5,
                      ),
                    ),
                    const SizedBox(height: 10),
                    FilledButton.icon(
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
                        backgroundColor: kAccent.withOpacity(0.45),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: const Icon(Icons.play_arrow_rounded),
                      label: const Text('Copy next test'),
                    ),
                  ],
                  if (_case.pills.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _case.pills
                          .map((p) => ChipLabel(p, icon: Icons.sell_outlined))
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: 14),
                  StepStrip(doneCount: done),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Field tips (knowledge packs)
            if (_tips.isNotEmpty) ...[
              CrystalCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionTitle(
                      'Field tips',
                      icon: Icons.lightbulb_outline,
                    ),
                    ..._tips.map(
                      (t) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.auto_awesome,
                                size: 16, color: kAccent),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    t.packTitle,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: kAccent.withOpacity(0.9),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    t.tip,
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.78),
                                      height: 1.35,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            CrystalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle(
                    'Verification',
                    icon: Icons.verified_outlined,
                  ),
                  ...{
                    'evidence_recorded':
                        ('Evidence recorded', Icons.description_outlined),
                    'hypotheses_scored':
                        ('Hypotheses scored', Icons.insights_outlined),
                    'next_test_executed':
                        ('Next test executed', Icons.play_circle_outline),
                    'repair_verified':
                        ('Repair verified', Icons.task_alt_rounded),
                  }.entries.map((e) {
                    final doneItem = _case.verification[e.key] ?? false;
                    return InkWell(
                      onTap: () => _toggleCheck(e.key),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                gradient: doneItem
                                    ? const LinearGradient(
                                        colors: [kAccent, kAccent2],
                                      )
                                    : null,
                                border: doneItem
                                    ? null
                                    : Border.all(color: Colors.white30),
                                color: doneItem ? null : Colors.transparent,
                              ),
                              child: doneItem
                                  ? const Icon(Icons.check,
                                      size: 14, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 10),
                            Icon(e.value.$2,
                                size: 16,
                                color: doneItem ? kAccent : Colors.white38),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                e.value.$1,
                                style: TextStyle(
                                  color: doneItem
                                      ? Colors.white
                                      : Colors.white.withOpacity(0.7),
                                  fontWeight: doneItem
                                      ? FontWeight.w600
                                      : FontWeight.w400,
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
                  const SectionTitle('Hypotheses', icon: Icons.insights_outlined),
                  if (ranked.isEmpty)
                    Text(
                      'Add evidence to rank causes',
                      style: TextStyle(color: Colors.white.withOpacity(0.55)),
                    )
                  else
                    ...ranked.map((h) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.bubble_chart_outlined,
                                    size: 15, color: kAccent),
                                const SizedBox(width: 6),
                                Expanded(child: Text(h.cause)),
                                Text(
                                  '${h.confidence}%',
                                  style: const TextStyle(
                                    color: kAccent,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(999),
                              child: LinearProgressIndicator(
                                value: h.confidence / 100,
                                minHeight: 6,
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
                  SectionTitle(
                    'Evidence',
                    icon: Icons.description_outlined,
                    trailing: IconButton(
                      tooltip: 'Add photo',
                      onPressed: _photoMenu,
                      icon: const Icon(Icons.add_a_photo_rounded, color: kAccent),
                    ),
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
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              e.startsWith('Screenshot')
                                  ? Icons.image_outlined
                                  : Icons.notes_rounded,
                              size: 14,
                              color: kAccent.withOpacity(0.8),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(e, style: const TextStyle(height: 1.35)),
                            ),
                          ],
                        ),
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
                            prefixIcon: const Icon(Icons.edit_note_rounded,
                                color: Colors.white38),
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
                      FilledButton.icon(
                        onPressed: _addEvidence,
                        style: FilledButton.styleFrom(
                          backgroundColor: kAccent.withOpacity(0.4),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Add'),
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
                  const SectionTitle(
                    'Commands',
                    icon: Icons.terminal_rounded,
                  ),
                  ...[
                    'ping 8.8.8.8',
                    'route -n get default',
                    'ipconfig getifaddr en0',
                    'networksetup -getinfo Wi-Fi',
                    'arp -a',
                  ].map(
                    (cmd) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.04),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.chevron_right_rounded,
                                size: 16, color: kAccent),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                cmd,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 12.5,
                                ),
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () async {
                                await Clipboard.setData(ClipboardData(text: cmd));
                                if (!mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Copied')),
                                );
                              },
                              icon: const Icon(Icons.copy_rounded, size: 14),
                              label: const Text('Copy'),
                              style: TextButton.styleFrom(
                                foregroundColor: Colors.white70,
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
