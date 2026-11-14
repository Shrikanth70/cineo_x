'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PartyRoom } from '@/components/watch-party/PartyRoom';
import { JoinDialog } from '@/components/watch-party/JoinDialog';
import { safeStorage } from '@/lib/storage';
import { AvatarId } from '@shared/types';

export default function WatchPartyRoomRoute() {
  const params = useParams();
  const roomCode = ((params?.code as string) || '').toUpperCase();

  const [hasJoined, setHasJoined] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prefs = safeStorage.getUserPrefs();
    // If the user already has a saved nickname and previously agreed to rules, auto-join
    if (prefs.name && prefs.agreed18Plus) {
      setHasJoined(true);
    }
  }, []);

  const handleJoin = (name: string, avatar: AvatarId, agreed18Plus: boolean, movieModeMic: boolean) => {
    safeStorage.saveUserPrefs({ name, avatar, agreed18Plus, movieModeMic });
    safeStorage.addRecentParty({
      code: roomCode,
      title: 'Movie night',
      joinedAt: Date.now(),
    });
    setHasJoined(true);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="w-full">
      {!hasJoined ? (
        <JoinDialog
          partyTitle="Watch Party Room"
          roomCode={roomCode}
          onJoin={handleJoin}
        />
      ) : (
        <PartyRoom roomCode={roomCode} />
      )}
    </main>
  );
}

