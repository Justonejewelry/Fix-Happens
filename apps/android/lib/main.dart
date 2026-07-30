import 'package:flutter/material.dart';

import 'screens/case_list_screen.dart';

void main() => runApp(const FixHappensApp());

const Color kAccent = Color(0xFFFF5AA5);
const Color kBg = Color(0xFF111427);

class FixHappensApp extends StatelessWidget {
  const FixHappensApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Fix Happens',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: kAccent,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: kBg,
      ),
      home: const CaseListScreen(),
    );
  }
}
