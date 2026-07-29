function run(context = {}) {
  return {
    success: true,
    plugin: 'example-network',
    context,
    findings: [
      {
        cause: 'DHCP Failure',
        confidence: 92,
        nextTest: 'ipconfig getifaddr en0'
      },
      {
        cause: 'Network Preference Corruption',
        confidence: 78,
        nextTest: 'networksetup -getinfo Wi-Fi'
      }
    ]
  };
}

module.exports = { run };
