import 'dart:convert';

import 'package:flutter/services.dart';

/// Dart port of core/diagnosticEngine.js.
/// Prefer loading assets/causes.json for parity with the JS engine.
class DiagnosticEngine {
  static Map<String, _CauseDef>? _causes;
  static List<_Boost> _boosts = const [];
  static bool _loading = false;

  /// Call once at app start (or lazy on first score).
  static Future<void> ensureLoaded() async {
    if (_causes != null || _loading) return;
    _loading = true;
    try {
      final raw = await rootBundle.loadString('assets/causes.json');
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final causesRaw = map['causes'] as Map<String, dynamic>? ?? {};
      final boostsRaw = map['boosts'] as List<dynamic>? ?? [];
      _causes = causesRaw.map((name, def) {
        final d = def as Map<String, dynamic>;
        return MapEntry(
          name,
          _CauseDef(
            base: (d['base'] as num?)?.toInt() ?? 10,
            keywords: (d['keywords'] as List?)?.map((e) => '$e').toList() ??
                const [],
            nextTest: '${d['nextTest'] ?? ''}',
            category: '${d['category'] ?? 'general'}',
          ),
        );
      });
      _boosts = boostsRaw.map((b) {
        final m = b as Map<String, dynamic>;
        return _Boost(
          when: (m['when'] as List?)?.map((e) => '$e').toList() ?? const [],
          cause: '${m['cause'] ?? ''}',
          add: (m['add'] as num?)?.toInt() ?? 0,
        );
      }).toList();
    } catch (_) {
      _causes = _fallbackCauses;
      _boosts = _fallbackBoosts;
    } finally {
      _loading = false;
    }
  }

  static List<Hypothesis> score(List<String> evidence) {
    final causes = _causes ?? _fallbackCauses;
    final boosts = _causes != null ? _boosts : _fallbackBoosts;
    final text = evidence.join('\n').toLowerCase();
    final results = <Hypothesis>[];

    causes.forEach((name, def) {
      var confidence = def.base;
      for (final kw in def.keywords) {
        if (text.contains(kw)) confidence += 18;
      }
      for (final b in boosts) {
        if (b.cause == name && b.when.any(text.contains)) {
          confidence += b.add;
        }
      }
      confidence = confidence.clamp(0, 100);
      if (confidence > 5) {
        results.add(Hypothesis(
          cause: name,
          confidence: confidence,
          nextTest: def.nextTest,
          category: def.category,
        ));
      }
    });

    results.sort((a, b) => b.confidence.compareTo(a.confidence));
    return results;
  }

  static const _fallbackCauses = <String, _CauseDef>{
    'DHCP Failure': _CauseDef(
      base: 40,
      keywords: [
        'no ip',
        'no ipv4',
        'dhcp',
        'no address',
        'lease',
        'en0',
        'no route to host',
      ],
      nextTest: 'ipconfig getifaddr en0',
      category: 'network',
    ),
    'DNS Failure': _CauseDef(
      base: 25,
      keywords: [
        'dns',
        'resolve',
        'nxdomain',
        'cannot resolve',
        'name resolution',
      ],
      nextTest: 'nslookup apple.com',
      category: 'network',
    ),
    'VPN Route Corruption': _CauseDef(
      base: 15,
      keywords: ['vpn', 'utun', 'route corruption', 'tunnel', 'no route'],
      nextTest: 'route -n get default',
      category: 'network',
    ),
  };

  static const _fallbackBoosts = <_Boost>[
    _Boost(when: ['no route to host'], cause: 'DHCP Failure', add: 20),
    _Boost(when: ['vpn'], cause: 'VPN Route Corruption', add: 25),
  ];
}

class Hypothesis {
  Hypothesis({
    required this.cause,
    required this.confidence,
    required this.nextTest,
    this.category = 'general',
  });

  final String cause;
  final int confidence;
  final String nextTest;
  final String category;
}

class _CauseDef {
  const _CauseDef({
    required this.base,
    required this.keywords,
    required this.nextTest,
    this.category = 'general',
  });

  final int base;
  final List<String> keywords;
  final String nextTest;
  final String category;
}

class _Boost {
  const _Boost({
    required this.when,
    required this.cause,
    required this.add,
  });

  final List<String> when;
  final String cause;
  final int add;
}
