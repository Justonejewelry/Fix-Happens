/**
 * Power & Sleep Diagnostics plugin.
 * Pure function: returns suggestions only (no shell execution).
 * Targets MacBook sleep/wake, battery, clamshell, and assertion problems.
 */

function diagnose(context) {
  const text = [context.symptom || '', ...(context.evidence || [])]
    .join('\n')
    .toLowerCase();

  const hypotheses = [];
  const tips = [];
  const nextTests = [];

  if (/sleep|wake|power|battery|clamshell|lid|hibernate|pmset|power nap|dark wake/.test(text)) {
    if (/won't sleep|prevent sleep|assertion|caffeinate|no sleep/.test(text)) {
      hypotheses.push({ cause: 'Sleep Prevention Assertion', confidenceBoost: 20 });
      nextTests.push('pmset -g assertions');
      nextTests.push('pmset -g');
      tips.push('Look for PreventUserIdleSystemSleep or PreventSystemSleep assertions from apps or kernel extensions.');
    }

    if (/won't wake|black screen after wake|stuck on wake|kernel panic on wake/.test(text)) {
      hypotheses.push({ cause: 'Power / Sleep Issue', confidenceBoost: 22 });
      nextTests.push('pmset -g');
      nextTests.push('log show --predicate \'eventMessage contains "Wake"\' --last 1h');
      tips.push('SMC and NVRAM resets remain high-value after collecting assertion and power logs.');
    }

    if (/battery|drain|percentage|cycle count|health|not charging/.test(text)) {
      hypotheses.push({ cause: 'Battery Health / Calibration', confidenceBoost: 16 });
      nextTests.push('system_profiler SPPowerDataType');
      nextTests.push('pmset -g batt');
      tips.push('Check cycle count and condition; sudden drops after wake often point to calibrated capacity mismatch.');
    }

    if (/clamshell|closed lid|external display only|lid closed/.test(text)) {
      hypotheses.push({ cause: 'Clamshell Mode Conflict', confidenceBoost: 18 });
      nextTests.push('pmset -g');
      nextTests.push('system_profiler SPDisplaysDataType');
      tips.push('Clamshell requires power + external display + external keyboard/mouse (or approved dongle).');
    }

    if (/power nap|dark wake|background activity|network while asleep/.test(text)) {
      hypotheses.push({ cause: 'Power Nap Interference', confidenceBoost: 14 });
      nextTests.push('pmset -g');
      tips.push('Disable Power Nap on battery and AC if unexpected network or disk activity occurs during sleep.');
    }

    if (hypotheses.length === 0) {
      hypotheses.push({ cause: 'Power / Sleep Issue', confidenceBoost: 12 });
      nextTests.push('pmset -g');
      nextTests.push('pmset -g assertions');
      tips.push('Start with pmset -g assertions to see what is holding the system awake.');
    }
  }

  return { hypotheses, tips, nextTests };
}

module.exports = {
  id: 'power-sleep',
  name: 'Power & Sleep Diagnostics',
  version: '1.0.0',
  description: 'Suggests hypotheses and tests for sleep/wake, battery, clamshell, and Power Nap failures',
  diagnose
};
