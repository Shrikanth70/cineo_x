import { describe, it, expect } from 'vitest';
import { ClientMessageSchema, ClientJoinSchema } from '../../packages/shared/protocol';

describe('Realtime Protocol Schema Validation', () => {
  it('validates a correct join message', () => {
    const valid = {
      type: 'join',
      roomCode: 'CIN-ABCD-1234',
      participantId: 'p-1',
      name: 'Alex',
      avatar: 'popcorn',
      agreed18Plus: true,
      movieModeMic: false,
    };
    const parsed = ClientMessageSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects join message if agreed18Plus is false or missing', () => {
    const invalid = {
      type: 'join',
      roomCode: 'CIN-ABCD-1234',
      participantId: 'p-1',
      name: 'Alex',
      avatar: 'popcorn',
      agreed18Plus: false,
    };
    const parsed = ClientJoinSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates play, pause, and seek payloads', () => {
    expect(ClientMessageSchema.safeParse({ type: 'play', position: 42.5 }).success).toBe(true);
    expect(ClientMessageSchema.safeParse({ type: 'pause', position: 42.5 }).success).toBe(true);
    expect(ClientMessageSchema.safeParse({ type: 'seek', position: 100 }).success).toBe(true);
  });

  it('validates countdown start with positive duration', () => {
    const valid = { type: 'countdown:start', durationSeconds: 3 };
    expect(ClientMessageSchema.safeParse(valid).success).toBe(true);
  });

  it('validates chat message length bounds', () => {
    expect(ClientMessageSchema.safeParse({ type: 'chat', text: 'Hello world' }).success).toBe(true);
    expect(ClientMessageSchema.safeParse({ type: 'chat', text: '' }).success).toBe(false);
  });
});

