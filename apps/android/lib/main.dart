import 'package:flutter/material.dart';

import 'screens/home_shell.dart';
import 'services/diagnostic_engine.dart';
import 'services/field_tips_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await DiagnosticEngine.ensureLoaded();
  await FieldTipsService.ensureLoaded();
  runApp(const FixHappensApp());
}

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
        navigationBarTheme: NavigationBarThemeData(
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: kAccent,
              );
            }
            return const TextStyle(fontSize: 12, color: Colors.white54);
          }),
        ),
      ),
      home: const HomeShell(),
    );
  }
}
