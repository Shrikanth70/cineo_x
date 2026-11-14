'use client';

import React, { useState, useEffect } from 'react';
import { Hand, Maximize, Minimize, PictureInPicture2, Users, Volume2, VolumeX } from 'lucide-react';

export interface ControlDockProps {
  handRaised: boolean;
  onToggleHand: () => void;
  onToggleParticipants: () => void;
  participantsOpen: boolean;
  participantCount: number;
}

export function ControlDock({
  handRaised,
  onToggleHand,
  onToggleParticipants,
  participantsOpen,
  participantCount,
}: ControlDockProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPipSupported(Boolean(document.pictureInPictureEnabled));
    }
  }, []);

  const handleToggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleTogglePip = () => {
    if (typeof document === 'undefined') return;
    const video = document.querySelector('video');
    if (!video) return;

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture?.().catch(() => {});
    } else if (video.requestPictureInPicture) {
      video.requestPictureInPicture().catch(() => {});
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    const video = document.querySelector('video');
    if (video) {
      video.muted = !muted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    const video = document.querySelector('video');
    if (video) {
      video.volume = val;
      video.muted = val === 0;
    }
  };

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border-hairline bg-surface/90 backdrop-blur-md px-2.5 py-1.5 shadow-lg">
      {/* Raise Hand Toggle */}
      <button
        onClick={onToggleHand}
        title={handRaised ? 'Lower Hand' : 'Raise Hand'}
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
          handRaised
            ? 'bg-amber-accent text-background font-bold shadow-glow'
            : 'text-zinc-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <Hand className="h-4 w-4" />
      </button>

      {/* Picture in Picture */}
      {pipSupported && (
        <button
          onClick={handleTogglePip}
          title="Picture in Picture"
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <PictureInPicture2 className="h-4 w-4" />
        </button>
      )}

      {/* Volume Slider Drawer */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        <button
          onClick={toggleMute}
          title={muted ? 'Unmute' : 'Mute'}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          {muted || volume === 0 ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
        </button>
        {showVolumeSlider && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-24 rounded-lg bg-surface-elevated p-2 shadow-xl border border-border-hairline">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full accent-amber-accent"
            />
          </div>
        )}
      </div>

      {/* Participants Toggle */}
      <button
        onClick={onToggleParticipants}
        title="Toggle Participants Panel"
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
          participantsOpen
            ? 'bg-white/20 text-white'
            : 'text-zinc-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <Users className="h-4 w-4" />
        <span className="sr-only">Participants ({participantCount})</span>
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={handleToggleFullscreen}
        title="Toggle Fullscreen"
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
    </div>
  );
}

