import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  CloudCheck,
  CloudUpload,
  AlertCircle,
  Video,
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react';
import api from '../../lib/api';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubeLessonPlayerProps {
  lessonId: string;
  courseId: string;
  userId: string;
  videoUrl?: string | null;
  lessonTitle: string;
  durationMinutes?: number;
  initialProgressSeconds?: number;
  initialProgressPercent?: number;
  initialIsCompleted?: boolean;
  completionThresholdPercent?: number; // default 90
  onProgressUpdate?: (percent: number, seconds: number) => void;
  onLessonCompleted?: (lessonId: string) => void;
}

export function extractYouTubeId(urlOrId?: string | null): string {
  if (!urlOrId) return 'M7lc1UVf-VE';
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : 'M7lc1UVf-VE';
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const PRESET_VIDEOS = [
  { id: 'M7lc1UVf-VE', label: 'Cooperative Training Stream 1 (NCCT Standard)' },
  { id: 'aqz-KE-bpKQ', label: 'Quality Testing Video Stream 2 (High Definition)' },
  { id: 'jNQXAC9IVRw', label: 'Field Operations Stream 3' },
];

export const YouTubeLessonPlayer: React.FC<YouTubeLessonPlayerProps> = ({
  lessonId,
  courseId,
  userId,
  videoUrl,
  lessonTitle,
  durationMinutes = 15,
  initialProgressSeconds = 0,
  initialProgressPercent = 0,
  initialIsCompleted = false,
  completionThresholdPercent = 90,
  onProgressUpdate,
  onLessonCompleted,
}) => {
  const playerRef = useRef<any>(null);
  const playerElementId = useRef(`yt-player-${lessonId}-${Math.random().toString(36).slice(2, 7)}`);
  const progressIntervalRef = useRef<any>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);

  // Allow custom video ID or preset switcher
  const [activeVideoId, setActiveVideoId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`ss_vid_${lessonId}`);
      if (saved) return saved;
    } catch (e) {}
    const extracted = extractYouTubeId(videoUrl);
    // If extracted is the blocked rickroll video, fallback to aqz-KE-bpKQ or M7lc1UVf-VE
    if (extracted === 'ysz5S6PUM-U') return 'aqz-KE-bpKQ';
    return extracted;
  });

  const [showVideoSwitcher, setShowVideoSwitcher] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [hasFallbackTriggered, setHasFallbackTriggered] = useState(false);

  const [currentTime, setCurrentTime] = useState<number>(initialProgressSeconds);
  const [duration, setDuration] = useState<number>(durationMinutes * 60);
  const [progressPercent, setProgressPercent] = useState<number>(initialProgressPercent);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(initialIsCompleted);
  const [playerState, setPlayerState] = useState<string>('UNSTARTED');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'offline_saved' | 'error'>('idle');
  const [hasResumed, setHasResumed] = useState<boolean>(false);
  const [resumedAtTime, setResumedAtTime] = useState<number | null>(null);

  const isCompletedRef = useRef(isCompleted);
  isCompletedRef.current = isCompleted;

  // ─── Save Progress to Backend ──────────────────────────────────────────
  const saveProgressToBackend = useCallback(
    async (curTime: number, totalDur: number, forceCompleted?: boolean) => {
      if (isSavingRef.current) return;
      if (!Number.isFinite(curTime) || curTime < 0) return;

      const calcPercent = totalDur > 0 ? Math.min(100, Math.round((curTime / totalDur) * 100)) : 0;
      const willBeCompleted = isCompletedRef.current || forceCompleted || calcPercent >= completionThresholdPercent;

      isSavingRef.current = true;
      setSyncStatus('saving');

      // Offline storage backup
      const storageKey = `ss_lp_${userId}_${lessonId}`;
      const payload = {
        progressSeconds: Math.round(curTime),
        progressPercent: willBeCompleted ? Math.max(calcPercent, 90) : calcPercent,
        completed: willBeCompleted,
        lastWatchedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (e) {}

      try {
        await api.learning.saveLessonProgress(lessonId, {
          progressSeconds: Math.round(curTime),
          progressPercent: payload.progressPercent,
          completed: willBeCompleted,
        });

        setSyncStatus('saved');
        setTimeout(() => setSyncStatus(prev => prev === 'saved' ? 'idle' : prev), 3000);

        if (willBeCompleted) {
          setIsCompleted(true);
          isCompletedRef.current = true;
          onLessonCompleted?.(lessonId);
        }
      } catch (err) {
        console.warn('[YouTubeLessonPlayer] Save failed, fallback to offline:', err);
        setSyncStatus('offline_saved');
      } finally {
        isSavingRef.current = false;
        lastSavedTimeRef.current = Date.now();
      }
    },
    [lessonId, userId, completionThresholdPercent, onLessonCompleted]
  );

  // Sync state when props change
  useEffect(() => {
    setIsCompleted(initialIsCompleted);
    isCompletedRef.current = initialIsCompleted;
    if (initialProgressPercent > 0) {
      setProgressPercent(initialProgressPercent);
    }
    if (initialProgressSeconds > 0) {
      setCurrentTime(initialProgressSeconds);
    }
  }, [lessonId, initialIsCompleted, initialProgressPercent, initialProgressSeconds]);

  // Update active video if videoUrl prop changes and no manual override set
  useEffect(() => {
    const extracted = extractYouTubeId(videoUrl);
    const validId = extracted === 'ysz5S6PUM-U' ? 'aqz-KE-bpKQ' : extracted;
    try {
      const saved = localStorage.getItem(`ss_vid_${lessonId}`);
      if (saved) {
        setActiveVideoId(saved);
        return;
      }
    } catch (e) {}
    setActiveVideoId(validId);
  }, [videoUrl, lessonId]);

  // ─── Switch Video Handler ──────────────────────────────────────────────
  const handleSwitchVideo = (newIdOrUrl: string) => {
    const newId = extractYouTubeId(newIdOrUrl);
    if (!newId) return;

    setActiveVideoId(newId);
    try {
      localStorage.setItem(`ss_vid_${lessonId}`, newId);
    } catch (e) {}
    setShowVideoSwitcher(false);
    setHasFallbackTriggered(false);

    if (playerRef.current?.loadVideoById) {
      try {
        playerRef.current.loadVideoById(newId);
      } catch (e) {}
    }
  };

  // ─── Initialize YouTube Player ─────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;
    let checkInterval: any = null;

    const loadPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (isCancelled) return;

      // Clean existing player if any
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }

      try {
        playerRef.current = new window.YT.Player(playerElementId.current, {
          videoId: activeVideoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              const p = event.target;
              const dur = p.getDuration();
              if (dur && dur > 0) {
                setDuration(dur);
              }

              // Resume watching logic:
              let resumeSec = initialProgressSeconds;
              if (!resumeSec) {
                try {
                  const cached = localStorage.getItem(`ss_lp_${userId}_${lessonId}`);
                  if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.progressSeconds) resumeSec = parsed.progressSeconds;
                  }
                } catch (e) {}
              }

              if (resumeSec > 5 && (!dur || resumeSec < dur - 5)) {
                try {
                  p.seekTo(resumeSec, true);
                  setCurrentTime(resumeSec);
                  setHasResumed(true);
                  setResumedAtTime(resumeSec);
                  setTimeout(() => setHasResumed(false), 5000);
                } catch (e) {}
              }
            },
            onError: (event: any) => {
              if (isCancelled) return;
              console.warn('[YouTubeLessonPlayer] YouTube video playback error code:', event.data);
              // Codes: 100, 101, 150, 2, 5
              if ([100, 101, 150, 2, 5].includes(event.data)) {
                setHasFallbackTriggered(true);
                const fallback = activeVideoId === 'M7lc1UVf-VE' ? 'aqz-KE-bpKQ' : 'M7lc1UVf-VE';
                try {
                  event.target.loadVideoById(fallback);
                  setActiveVideoId(fallback);
                } catch (e) {}
              }
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              const p = event.target;
              const state = event.data;

              if (state === 1) {
                // PLAYING
                setIsPlaying(true);
                setPlayerState('PLAYING');

                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = setInterval(() => {
                  try {
                    const cur = p.getCurrentTime();
                    const total = p.getDuration() || duration;
                    if (Number.isFinite(cur) && cur >= 0) {
                      setCurrentTime(cur);
                      if (total > 0) {
                        setDuration(total);
                        const pct = Math.min(100, Math.round((cur / total) * 100));
                        setProgressPercent(pct);
                        onProgressUpdate?.(pct, cur);

                        // CRITICAL: Reaching 90% threshold completes lesson
                        if (cur >= 5 && pct >= completionThresholdPercent) {
                          if (!isCompletedRef.current) {
                            saveProgressToBackend(cur, total, true);
                          }
                        }
                      }

                      // Periodic save every 12 seconds
                      if (Date.now() - lastSavedTimeRef.current > 12000) {
                        saveProgressToBackend(cur, total);
                      }
                    }
                  } catch (err) {}
                }, 1000);
              } else if (state === 2) {
                // PAUSED
                setIsPlaying(false);
                setPlayerState('PAUSED');
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                try {
                  const cur = p.getCurrentTime();
                  const total = p.getDuration() || duration;
                  if (cur > 0) {
                    saveProgressToBackend(cur, total);
                  }
                } catch (e) {}
              } else if (state === 3) {
                // BUFFERING
                setPlayerState('BUFFERING');
              } else if (state === 0) {
                // ENDED
                setIsPlaying(false);
                setPlayerState('ENDED');
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                try {
                  const total = p.getDuration() || duration;
                  saveProgressToBackend(total, total, true);
                } catch (e) {}
              } else {
                setIsPlaying(false);
                setPlayerState(state === -1 ? 'UNSTARTED' : 'CUED');
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              }
            },
          },
        });
      } catch (err) {
        console.warn('[YouTubeLessonPlayer] Player instantiation error:', err);
      }
    };

    // PostMessage event listener for direct iframe events
    const handleWindowMessage = (e: MessageEvent) => {
      if (!e.data || isCancelled) return;
      try {
        const payload = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (payload && payload.event === 'infoDelivery' && payload.info) {
          const { currentTime: cur, duration: dur, playerState: st } = payload.info;
          if (typeof cur === 'number' && cur >= 0) {
            setCurrentTime(cur);
            const total = typeof dur === 'number' && dur > 0 ? dur : duration;
            if (total > 0) {
              setDuration(total);
              const pct = Math.min(100, Math.round((cur / total) * 100));
              setProgressPercent(pct);
              onProgressUpdate?.(pct, cur);

              if (cur >= 5 && pct >= completionThresholdPercent) {
                if (!isCompletedRef.current) {
                  setIsCompleted(true);
                  isCompletedRef.current = true;
                  saveProgressToBackend(cur, total, true);
                }
              }
            }
          }
          if (st === 1) {
            setIsPlaying(true);
            setPlayerState('PLAYING');
          } else if (st === 2) {
            setIsPlaying(false);
            setPlayerState('PAUSED');
          } else if (st === 0) {
            setIsPlaying(false);
            setPlayerState('ENDED');
            const total = duration > 0 ? duration : 100;
            saveProgressToBackend(total, total, true);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);

    const tryInit = () => {
      if (isCancelled) return true;
      if (window.YT && typeof window.YT.Player === 'function') {
        loadPlayer();
        return true;
      }
      return false;
    };

    if (!tryInit()) {
      let scriptTag = document.getElementById('youtube-iframe-api-script') as HTMLScriptElement;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'youtube-iframe-api-script';
        scriptTag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(scriptTag, firstScriptTag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        tryInit();
      };

      let elapsed = 0;
      checkInterval = setInterval(() => {
        elapsed += 150;
        if (tryInit() || elapsed > 6000) {
          clearInterval(checkInterval);
        }
      }, 150);
    }

    return () => {
      isCancelled = true;
      window.removeEventListener('message', handleWindowMessage);
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        try {
          const cur = playerRef.current.getCurrentTime?.();
          const dur = playerRef.current.getDuration?.();
          if (cur && cur > 5) {
            saveProgressToBackend(cur, dur || duration);
          }
          playerRef.current.destroy?.();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [activeVideoId, lessonId, userId]);

  return (
    <div className="relative w-full rounded-2xl bg-govTeal-950 overflow-hidden shadow-xl border border-govTeal-900 flex flex-col">
      {/* Top Video Header Bar */}
      <div className="flex items-center justify-between text-white/90 text-xs px-4 py-3 bg-govTeal-950/90 border-b border-white/10 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-saffron-500/20 text-saffron-300 border border-saffron-400/30 px-2 py-0.5 rounded text-[11px] font-bold">
            YouTube Lesson
          </span>
          <span className="font-semibold truncate text-white/90">{lessonTitle}</span>
        </div>

        {/* Sync, Completion & Change Video Controls */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Change Video Selector Button */}
          <button
            onClick={() => setShowVideoSwitcher(!showVideoSwitcher)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-white/15"
            title="Change video stream or paste YouTube URL"
          >
            <Video className="w-3.5 h-3.5 text-saffron-400" />
            <span>Change Video</span>
            <ChevronDown className="w-3 h-3 text-white/70" />
          </button>

          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Completed
            </span>
          )}

          {syncStatus === 'saving' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-govTeal-200">
              <CloudUpload className="w-3.5 h-3.5 animate-pulse text-saffron-400" />
              <span className="hidden sm:inline">Syncing...</span>
            </span>
          )}

          {syncStatus === 'saved' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <CloudCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved</span>
            </span>
          )}

          <span className="text-[11px] font-mono text-white/60 hidden md:inline">
            1080p HD
          </span>
        </div>
      </div>

      {/* Change Video Popover / Drawer */}
      {showVideoSwitcher && (
        <div className="p-3 bg-govTeal-900 border-b border-white/15 text-white text-xs space-y-2.5 z-20 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold text-saffron-300 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              <span>Select Video Stream or Paste YouTube URL:</span>
            </span>
            <button
              onClick={() => setShowVideoSwitcher(false)}
              className="text-white/60 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_VIDEOS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleSwitchVideo(preset.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                  activeVideoId === preset.id
                    ? 'bg-saffron-500 text-govTeal-950 font-bold border-saffron-400 shadow-xs'
                    : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/20'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom YouTube URL Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Paste any YouTube URL or Video ID (e.g. https://www.youtube.com/watch?v=...)"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              className="flex-1 bg-govTeal-950/80 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-saffron-400"
            />
            <button
              onClick={() => {
                if (customInputUrl.trim()) {
                  handleSwitchVideo(customInputUrl.trim());
                  setCustomInputUrl('');
                }
              }}
              disabled={!customInputUrl.trim()}
              className="px-3 py-1.5 bg-saffron-500 hover:bg-saffron-600 disabled:opacity-50 text-govTeal-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Load Video
            </button>
          </div>
        </div>
      )}

      {/* Fallback notification if external video was embedding-restricted */}
      {hasFallbackTriggered && (
        <div className="bg-amber-900/90 text-amber-200 text-xs px-4 py-1.5 flex items-center gap-2 border-b border-amber-700 z-10">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>The original video owner restricted embedded playback. Switched to verified open training stream automatically.</span>
        </div>
      )}

      {/* Resume Banner Notification */}
      {hasResumed && resumedAtTime !== null && (
        <div className="bg-govTeal-800/90 text-govTeal-100 text-xs px-4 py-1.5 flex items-center justify-between border-b border-govTeal-700 animate-fadeIn z-10">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-saffron-400" />
            <span>Resumed playback from <strong>{formatTime(resumedAtTime)}</strong> ({progressPercent}%)</span>
          </div>
          <button
            onClick={() => {
              if (playerRef.current?.seekTo) {
                playerRef.current.seekTo(0, true);
                setHasResumed(false);
              }
            }}
            className="text-[11px] text-saffron-300 hover:text-white underline cursor-pointer font-semibold"
          >
            Start from beginning
          </button>
        </div>
      )}

      {/* Main Video IFrame Area */}
      <div className="relative aspect-video w-full bg-black">
        <div id={playerElementId.current} className="w-full h-full" />
      </div>

      {/* Video Progress & Stats Strip */}
      <div className="p-4 bg-govTeal-950 text-white space-y-2 border-t border-white/10">
        {/* Progress Bar */}
        <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isCompleted ? 'bg-emerald-500 shadow-xs' : 'bg-saffron-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(progressPercent, isCompleted ? 100 : 0))}%` }}
          />
          {/* 90% Threshold Milestone Marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/70 shadow-xs"
            style={{ left: `${completionThresholdPercent}%` }}
            title={`Completion threshold: ${completionThresholdPercent}%`}
          />
        </div>

        {/* Video Statistics & Completion Status */}
        <div className="flex items-center justify-between text-xs text-white/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-white/90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <span className="text-white/40">•</span>
            <span className="font-semibold text-saffron-300">
              Video progress: {progressPercent}%
            </span>
            <span className="text-white/40 hidden sm:inline">•</span>
            <span className="text-[11px] text-white/60 hidden sm:inline">
              (Goal: {completionThresholdPercent}% to complete)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ Lesson Completed</span>
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70 flex items-center gap-1.5 hidden sm:flex">
                  <Clock className="w-3.5 h-3.5 text-saffron-400" />
                  <span>Watch {Math.max(0, completionThresholdPercent - progressPercent)}% more to complete</span>
                </span>
                <button
                  id="btn-complete-lesson-direct"
                  type="button"
                  onClick={() => {
                    const total = duration > 0 ? duration : 900;
                    setCurrentTime(total);
                    setProgressPercent(100);
                    saveProgressToBackend(total, total, true);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Mark lesson completed and unlock quiz"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete Lesson</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
