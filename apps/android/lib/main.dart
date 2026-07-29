import 'package:flutter/material.dart';

void main() => runApp(const FixHappensApp());

class FixHappensApp extends StatelessWidget {
  const FixHappensApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fix Happens',
      home: Scaffold(
        appBar: AppBar(title: const Text('Fix Happens')),
        body: const Center(
          child: Text('Shit breaks. Fix Happens.'),
        ),
      ),
    );
  }
}
