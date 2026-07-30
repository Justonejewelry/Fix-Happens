import 'dart:convert';

import 'package:flutter/services.dart';

/// Contextual knowledge tips for the Android case workspace.
/// Mirrors core/knowledgeLoader.getRelevantTips scoring at a lightweight level.
class FieldTip {
  FieldTip({
    required this.packId,
    required this.packTitle,
    required this.tip,
    required this.score,
  });

  final String packId;
  final String packTitle;
  final String tip;
  final int score;
}

class FieldTipsService {
  static const _paths = [
    'assets/knowledge/network.json',
    'assets/knowledge/network-scan.json',
    'assets/knowledge/print.json',
    'assets/knowledge/power.json',
    'assets/knowledge/storage.json',
    'assets/knowledge/display.json',
    'assets/knowledge/usb.json',
  ];

  static List<_Pack>? _packs;

  static Future<void> ensureLoaded() async {
    if (_packs != null) return;
    final out = <_Pack>[];
    for (final path in _paths) {
      try {
        final raw = await rootBundle.loadString(path);
        final map = jsonDecode(raw) as Map<String, dynamic>;
        out.add(_Pack(
          id: '${map['id'] ?? path}',
          title: '${map['title'] ?? map['id'] ?? path}',
          tips: (map['tips'] as List?)?.map((e) => '$e').toList() ?? const [],
          relatedCauses: (map['relatedCauses'] as List?)
                  ?.map((e) => '$e')
                  .toList() ??
              const [],
          keywords:
              (map['keywords'] as List?)?.map((e) => '$e').toList() ?? const [],
          category: '${map['category'] ?? 'general'}',
        ));
      } catch (_) {
        // skip missing packs
      }
    }
    _packs = out;
  }

  static Future<List<FieldTip>> relevant({
    required String symptom,
    required List<String> evidence,
    int limit = 5,
  }) async {
    await ensureLoaded();
    final packs = _packs ?? const [];
    final text = ([symptom, ...evidence].join('\n')).toLowerCase();
    final scored = <FieldTip>[];

    for (final pack in packs) {
      var packScore = 0;
      for (final kw in pack.keywords) {
        if (kw.isNotEmpty && text.contains(kw.toLowerCase())) packScore += 3;
      }
      for (final cause in pack.relatedCauses) {
        if (cause.isNotEmpty && text.contains(cause.toLowerCase())) {
          packScore += 5;
        }
      }
      if (pack.category.isNotEmpty &&
          text.contains(pack.category.toLowerCase())) {
        packScore += 2;
      }
      if (packScore <= 0) continue;
      for (final tip in pack.tips) {
        scored.add(FieldTip(
          packId: pack.id,
          packTitle: pack.title,
          tip: tip,
          score: packScore,
        ));
      }
    }

    scored.sort((a, b) => b.score.compareTo(a.score));
    final seen = <String>{};
    final unique = <FieldTip>[];
    for (final t in scored) {
      final key = t.tip.toLowerCase();
      if (seen.contains(key)) continue;
      seen.add(key);
      unique.add(t);
      if (unique.length >= limit) break;
    }
    return unique;
  }
}

class _Pack {
  _Pack({
    required this.id,
    required this.title,
    required this.tips,
    required this.relatedCauses,
    required this.keywords,
    required this.category,
  });

  final String id;
  final String title;
  final List<String> tips;
  final List<String> relatedCauses;
  final List<String> keywords;
  final String category;
}
