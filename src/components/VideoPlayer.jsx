import React, { useRef, useState } from 'react'
import { Play, Pause, Maximize, Volume2, VolumeX } from 'lucide-react'

export default function VideoPlayer({ src, poster }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  function togglePlay() {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setPlaying(!playing)
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return
    const ct = videoRef.current.currentTime
    const dur = videoRef.current.duration || 1
    setCurrentTime(ct)
    setProgress((ct / dur) * 100)
  }

  function handleLoadedMetadata() {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  function handleSeek(e) {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * (videoRef.current.duration || 0)
  }

  function handleFullscreen() {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!src) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        background: 'var(--bg-tertiary)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No video available</span>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      borderRadius: 10,
      overflow: 'hidden',
      background: '#000',
      border: '1px solid var(--border)',
      position: 'relative',
    }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        style={{ width: '100%', display: 'block', cursor: 'pointer' }}
      />

      {/* Controls overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        padding: '20px 12px 10px',
      }}>
        {/* Seek bar */}
        <div
          onClick={handleSeek}
          style={{
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            cursor: 'pointer',
            marginBottom: 8,
            position: 'relative',
          }}
        >
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--accent)',
            borderRadius: 2,
            transition: 'width 0.1s linear',
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={togglePlay}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <span style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'Geist Mono, monospace',
          }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div style={{ flex: 1 }} />

          <button
            onClick={() => {
              setMuted(!muted)
              if (videoRef.current) videoRef.current.muted = !muted
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button
            onClick={handleFullscreen}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Maximize size={14} />
          </button>
        </div>
      </div>

      {/* Big play button overlay when paused */}
      {!playing && (
        <div
          onClick={togglePlay}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(129,140,248,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Play size={24} color="#fff" fill="#fff" />
          </div>
        </div>
      )}
    </div>
  )
}
