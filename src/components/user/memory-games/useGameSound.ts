import { useCallback, useEffect, useRef, useState } from 'react'
import type { MemorySoundCue } from '../../../hooks/useMemoryGame'

const STORAGE_KEY = 'pf_memory_games_sound'

/** Cue → short synthesised tone (no audio assets, no autoplay). */
const CUE_FREQUENCY: Record<MemorySoundCue, number> = {
  reveal: 440,
  correct: 660,
  wrong: 180,
  stage: 780,
  level: 920,
  complete: 1046,
  countdown: 520,
  countCritical: 740,
  timeUp: 140,
}

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

export interface UseGameSoundReturn {
  enabled: boolean
  toggle: () => void
  play: (cue: MemorySoundCue) => void
}

/**
 * Optional, opt-in sound. Defaults to OFF and only ever creates an AudioContext
 * inside a cue (which always follows a user gesture) — never on mount, so there
 * is no autoplay. Preference is a UI setting only (never game data).
 */
export function useGameSound(): UseGameSoundReturn {
  const [enabled, setEnabled] = useState(readPreference)
  const contextRef = useRef<AudioContext | null>(null)

  useEffect(
    () => () => {
      if (contextRef.current) {
        void contextRef.current.close().catch(() => undefined)
        contextRef.current = null
      }
    },
    [],
  )

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      } catch {
        // Preference persistence is best-effort.
      }
      return next
    })
  }, [])

  const play = useCallback((cue: MemorySoundCue) => {
    if (!enabled) return
    try {
      const AudioCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtor) return
      if (!contextRef.current) contextRef.current = new AudioCtor()
      const context = contextRef.current
      if (context.state === 'suspended') void context.resume()

      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime
      oscillator.type = 'sine'
      oscillator.frequency.value = CUE_FREQUENCY[cue]
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.2)
    } catch {
      // Sound is enhancement only — never let it break gameplay.
    }
  }, [enabled])

  return { enabled, toggle, play }
}
