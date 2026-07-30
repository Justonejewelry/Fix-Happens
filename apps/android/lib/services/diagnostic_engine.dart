/// Dart port of core/diagnosticEngine.js — keep in sync with the JS source.
class DiagnosticEngine {
  static const causes = <String, _CauseDef>{
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
    ),
    'VPN Route Corruption': _CauseDef(
      base: 15,
      keywords: ['vpn', 'utun', 'route corruption', 'tunnel', 'no route'],
      nextTest: 'route -n get default',
    ),
    'Network Preference Corruption': _CauseDef(
      base: 30,
      keywords: ['preference', 'networksetup', 'plist', 'configd', 'preferences'],
      nextTest: 'networksetup -getinfo Wi-Fi',
    ),
    'Interface Down': _CauseDef(
      base: 20,
      keywords: ['interface down', 'en0 down', 'link down', 'media: none'],
      nextTest: 'ifconfig en0',
    ),
    'Firewall Block': _CauseDef(
      base: 10,
      keywords: ['firewall', 'pf', 'blocked', 'deny'],
      nextTest: 'sudo pfctl -s rules',
    ),
  };

  static List<Hypothesis> score(List<String> evidence) {
    final text = evidence.join('\n').toLowerCase();
    final results = <Hypothesis>[];

    causes.forEach((name, def) {
      var confidence = def.base;
      for (final kw in def.keywords) {
        if (text.contains(kw)) confidence += 18;
      }
      if (text.contains('no route to host') && name == 'DHCP Failure') {
        confidence += 20;
      }
      if (text.contains('vpn') && name == 'VPN Route Corruption') {
        confidence += 25;
      }
      if ((text.contains('no ip') || text.contains('no ipv4')) &&
          name == 'DHCP Failure') {
        confidence += 25;
      }
      confidence = confidence.clamp(0, 100);
      if (confidence > 5) {
        results.add(Hypothesis(
          cause: name,
          confidence: confidence,
          nextTest: def.nextTest,
        ));
      }
    });

    results.sort((a, b) => b.confidence.compareTo(a.confidence));
    return results;
  }
}

class Hypothesis {
  Hypothesis({
    required this.cause,
    required this.confidence,
    required this.nextTest,
  });

  final String cause;
  final int confidence;
  final String nextTest;
}

class _CauseDef {
  const _CauseDef({
    required this.base,
    required this.keywords,
    required this.nextTest,
  });

  final int base;
  final List<String> keywords;
  final String nextTest;
}
