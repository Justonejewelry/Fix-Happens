import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../models/case_record.dart';

/// Schema-aligned SQLite store (see database/schema.sql).
class SqliteStore {
  Database? _db;

  Future<Database> get db async {
    if (_db != null) return _db!;
    final dir = await getDatabasesPath();
    final path = p.join(dir, 'fixhappens.db');
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            platform TEXT,
            notes TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id INTEGER,
            symptom TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'New',
            device TEXT,
            closed INTEGER NOT NULL DEFAULT 0,
            pills TEXT,
            verification TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            evidence_type TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE hypotheses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            cause TEXT NOT NULL,
            confidence INTEGER NOT NULL,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE repair_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            resolution TEXT NOT NULL,
            verified INTEGER NOT NULL DEFAULT 0,
            created_at TEXT
          )
        ''');
        await _seed(db);
      },
    );
    return _db!;
  }

  Future<void> _seed(Database db) async {
    final now = DateTime.now().toIso8601String();
    final caseId = await db.insert('cases', {
      'symptom': 'Wi-Fi connected but no internet',
      'status': 'Investigating',
      'device': 'MacBook Pro',
      'closed': 0,
      'pills': 'No route to host,No IP assigned',
      'verification':
          '{"evidence_recorded":true,"hypotheses_scored":true,"next_test_executed":false,"repair_verified":false}',
      'created_at': now,
    });
    await db.insert('evidence', {
      'case_id': caseId,
      'evidence_type': 'Observation',
      'value': 'Wi-Fi shows connected, no internet access',
      'created_at': now,
    });
    await db.insert('evidence', {
      'case_id': caseId,
      'evidence_type': 'Command Output',
      'value': 'no route to host',
      'created_at': now,
    });
  }

  Future<List<CaseRecord>> listOpenCases() async {
    final database = await db;
    final rows = await database.query(
      'cases',
      where: 'closed = 0',
      orderBy: 'id DESC',
    );
    final out = <CaseRecord>[];
    for (final r in rows) {
      out.add(await _toCase(database, r));
    }
    return out;
  }

  Future<CaseRecord> _toCase(Database database, Map<String, Object?> r) async {
    final id = r['id'] as int;
    final ev = await database.query(
      'evidence',
      where: 'case_id = ?',
      whereArgs: [id],
    );
    final evidence = ev.map((e) => '${e['value']}').toList();
    final pills = (r['pills'] as String?)?.split(',') ?? [];
    Map<String, bool> ver = {
      'evidence_recorded': false,
      'hypotheses_scored': false,
      'next_test_executed': false,
      'repair_verified': false,
    };
    // verification stored as simple flags in JSON-ish string — parse lightly
    final vs = r['verification'] as String? ?? '';
    for (final k in ver.keys) {
      if (vs.contains('"$k":true')) ver[k] = true;
    }
    return CaseRecord(
      id: '$id',
      symptom: r['symptom'] as String? ?? '',
      device: r['device'] as String? ?? 'Field device',
      status: r['status'] as String? ?? 'New',
      closed: (r['closed'] as int? ?? 0) == 1,
      evidence: evidence,
      pills: pills.where((p) => p.isNotEmpty).toList(),
      verification: ver,
      openedAt: DateTime.tryParse(r['created_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  Future<CaseRecord> createCase(String symptom, {String device = 'Field device'}) async {
    final database = await db;
    final now = DateTime.now().toIso8601String();
    final id = await database.insert('cases', {
      'symptom': symptom,
      'status': 'New',
      'device': device,
      'closed': 0,
      'pills': '',
      'verification':
          '{"evidence_recorded":false,"hypotheses_scored":false,"next_test_executed":false,"repair_verified":false}',
      'created_at': now,
    });
    return CaseRecord(
      id: '$id',
      symptom: symptom,
      device: device,
      status: 'New',
    );
  }

  Future<void> closeCase(String id, {String resolution = ''}) async {
    final database = await db;
    final now = DateTime.now().toIso8601String();
    await database.update(
      'cases',
      {
        'closed': 1,
        'status': 'Resolved',
        'verification':
            '{"evidence_recorded":true,"hypotheses_scored":true,"next_test_executed":true,"repair_verified":true}',
      },
      where: 'id = ?',
      whereArgs: [int.parse(id)],
    );
    if (resolution.isNotEmpty) {
      await database.insert('repair_history', {
        'case_id': int.parse(id),
        'resolution': resolution,
        'verified': 1,
        'created_at': now,
      });
    }
  }

  Future<void> addEvidence(String caseId, String type, String value) async {
    final database = await db;
    await database.insert('evidence', {
      'case_id': int.parse(caseId),
      'evidence_type': type,
      'value': value,
      'created_at': DateTime.now().toIso8601String(),
    });
    await database.update(
      'cases',
      {'status': 'Investigating'},
      where: 'id = ? AND status = ?',
      whereArgs: [int.parse(caseId), 'New'],
    );
  }
}
