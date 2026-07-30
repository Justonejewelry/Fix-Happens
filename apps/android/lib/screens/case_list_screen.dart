import 'package:flutter/material.dart';

import '../models/case_record.dart';
import '../services/case_store.dart';
import '../widgets/crystal_card.dart';
import 'case_workspace_screen.dart';

class CaseListScreen extends StatefulWidget {
  const CaseListScreen({super.key});

  @override
  State<CaseListScreen> createState() => _CaseListScreenState();
}

class _CaseListScreenState extends State<CaseListScreen> {
  final _store = CaseStore();
  List<CaseRecord> _cases = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  Future<void> _reload() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _store.load();
      if (!mounted) return;
      setState(() {
        _cases = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
        _cases = [];
      });
    }
  }

  List<CaseRecord> get _open =>
      _cases.where((c) => !c.closed).toList(growable: false);

  Future<void> _createCase() async {
    final controller = TextEditingController();
    final symptom = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1C2033),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.add_circle_outline, color: kAccent, size: 22),
            SizedBox(width: 8),
            Text('New case'),
          ],
        ),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Symptom / problem',
            hintStyle: const TextStyle(color: Colors.white54),
            filled: true,
            fillColor: Colors.white.withOpacity(0.06),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
          ),
          onSubmitted: (v) => Navigator.pop(ctx, v.trim()),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton.icon(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            style: FilledButton.styleFrom(
              backgroundColor: kAccent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.check, size: 18),
            label: const Text('Create'),
          ),
        ],
      ),
    );
    if (symptom == null || symptom.isEmpty) return;
    try {
      final created = await _store.create(symptom: symptom);
      if (!mounted) return;
      await _openCase(created);
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Save failed: $e'),
          backgroundColor: Colors.red.shade800,
        ),
      );
    }
  }

  Future<void> _openCase(CaseRecord c) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CaseWorkspaceScreen(
          caseRecord: c,
          store: _store,
          onChanged: (_) async {
            await _reload();
          },
        ),
      ),
    );
    await _reload();
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
              BrandMark(size: 32),
              SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Fix Happens',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
                  ),
                  Text(
                    'Open cases',
                    style: TextStyle(fontSize: 11, color: Colors.white54),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            IconButton(
              tooltip: 'Refresh',
              icon: const Icon(Icons.refresh_rounded),
              onPressed: _reload,
            ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert_rounded),
              color: const Color(0xFF1C2033),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              onSelected: (v) {
                if (v == 'new') _createCase();
                if (v == 'refresh') _reload();
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'new',
                  child: ListTile(
                    dense: true,
                    leading: Icon(Icons.add, color: kAccent),
                    title: Text('New case'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                const PopupMenuItem(
                  value: 'refresh',
                  child: ListTile(
                    dense: true,
                    leading: Icon(Icons.refresh, color: Colors.white70),
                    title: Text('Refresh'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: _createCase,
          backgroundColor: kAccent.withOpacity(0.92),
          foregroundColor: Colors.white,
          elevation: 8,
          icon: const Icon(Icons.add_rounded),
          label: const Text('New case'),
        ),
        body: _loading
            ? const Center(
                child: CircularProgressIndicator(color: kAccent, strokeWidth: 3),
              )
            : Column(
                children: [
                  if (_error != null)
                    Material(
                      color: Colors.red.shade900.withOpacity(0.85),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded,
                                color: Colors.white),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _error!,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, color: Colors.white),
                              onPressed: () => setState(() => _error = null),
                            ),
                          ],
                        ),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                    child: Row(
                      children: [
                        StatusPill(
                          '${_open.length} open',
                          accent: true,
                          icon: Icons.folder_open_rounded,
                        ),
                        const SizedBox(width: 8),
                        StatusPill(
                          'Offline',
                          icon: Icons.cloud_off_outlined,
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: _open.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.inbox_outlined,
                                    size: 48,
                                    color: Colors.white.withOpacity(0.35)),
                                const SizedBox(height: 12),
                                Text(
                                  'No open cases',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.75),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Tap New case to start diagnosing',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.45),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                            itemCount: _open.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, i) {
                              final c = _open[i];
                              final done = c.verificationDone;
                              return CrystalCard(
                                onTap: () => _openCase(c),
                                child: Row(
                                  children: [
                                    VerificationRing(
                                      progress: c.verificationProgress,
                                      label: '$done/4',
                                      size: 56,
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                '#${c.id}',
                                                style: const TextStyle(
                                                  color: kAccent,
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 12,
                                                ),
                                              ),
                                              const Spacer(),
                                              StatusPill(
                                                c.status,
                                                accent: true,
                                                icon: Icons.timelapse_rounded,
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            c.symptom,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 15.5,
                                              fontWeight: FontWeight.w600,
                                              height: 1.25,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              Icon(Icons.devices_rounded,
                                                  size: 13,
                                                  color: Colors.white
                                                      .withOpacity(0.45)),
                                              const SizedBox(width: 4),
                                              Text(
                                                c.device,
                                                style: TextStyle(
                                                  color: Colors.white
                                                      .withOpacity(0.5),
                                                  fontSize: 12,
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              Icon(Icons.notes_rounded,
                                                  size: 13,
                                                  color: Colors.white
                                                      .withOpacity(0.45)),
                                              const SizedBox(width: 4),
                                              Text(
                                                '${c.evidence.length}',
                                                style: TextStyle(
                                                  color: Colors.white
                                                      .withOpacity(0.5),
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                    Icon(
                                      Icons.chevron_right_rounded,
                                      color: Colors.white.withOpacity(0.35),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
      ),
    );
  }
}
