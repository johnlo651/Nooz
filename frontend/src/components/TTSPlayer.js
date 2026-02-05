import React, { useState } from 'react';
import { useTTS } from '../utils/tts';
import { Headphones, Pause, Play, X, Volume2 } from 'lucide-react';

export const TTSPlayer = () => {
  const { 
    isPlaying, 
    isPaused, 
    currentArticle, 
    playbackRate, 
    selectedVoice,
    voices,
    progress, 
    pause, 
    resume, 
    stop,
    changeRate,
    changeVoice
  } = useTTS();

  const [showControls, setShowControls] = useState(false);

  if (!isPlaying && !currentArticle) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card backdrop-blur-sm">
      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div 
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Article info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Headphones className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs uppercase text-primary mb-1">NOW PLAYING</p>
              <p className="font-heading text-sm font-bold truncate">
                {currentArticle?.title}
              </p>
              <p className="terminal-text text-muted-foreground">
                {currentArticle?.source_name}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={isPaused ? resume : pause}
              className="p-2 hover:bg-secondary rounded-none transition-colors duration-150"
              data-testid="tts-play-pause"
            >
              {isPaused ? (
                <Play className="h-5 w-5 fill-current" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
            </button>

            {/* Speed control */}
            <div className="relative">
              <button
                onClick={() => setShowControls(!showControls)}
                className="px-3 py-2 border border-border hover:border-primary transition-colors duration-150 terminal-text"
                data-testid="tts-speed-button"
              >
                {playbackRate}x
              </button>

              {showControls && (
                <div className="absolute bottom-full right-0 mb-2 border border-border bg-card p-4 min-w-[280px]">
                  <div className="mb-4">
                    <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">
                      PLAYBACK SPEED
                    </label>
                    <div className="flex gap-2">
                      {[0.75, 1.0, 1.25, 1.5].map(rate => (
                        <button
                          key={rate}
                          onClick={() => changeRate(rate)}
                          className={`px-3 py-2 border terminal-text transition-colors duration-150 ${
                            playbackRate === rate
                              ? 'border-primary bg-primary text-black'
                              : 'border-border hover:border-primary'
                          }`}
                          data-testid={`speed-${rate}`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-xs uppercase mb-2 block text-muted-foreground">
                      VOICE
                    </label>
                    <select
                      value={selectedVoice?.voiceURI || ''}
                      onChange={(e) => {
                        const voice = voices.find(v => v.voiceURI === e.target.value);
                        if (voice) changeVoice(voice);
                      }}
                      className="input-brutal w-full text-sm"
                      data-testid="voice-select"
                    >
                      {voices
                        .filter(v => v.lang.startsWith('en'))
                        .map(voice => (
                          <option key={voice.voiceURI} value={voice.voiceURI}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Stop */}
            <button
              onClick={stop}
              className="p-2 hover:bg-secondary hover:text-destructive transition-colors duration-150"
              data-testid="tts-stop"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
