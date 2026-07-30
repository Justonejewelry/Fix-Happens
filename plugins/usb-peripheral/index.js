/**
 * USB & Peripheral Diagnostics plugin.
 * Pure function: returns suggestions only (no shell execution).
 * Covers hubs, HID devices, external storage, enumeration, and sleep disconnects.
 */

function diagnose(context) {
  const text = [context.symptom || '', ...(context.evidence || [])]
    .join('\n')
    .toLowerCase();

  const hypotheses = [];
  const tips = [];
  const nextTests = [];

  if (/usb|peripheral|keyboard|mouse|trackpad|hub|dongle|thunderbolt|external device|not recognized|device not found|kext|hid/.test(text)) {
    if (/not recognized|not detected|enumeration|no device|device removed|disconnect/.test(text)) {
      hypotheses.push({ cause: 'USB Device Not Enumerated', confidenceBoost: 20 });
      nextTests.push('system_profiler SPUSBDataType');
      nextTests.push('ioreg -p IOUSB -w0');
      tips.push('Unplug everything, then re-attach one device at a time while watching system_profiler.');
    }

    if (/hub|powered hub|bus power|insufficient power|over current/.test(text)) {
      hypotheses.push({ cause: 'USB Hub Power Issue', confidenceBoost: 18 });
      nextTests.push('system_profiler SPUSBDataType');
      tips.push('Bus-powered hubs frequently fail with multiple devices; switch to a powered hub.');
    }

    if (/keyboard|mouse|trackpad|hid|input|not responding|ghost clicks/.test(text)) {
      hypotheses.push({ cause: 'HID Device Conflict', confidenceBoost: 16 });
      nextTests.push('system_profiler SPUSBDataType');
      nextTests.push('ioreg -l | grep -i HID');
      tips.push('Bluetooth and USB HID devices can fight; try disabling Bluetooth temporarily.');
    }

    if (/sleep|wake|disconnect after sleep|drops after lid|usb sleep/.test(text)) {
      hypotheses.push({ cause: 'USB Sleep Disconnect', confidenceBoost: 17 });
      nextTests.push('pmset -g');
      nextTests.push('system_profiler SPUSBDataType');
      tips.push('Some devices lose power on sleep; test with pmset disabling USB sleep or a powered hub.');
    }

    if (/thunderbolt|tb3|tb4|bridge|dock|displaylink/.test(text)) {
      hypotheses.push({ cause: 'Thunderbolt Bridge Failure', confidenceBoost: 15 });
      nextTests.push('system_profiler SPThunderboltDataType');
      nextTests.push('system_profiler SPUSBDataType');
      tips.push('Thunderbolt docks often need a full power cycle of both Mac and dock after firmware updates.');
    }

    if (hypotheses.length === 0) {
      hypotheses.push({ cause: 'USB Device Not Enumerated', confidenceBoost: 10 });
      nextTests.push('system_profiler SPUSBDataType');
      tips.push('Start with system_profiler SPUSBDataType to see the current USB tree.');
    }
  }

  return { hypotheses, tips, nextTests };
}

module.exports = {
  id: 'usb-peripheral',
  name: 'USB & Peripheral Diagnostics',
  version: '1.0.0',
  description: 'Suggests hypotheses and tests for USB hubs, HID devices, enumeration failures, and sleep disconnects',
  diagnose
};
