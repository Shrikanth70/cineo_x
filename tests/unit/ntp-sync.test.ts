import { describe, it, expect } from 'vitest';
import { NtpClockSync } from '../../src/lib/ntp-sync';

describe('NtpClockSync', () => {
  it('calculates 0 offset when client and server clocks match exactly', () => {
    const ntp = new NtpClockSync(4);
    // t0 = 1000, serverTs = 1010, t3 = 1020 -> roundTrip = 20, midpoint = 1010, offset = 0
    const offset = ntp.recordSample(1000, 1010, 1020);
    expect(offset).toBe(0);
    expect(ntp.getOffsetMs()).toBe(0);
  });

  it('correctly tracks positive server clock offset using median of 4 samples', () => {
    const ntp = new NtpClockSync(4);
    // server is 500ms ahead
    ntp.recordSample(1000, 1510, 1020); // offset = 1510 - 1010 = 500
    ntp.recordSample(2000, 2515, 2030); // offset = 2515 - 2015 = 500
    ntp.recordSample(3000, 3505, 3010); // offset = 3505 - 3005 = 500
    ntp.recordSample(4000, 4520, 4040); // offset = 4520 - 4020 = 500

    expect(ntp.getOffsetMs()).toBe(500);
  });

  it('calculates drift against playing server state', () => {
    const ntp = new NtpClockSync(4);
    ntp.recordSample(10000, 10010, 10020); // 0 offset

    const serverPlayer = {
      playing: true,
      position: 10,
      rate: 1,
      serverTs: Date.now() - 5000, // 5 seconds elapsed
    };

    // Client is at 15s (perfect sync)
    const drift = ntp.computeDriftSeconds(15, serverPlayer);
    expect(Math.abs(drift)).toBeLessThan(0.1);
    expect(ntp.shouldCorrectDrift(drift, 0.4)).toBe(false);

    // Client is at 13s (2s behind)
    const largeDrift = ntp.computeDriftSeconds(13, serverPlayer);
    expect(largeDrift).toBeLessThan(-1.5);
    expect(ntp.shouldCorrectDrift(largeDrift, 0.4)).toBe(true);
  });
});

