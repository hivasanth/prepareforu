import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { BrandTitle } from '../components/common/AntigravityUI';
import logoImg from "../assets/logo.png";

const TITLE_TEXT = "WHAT U WANT";

export default function SplashPage() {
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();

  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const navRef = useRef(false);
  const audioPlayedRef = useRef(false);

  const LOAD_DURATION = 2200; // Snappier loading duration

  /* ── Sound Synthesizer (Web Audio API) ────────────────────────────────── */
  const playSplashSound = () => {
    if (audioPlayedRef.current) return;
    audioPlayedRef.current = true;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const now = ctx.currentTime;
      
      // Warm bass/root note (C3)
      const oscBass = ctx.createOscillator();
      const gainBass = ctx.createGain();
      oscBass.type = 'sine';
      oscBass.frequency.setValueAtTime(130.81, now);
      gainBass.gain.setValueAtTime(0, now);
      gainBass.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gainBass.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
      oscBass.connect(gainBass);
      gainBass.connect(ctx.destination);
      
      // Mid harmony (G3 - Perfect Fifth)
      const oscMid = ctx.createOscillator();
      const gainMid = ctx.createGain();
      oscMid.type = 'triangle';
      oscMid.frequency.setValueAtTime(196.00, now + 0.08);
      gainMid.gain.setValueAtTime(0, now + 0.08);
      gainMid.gain.linearRampToValueAtTime(0.12, now + 0.18);
      gainMid.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      oscMid.connect(gainMid);
      gainMid.connect(ctx.destination);
      
      // Bell tone 1 (C4 - Octave)
      const oscBell1 = ctx.createOscillator();
      const gainBell1 = ctx.createGain();
      oscBell1.type = 'sine';
      oscBell1.frequency.setValueAtTime(261.63, now + 0.15);
      gainBell1.gain.setValueAtTime(0, now + 0.15);
      gainBell1.gain.linearRampToValueAtTime(0.15, now + 0.25);
      gainBell1.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      oscBell1.connect(gainBell1);
      gainBell1.connect(ctx.destination);

      // Bell tone 2 (E4 - Major Third)
      const oscBell2 = ctx.createOscillator();
      const gainBell2 = ctx.createGain();
      oscBell2.type = 'sine';
      oscBell2.frequency.setValueAtTime(329.63, now + 0.22);
      gainBell2.gain.setValueAtTime(0, now + 0.22);
      gainBell2.gain.linearRampToValueAtTime(0.1, now + 0.32);
      gainBell2.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
      oscBell2.connect(gainBell2);
      gainBell2.connect(ctx.destination);
      
      // High Chime (G4 - Perfect Fifth Octave)
      const oscChime = ctx.createOscillator();
      const gainChime = ctx.createGain();
      oscChime.type = 'sine';
      oscChime.frequency.setValueAtTime(392.00, now + 0.3);
      gainChime.gain.setValueAtTime(0, now + 0.3);
      gainChime.gain.linearRampToValueAtTime(0.08, now + 0.4);
      gainChime.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      oscChime.connect(gainChime);
      gainChime.connect(ctx.destination);
      
      oscBass.start(now);
      oscMid.start(now + 0.08);
      oscBell1.start(now + 0.15);
      oscBell2.start(now + 0.22);
      oscChime.start(now + 0.3);
      
      oscBass.stop(now + 2.2);
      oscMid.stop(now + 2.2);
      oscBell1.stop(now + 2.2);
      oscBell2.stop(now + 2.2);
      oscChime.stop(now + 2.2);
    } catch (e) {
      console.warn("Audio autoplay blocked:", e);
    }
  };

  /* ── Progress ticker & Autoplay Trigger ────────────────────────────────── */
  useEffect(() => {
    // Attempt play on mount
    playSplashSound();

    const delay = setTimeout(() => {
      const tick = (now: number) => {
        if (!startRef.current) startRef.current = now;
        const p = Math.min(((now - startRef.current) / LOAD_DURATION) * 100, 100);
        setProgress(p);
        if (p < 100) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setTimeout(() => setPhase('exit'), 500);
        }
      };
      startRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    }, 200);

    return () => {
      clearTimeout(delay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── Navigation after exit ─────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'exit' || loading || navRef.current) return;
    navRef.current = true;
    const t = setTimeout(() => {
      if (userProfile) {
        if (userProfile.role === 'admin') navigate('/admin', { replace: true });
        else if (userProfile.role === 'sub_admin') navigate('/sub-admin', { replace: true });
        else if (userProfile.exam_selection) navigate('/dashboard', { replace: true });
        else navigate('/signup', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 600);
    return () => clearTimeout(t);
  }, [phase, loading, userProfile, navigate]);

  /* ── Spring for smoothed progress bar ─────────────────────────────────── */
  const springProgress = useSpring(0, { stiffness: 80, damping: 20 });
  useEffect(() => { springProgress.set(progress); }, [progress, springProgress]);
  const barWidth = useTransform(springProgress, v => `${v}%`);

  const loadingMsg = useMemo(() => {
    if (progress < 30) return 'Initializing Platform…';
    if (progress < 60) return 'Loading Resources…';
    if (progress < 85) return 'Syncing Knowledge Base…';
    return 'Welcome to WhatUWant';
  }, [progress]);

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          key="splash"
          className="fixed inset-0 w-screen h-screen overflow-hidden z-[9999] select-none flex flex-col items-center justify-center cursor-pointer bg-[radial-gradient(circle_at_center,var(--canvas-splash-bg)_0%,var(--canvas-splash-dark)_100%)] font-['Inter',_system-ui,_-apple-system,_sans-serif]"
          onClick={playSplashSound} // Play sound on click if browser blocked autoplay
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.98,
            filter: "blur(8px)",
            transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
          }}
        >
          {/* Subtle central ambient gold glow */}
          <div
            className="absolute inset-0 pointer-events-none animate-pulse duration-[3s] bg-[radial-gradient(circle_at_center,var(--gold-200)_0%,transparent_60%)] opacity-[0.06]"
          />

          <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-sm w-full text-center">
            
            {/* Logo container: circular coin frame matching the new logo */}
            <motion.div
              className="relative flex items-center justify-center mb-8 p-2.5 rounded-full bg-gradient-to-b from-[var(--gold-100)] to-[var(--gold-400)] shadow-[0_0_60px_color-mix(in_srgb,var(--gold-200)_25%,transparent)]"
              initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            >
              <div className="w-48 h-48 flex items-center justify-center rounded-full bg-[var(--canvas-splash-bg)] overflow-hidden p-0.5">
                <img
                  src={logoImg}
                  alt="WhatUWant Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              
              {/* Spinning sheen light sweep overlay */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none opacity-25 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.4)_50%,transparent_60%)] bg-[length:250%_250%] animate-[sheen_4s_infinite_linear]"
              />
            </motion.div>

            {/* Brand Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <BrandTitle variant="gradient" className="mb-2">{TITLE_TEXT}</BrandTitle>
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="text-[var(--gold-300)] opacity-60 text-[9px] font-bold tracking-[0.35em] uppercase mb-12 pl-[0.35em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Heritage of Wisdom · Future of Learning
            </motion.p>

            {/* Loading Progress Section */}
            <motion.div
              className="w-48 flex flex-col gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {/* Progress Track */}
              <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                {/* Progress Fill (Premium Gold Gradient) */}
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[var(--gold-100)] to-[var(--gold-400)] rounded-full shadow-[0_0_10px_color-mix(in_srgb,var(--gold-200)_40%,transparent)]"
                  style={{ width: barWidth }}
                />
              </div>

              {/* Progress Labels */}
              <div className="flex justify-between items-center text-[8px] tracking-widest text-[var(--gold-300)]/50 font-bold uppercase">
                <span>{loadingMsg}</span>
                <span className="font-mono text-[var(--gold-300)]/70">{Math.round(progress)}%</span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
