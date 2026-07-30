class CaseRecord {
  CaseRecord({
    required this.id,
    required this.symptom,
    this.device = 'Field device',
    this.status = 'Diagnosing',
    this.closed = false,
    List<String>? evidence,
    List<String>? pills,
    DateTime? openedAt,
  })  : evidence = evidence ?? <String>[],
        pills = pills ?? <String>[],
        openedAt = openedAt ?? DateTime.now();

  final String id;
  String symptom;
  String device;
  String status;
  bool closed;
  List<String> evidence;
  List<String> pills;
  DateTime openedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'symptom': symptom,
        'device': device,
        'status': status,
        'closed': closed,
        'evidence': evidence,
        'pills': pills,
        'openedAt': openedAt.toIso8601String(),
      };

  static CaseRecord fromJson(Map<String, dynamic> j) => CaseRecord(
        id: j['id'] as String,
        symptom: j['symptom'] as String? ?? '',
        device: j['device'] as String? ?? 'Field device',
        status: j['status'] as String? ?? 'Diagnosing',
        closed: j['closed'] as bool? ?? false,
        evidence: (j['evidence'] as List?)?.map((e) => '$e').toList() ?? [],
        pills: (j['pills'] as List?)?.map((e) => '$e').toList() ?? [],
        openedAt: DateTime.tryParse(j['openedAt'] as String? ?? '') ??
            DateTime.now(),
      );
}
