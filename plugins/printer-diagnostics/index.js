/**
 * Printer Diagnostics plugin.
 * Pure function: returns suggestions only (no shell execution).
 * Covers CUPS, queues, offline state, drivers, and common field printer failures.
 */

function diagnose(context) {
  const text = [context.symptom || '', ...(context.evidence || [])]
    .join('\n')
    .toLowerCase();

  const hypotheses = [];
  const tips = [];
  const nextTests = [];

  if (/printer|print|cups|spool|queue|laserjet|inkjet|airprint/.test(text)) {
    if (/offline|not accepting|paused|held|stopped/.test(text)) {
      hypotheses.push({ cause: 'Printer Offline', confidenceBoost: 22 });
      nextTests.push('lpstat -p');
      nextTests.push('lpstat -o');
      tips.push('Check whether the queue is paused before reinstalling the driver.');
    }

    if (/driver|timeout|kext|ppd|filter failed/.test(text)) {
      hypotheses.push({ cause: 'Driver Timeout', confidenceBoost: 18 });
      nextTests.push('system_profiler SPUSBDataType');
      tips.push('USB sleep can drop printers after wake — test immediately after lid open.');
    }

    if (/usb|cable|hub|not recognized|device not found/.test(text)) {
      hypotheses.push({ cause: 'USB Printer Disconnect', confidenceBoost: 16 });
      nextTests.push('system_profiler SPUSBDataType');
      tips.push('Try a powered USB hub or different port; many printers brown-out on bus power.');
    }

    if (/network|ip|ping|unreachable|bonjour|airprint/.test(text)) {
      hypotheses.push({ cause: 'Network Printer Unreachable', confidenceBoost: 15 });
      nextTests.push('ping <printer-ip>');
      nextTests.push('dns-sd -B _ipp._tcp');
      tips.push('Confirm the printer is on the same VLAN and that mDNS is not blocked.');
    }

    if (/queue full|spool|too many jobs|filter/.test(text)) {
      hypotheses.push({ cause: 'CUPS Queue Corruption', confidenceBoost: 14 });
      nextTests.push('lpstat -o');
      nextTests.push('cupsctl');
      tips.push('Clear stuck jobs with cancel -a before restarting cupsd.');
    }

    // Generic printer fallback if none of the above matched strongly
    if (hypotheses.length === 0) {
      hypotheses.push({ cause: 'Printer Offline', confidenceBoost: 12 });
      nextTests.push('lpstat -p');
      tips.push('Start with lpstat -p to see acceptance state before deeper steps.');
    }
  }

  return { hypotheses, tips, nextTests };
}

module.exports = {
  id: 'printer-diagnostics',
  name: 'Printer Diagnostics',
  version: '1.0.0',
  description: 'Suggests hypotheses and tests for CUPS, offline printers, drivers, and USB/network print failures',
  diagnose
};
