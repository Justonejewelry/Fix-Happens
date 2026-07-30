class CaseRecord {
  CaseRecord({
    required this.id,
    required this.symptom,
    this.device = 'Field device',
    this.status = 'Diagnosing',
    this.closed = false,
    List<String>? evidence,
    List<String>? pills,
    List<String>? photoPaths,
    Map<String, bool>? verification,
    DateTime? openedAt,
  })  : evidence = evidence ?? <String>[],
        pills = pills ?? <String>[],
        photoPaths = photoPaths ?? <String>[],
        verification = verification ??
            {
              'evidence_recorded': false,
              'hypotheses_scored': false,
              'next_test_executed': false,
              'repair_verified': false,
            },
        openedAt = openedAt ?? DateTime.now();

  final String id;
  String symptom;
  String device;
  String status;
  bool closed;
  List<String> evidence;
  List<String> pills;
  List<String> photoPaths;
  Map<String, bool> verification;
  DateTime openedAt;

  int get verificationDone =>
      verification.values.where((v) => v).length;

  int get verificationTotal => verification.length;

  double get verificationProgress =>
      verificationTotal == 0 ? 0 : verificationDone / verificationTotal;

  Map<String, dynamic> toJson() => {
        'id': id,
        'symptom': symptom,
        'device': device,
        'status': status,
        'closed': closed,
        'evidence': evidence,
        'pills': pills,
        'photoPaths': photoPaths,
        'verification': verification,
        'openedAt': openedAt.toIso8601String(),
      };

  static CaseRecord fromJson(Map<String, dynamic> j) {
    final v = j['verification'];
    Map<String, bool> ver = {
      'evidence_recorded': false,
      'hypotheses_scored': false,
      'next_test_executed': false,
      'repair_verified': false,
    };
    if (v is Map) {
      v.forEach((key, value) {
        ver['$key'] = value == true;
      });
    }
    return CaseRecord(
      id: j['id'] as String,
      symptom: j['symptom'] as String? ?? '',
      device: j['device'] as String? ?? 'Field device',
      status: j['status'] as String? ?? 'Diagnosing',
      closed: j['closed'] as bool? ?? false,
      evidence: (j['evidence'] as List?)?.map((e) => '$e').toList() ?? [],
      pills: (j['pills'] as List?)?.map((e) => '$e').toList() ?? [],
      photoPaths: (j['photoPaths'] as List?)?.map((e) => '$e').toList() ?? [],
      verification: ver,
      openedAt: DateTime.tryParse(j['openedAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}
