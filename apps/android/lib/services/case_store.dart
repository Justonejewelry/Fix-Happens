import '../models/case_record.dart';
import 'sqlite_store.dart';

class CaseStoreException implements Exception {
  CaseStoreException(this.message, [this.cause]);
  final String message;
  final Object? cause;

  @override
  String toString() => cause == null
      ? 'CaseStoreException: $message'
      : 'CaseStoreException: $message ($cause)';
}

/// Primary store: SQLite. No SharedPreferences for case data.
class CaseStore {
  final SqliteStore _sqlite = SqliteStore();

  Future<List<CaseRecord>> load() async {
    try {
      return await _sqlite.listOpenCases();
    } catch (e) {
      throw CaseStoreException(
        'Could not load cases from SQLite. '
        'Try: adb shell pm clear <applicationId>',
        e,
      );
    }
  }

  /// Full list reload after mutations (SQLite is source of truth).
  Future<void> save(List<CaseRecord> cases) async {
    // no-op: mutations go through create/close/addEvidence
  }

  Future<CaseRecord> create({equired String symptom, String device = 'Field device'}) async {
    try {
      return await _sqlite.createCase(symptom, device: device);
    } catch (e) {
      throw CaseStoreException('Could not create case', e);
    }
  }

  Future<void> closeCase(String id, {String resolution = ''}) async {
    try {
      await _sqlite.closeCase(id, resolution: resolution);
    } catch (e) {
      throw CaseStoreException('Could not close case', e);
    }
  }

  Future<void> addEvidence(String caseId, String type, String value) async {
    try {
      await _sqlite.addEvidence(caseId, type, value);
    } catch (e) {
      throw CaseStoreException('Could not add evidence', e);
    }
  }

  Future<CaseRecord?> getCase(String id) async {
    final all = await load();
    try {
      return all.firstWhere((c) => c.id == id);
    } catch (_) {
      return null;
    }
  }
}
