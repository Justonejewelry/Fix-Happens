/**
 * Display & Graphics Diagnostics plugin.
 * Pure function: returns suggestions only (no shell execution).
 * Targets external displays, GPU resets, scaling, and brightness problems.
 */

function diagnose(context) {
  const text = [context.symptom || '', ...(context.evidence || [])]
    .join('\n')
    .toLowerCase();

  const hypotheses = [];
  const tips = [];
  const nextTests = [];

  if (/display|monitor|screen|gpu|graphics|resolution|brightness|external|hdmi|displayport|thunderbolt display|black screen|no signal|night shift|true tone/.test(text)) {
    if (/black screen|no signal|blank|won't detect|external not detected/.test(text)) {
      hypotheses.push({ cause: 'External Display Handshake Failure', confidenceBoost: 22 });
      nextTests.push('system_profiler SPDisplaysDataType');
      nextTests.push('ioreg -l | grep -i display');
      tips.push('Power-cycle the monitor and cable; many handshake failures clear after a full power drain.');
    }

    if (/gpu|hang|reset|kernel|window server|spinning|freeze|graphics/.test(text)) {
      hypotheses.push({ cause: 'GPU Hang / Reset', confidenceBoost: 20 });
      nextTests.push('log show --predicate \'eventMessage contains "GPU"\' --last 1h');
      nextTests.push('system_profiler SPDisplaysDataType');
      tips.push('Repeated GPU resets often indicate thermal throttling or a failing dGPU/eGPU path.');
    }

    if (/resolution|scaling|retina|looks zoomed|blurry|wrong size/.test(text)) {
      hypotheses.push({ cause: 'Resolution / Scaling Mismatch', confidenceBoost: 16 });
      nextTests.push('system_profiler SPDisplaysDataType');
      tips.push('Prefer default for display; custom scaled resolutions can trigger WindowServer instability.');
    }

    if (/brightness|dim|night shift|true tone|auto brightness|too dark|too bright/.test(text)) {
      hypotheses.push({ cause: 'Brightness / True Tone Conflict', confidenceBoost: 14 });
      nextTests.push('defaults read /Library/Preferences/com.apple.windowserver.plist');
      tips.push('Disable Night Shift and True Tone temporarily to isolate ambient light sensor issues.');
    }

    if (/cable|adapter|dongle|usb-c|hdmi|displayport|hub/.test(text)) {
      hypotheses.push({ cause: 'Display Cable / Port Issue', confidenceBoost: 15 });
      nextTests.push('system_profiler SPDisplaysDataType');
      tips.push('Test with a known-good cable and direct port (bypass hubs) before concluding the GPU is at fault.');
    }

    if (hypotheses.length === 0) {
      hypotheses.push({ cause: 'External Display Handshake Failure', confidenceBoost: 10 });
      nextTests.push('system_profiler SPDisplaysDataType');
      tips.push('Start with system_profiler SPDisplaysDataType to see which displays the OS currently detects.');
    }
  }

  return { hypotheses, tips, nextTests };
}

module.exports = {
  id: 'display-graphics',
  name: 'Display & Graphics Diagnostics',
  version: '1.0.0',
  description: 'Suggests hypotheses and tests for external monitors, GPU hangs, resolution, and brightness problems',
  diagnose
};
