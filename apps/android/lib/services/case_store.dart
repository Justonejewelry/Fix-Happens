import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../models/case_record.dart';

class CaseStore {
  static const _key = 'fixhappens.cases.v1';
  static const _uuid = Uuid();

  Future<List<CaseRecord>> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) {
      final seed = _seed();
      await save(seed);
      return seed;
    }
    try {
      final list = jsonDecode(raw) as List;
      return list
          .map((e) => CaseRecord.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } catch (_) {
      return _seed();
    }
  }

  Future<void> save(List<CaseRecord> cases) async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(cases.map((c) => c.toJson()).toList());
    await prefs.setString(_key, encoded);
  }

  CaseRecord create({required String symptom, String device = 'Field device'}) {
    return CaseRecord(
      id: _uuid.v4().substring(0, 8),
      symptom: symptom,
      device: device,
      status: 'Diagnosing',
    );
  }

  List<CaseRecord> _seed() => [
        CaseRecord(
          id: '1042',
          symptom: 'Wi-Fi connected but no internet',
          device: 'MacBook Pro',
          status: 'Diagnosing',
          evidence: [
            'Wi-Fi shows connected, no internet access',
            'no route to host',
            'VPN was used earlier today',
          ],
          pills: ['No route to host', 'No IP assigned', 'VPN inactive'],
        ),
        CaseRecord(
          id: '1038',
          symptom: 'Printer offline after sleep',
          device: 'LaserJet',
          status: 'Investigating',
          evidence: ['USB sleep', 'Driver timeout'],
          pills: ['USB sleep', 'Driver timeout'],
        ),
        CaseRecord(
          id: '1031',
          symptom: 'VPN drops every 10 min',
          device: 'MacBook Air',
          status: 'Testing',
          evidence: ['IKEv2 tunnel resets'],
          pills: ['IKEv2', 'Keepalive'],
        ),
      ];
}
