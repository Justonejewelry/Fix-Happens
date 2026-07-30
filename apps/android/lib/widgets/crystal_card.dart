import 'dart:math' as math;

import 'package:flutter/material.dart';

const Color kAccent = Color(0xFFFF5AA5);
const Color kAccent2 = Color(0xFFC44DFF);

class AppGradientBackground extends StatelessWidget {
  const AppGradientBackground({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0B0D18),
            Color(0xFF151028),
            Color(0xFF261233),
            Color(0xFF1B1A2E),
          ],
        ),
      ),
      child: child,
    );
  }
}

class CrystalCard extends StatelessWidget {
  const CrystalCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withOpacity(0.14),
            Colors.white.withOpacity(0.06),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.22)),
        boxShadow: [
          BoxShadow(
            blurRadius: 28,
            color: Colors.black.withOpacity(0.28),
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: card,
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.icon, this.trailing});
  final String text;
  final IconData? icon;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 15, color: Colors.white54),
            const SizedBox(width: 6),
          ],
          Expanded(
            child: Text(
              text.toUpperCase(),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: Colors.white.withOpacity(0.6),
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class ChipLabel extends StatelessWidget {
  const ChipLabel(this.label, {super.key, this.icon});
  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: kAccent.withOpacity(0.16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: kAccent),
            const SizedBox(width: 4),
          ],
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.white70)),
        ],
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill(this.label, {super.key, this.accent = false, this.icon});
  final String label;
  final bool accent;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: accent ? kAccent.withOpacity(0.2) : Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: accent
              ? kAccent.withOpacity(0.45)
              : Colors.white.withOpacity(0.14),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: accent ? kAccent : Colors.white54),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: accent ? FontWeight.w700 : FontWeight.w500,
              color: accent ? const Color(0xFFFFC2DC) : Colors.white70,
            ),
          ),
        ],
      ),
    );
  }
}

class VerificationRing extends StatelessWidget {
  const VerificationRing({
    super.key,
    required this.progress,
    required this.label,
    this.size = 84,
  });

  final double progress; // 0..1
  final String label;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _RingPainter(progress.clamp(0.0, 1.0)),
        child: Center(
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 15,
              letterSpacing: -0.3,
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.progress);
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2 - 5;
    final bg = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7;
    canvas.drawCircle(c, r, bg);

    final rect = Rect.fromCircle(center: c, radius: r);
    final fg = Paint()
      ..shader = const SweepGradient(
        colors: [kAccent2, kAccent, kAccent2],
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7
      ..strokeCap = StrokeCap.round;

    canvas.save();
    canvas.translate(c.dx, c.dy);
    canvas.rotate(-math.pi / 2);
    canvas.translate(-c.dx, -c.dy);
    canvas.drawArc(rect, 0, 2 * math.pi * progress, false, fg);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) => old.progress != progress;
}

class StepStrip extends StatelessWidget {
  const StepStrip({super.key, required this.doneCount});
  final int doneCount; // 0..4

  static const _steps = [
    (Icons.description_outlined, 'Evidence'),
    (Icons.insights_outlined, 'Hypotheses'),
    (Icons.play_arrow_rounded, 'Test'),
    (Icons.verified_outlined, 'Verified'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(_steps.length, (i) {
        final done = i < doneCount;
        final active = i == doneCount || (doneCount >= 4 && i == 3);
        final s = _steps[i];
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: i == 3 ? 0 : 6),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
            decoration: BoxDecoration(
              color: done || active
                  ? kAccent.withOpacity(0.14)
                  : Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: active
                    ? kAccent.withOpacity(0.55)
                    : done
                        ? kAccent.withOpacity(0.35)
                        : Colors.white.withOpacity(0.12),
              ),
            ),
            child: Column(
              children: [
                Icon(
                  s.$1,
                  size: 18,
                  color: done || active ? kAccent : Colors.white38,
                ),
                const SizedBox(height: 4),
                Text(
                  s.$2,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: done || active
                        ? const Color(0xFFFFC2DC)
                        : Colors.white54,
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}

class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 40});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [kAccent, kAccent2],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(size * 0.32),
        boxShadow: [
          BoxShadow(
            color: kAccent.withOpacity(0.35),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Icon(Icons.build_circle_rounded, color: Colors.white, size: size * 0.55),
    );
  }
}
