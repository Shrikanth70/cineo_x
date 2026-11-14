/**
 * NTP-style Clock Synchronization
 * Calculates the clock offset between the client and server using a 4-sample median round-trip filter.
 * Offset = ((t1 - t0) + (t2 - t3)) / 2
 * where t0 = client send, t1 = server receive/timestamp, t2 = server send, t3 = client receive.
 * Simplified when server sends serverTs at t1~=t2:
 * offset = serverTs - (clientSendTs + clientReceiveTs) / 2
 * roundTrip = clientReceiveTs - clientSendTs
 */

export interface NtpSample {
  roundTripMs: number;
  offsetMs: number;
}

export class NtpClockSync {
  private samples: NtpSample[] = [];
  private readonly maxSamples: number;
  private currentOffsetMs: number = 0;

  constructor(maxSamples = 4) {
    this.maxSamples = maxSamples;
  }

  public recordSample(clientSendTs: number, serverTs: number, clientRecvTs: number): number {
    const roundTripMs = Math.max(0, clientRecvTs - clientSendTs);
    // Estimated time on client when server generated serverTs: clientSendTs + roundTrip / 2
    const clientMidpoint = clientSendTs + roundTripMs / 2;
    const offsetMs = serverTs - clientMidpoint;

    this.samples.push({ roundTripMs, offsetMs });
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    this.calculateMedianOffset();
    return this.currentOffsetMs;
  }

  private calculateMedianOffset(): void {
    if (this.samples.length === 0) {
      this.currentOffsetMs = 0;
      return;
    }

    // Sort by offset to find median
    const sorted = [...this.samples].sort((a, b) => a.offsetMs - b.offsetMs);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      this.currentOffsetMs = (sorted[mid - 1].offsetMs + sorted[mid].offsetMs) / 2;
    } else {
      this.currentOffsetMs = sorted[mid].offsetMs;
    }
  }

  public getOffsetMs(): number {
    return this.currentOffsetMs;
  }

  public getEstimatedServerTime(): number {
    return Date.now() + this.currentOffsetMs;
  }

  public computeDriftSeconds(
    clientMediaPosition: number,
    serverPlayerState: { playing: boolean; position: number; rate: number; serverTs: number }
  ): number {
    if (!serverPlayerState.playing) {
      return clientMediaPosition - serverPlayerState.position;
    }

    const currentServerTime = this.getEstimatedServerTime();
    const elapsedSeconds = Math.max(0, (currentServerTime - serverPlayerState.serverTs) / 1000);
    const expectedServerPosition = serverPlayerState.position + elapsedSeconds * (serverPlayerState.rate || 1);

    return clientMediaPosition - expectedServerPosition;
  }

  public shouldCorrectDrift(driftSeconds: number, thresholdSeconds = 0.4): boolean {
    return Math.abs(driftSeconds) > thresholdSeconds;
  }

  public reset(): void {
    this.samples = [];
    this.currentOffsetMs = 0;
  }
}

