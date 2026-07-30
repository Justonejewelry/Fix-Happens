/**
 * Storage & Disk Diagnostics plugin.
 * Pure function: returns suggestions only (no shell execution).
 * Covers free space, APFS, SMART, external drives, and I/O failures.
 */

function diagnose(context) {
  const text = [context.symptom || '', ...(context.evidence || [])]
    .join('\n')
    .toLowerCase();

  const hypotheses = [];
  const tips = [];
  const nextTests = [];

  if (/disk|storage|space|volume|apfs|ssd|hdd|mount|eject|smart|i\/o|io error|full|capacity/.test(text)) {
    if (/full|out of space|no space|disk space|capacity|100%|df /.test(text)) {
      hypotheses.push({ cause: 'Disk Space Critical', confidenceBoost: 24 });
      nextTests.push('df -h');
      nextTests.push('du -sh ~/Library/Caches');
      tips.push('Check both root and Data volumes on modern macOS; local snapshots can hide free space.');
    }

    if (/apfs|snapshot|local snapshot|tmutil|thin|purgeable/.test(text)) {
      hypotheses.push({ cause: 'APFS Snapshot Bloat', confidenceBoost: 18 });
      nextTests.push('tmutil listlocalsnapshots /');
      nextTests.push('diskutil apfs list');
      tips.push('Local Time Machine snapshots can consume tens of GB; thin them with tmutil deletelocalsnapshots.');
    }

    if (/smart|failing|reallocated|pending sector|unrecoverable|health/.test(text)) {
      hypotheses.push({ cause: 'SMART Failure Warning', confidenceBoost: 20 });
      nextTests.push('diskutil info /');
      nextTests.push('system_profiler SPStorageDataType');
      tips.push('Treat any SMART failure prediction as urgent; back up and replace before further writes.');
    }

    if (/external|usb drive|thunderbolt|not mounting|ejected improperly|unmount/.test(text)) {
      hypotheses.push({ cause: 'External Volume Mount Failure', confidenceBoost: 16 });
      nextTests.push('diskutil list');
      nextTests.push('system_profiler SPStorageDataType');
      tips.push('Check Disk Utility First Aid and whether the volume is APFS encrypted or HFS+ journaled.');
    }

    if (/i\/o error|input\/output|read error|write error|media error/.test(text)) {
      hypotheses.push({ cause: 'Storage I/O Error', confidenceBoost: 18 });
      nextTests.push('diskutil verifyVolume /');
      nextTests.push('log show --predicate \'eventMessage contains "I/O"\' --last 30m');
      tips.push('I/O errors often precede complete failure; prioritize data recovery over repair.');
    }

    if (hypotheses.length === 0) {
      hypotheses.push({ cause: 'Disk Space Critical', confidenceBoost: 10 });
      nextTests.push('df -h');
      nextTests.push('diskutil list');
      tips.push('Start with df -h and diskutil list to establish free space and volume layout.');
    }
  }

  return { hypotheses, tips, nextTests };
}

module.exports = {
  id: 'storage-disk',
  name: 'Storage & Disk Diagnostics',
  version: '1.0.0',
  description: 'Suggests hypotheses and tests for disk space, APFS snapshots, SMART, external volumes, and I/O errors',
  diagnose
};
