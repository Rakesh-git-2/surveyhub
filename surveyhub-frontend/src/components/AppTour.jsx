"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import {
  PartyPopper, LayoutDashboard, PenLine, Sparkles, BarChart2, Zap, ArrowRight, ArrowLeft, X
} from 'lucide-react';

const TOUR_KEY = 'surveyhub_tour_dismissed';

const STEPS = [
  {
    Icon: PartyPopper,
    tag: 'Welcome',
    title: 'Welcome to SurveyHub!',
    desc: "You're on the most powerful AI-driven survey platform. In under a minute, we'll show you everything you need to start collecting insights.",
    color: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  },
  {
    Icon: LayoutDashboard,
    tag: 'Dashboard',
    title: 'Your Command Center',
    desc: 'The Dashboard gives you a bird\'s-eye view of all your surveys — see response counts, active status, search, and manage everything in one place.',
    color: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
  },
  {
    Icon: PenLine,
    tag: 'Create',
    title: 'Build Surveys Effortlessly',
    desc: 'Use the survey builder to craft any type of question — text, multiple choice, rating, or yes/no. Or skip straight to AI generation for instant results.',
    color: 'linear-gradient(135deg, #4F46E5, #3B82F6)',
  },
  {
    Icon: Sparkles,
    tag: 'AI Features',
    title: 'Powered by Gemini AI',
    desc: 'Three AI superpowers: generate a full survey from a topic, chat conversationally to design questions, or get deep actionable insights on your response data.',
    color: 'linear-gradient(135deg, #A78BFA, #7C3AED, #4F46E5)',
  },
  {
    Icon: BarChart2,
    tag: 'Analytics',
    title: 'Rich Reports & Metrics',
    desc: 'See response breakdowns with visual charts, track engagement over time, measure completion rates, and export everything to CSV in one click.',
    color: 'linear-gradient(135deg, #0EA5E9, #4F46E5)',
  },
  {
    Icon: Zap,
    tag: 'Integrations',
    title: 'Connect Your Stack',
    desc: 'Set up webhooks to receive real-time POST notifications whenever a new response comes in. Sign payloads with HMAC-SHA256 for secure delivery.',
    color: 'linear-gradient(135deg, #7C3AED, #0EA5E9)',
  },
];

export default function AppTour() {
  const { state } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (state.isAuthenticated && localStorage.getItem(TOUR_KEY) !== 'true') {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [state.isAuthenticated]);

  const dismiss = useCallback(() => {
    if (dontShow) localStorage.setItem(TOUR_KEY, 'true');
    setExiting(true);
    setTimeout(() => { setVisible(false); setExiting(false); }, 280);
  }, [dontShow]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  }, [step, dismiss]);

  const prev = () => { if (step > 0) setStep(s => s - 1); };

  useEffect(() => {
    const onKey = (e) => {
      if (!visible) return;
      if (e.key === 'Escape') dismiss();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, step, dismiss, next]);

  if (!visible) return null;

  const current = STEPS[step];
  const { Icon } = current;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(13,11,30,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: exiting ? 'fadeIn .28s ease reverse' : 'fadeIn .28s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
        animation: exiting ? 'fadeUp .28s ease reverse' : 'fadeUp .35s ease',
      }}>
        {/* Gradient header */}
        <div style={{
          background: current.color,
          padding: '2.5rem 2rem 2rem',
          position: 'relative',
          textAlign: 'center',
        }}>
          {/* Close */}
          <button onClick={dismiss} style={{
            position: 'absolute', top: '1rem', left: '1rem',
            background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff',
          }}>
            <X size={14} />
          </button>

          {/* Step dots */}
          <div style={{ position: 'absolute', top: '1.1rem', right: '1rem', display: 'flex', gap: '4px' }}>
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} style={{
                width: i === step ? 18 : 6, height: 6, borderRadius: 99,
                border: 'none', cursor: 'pointer', padding: 0,
                background: i === step ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)',
                transition: 'all .25s',
              }} />
            ))}
          </div>

          <span style={{
            display: 'inline-block', padding: '0.25rem 0.75rem',
            background: 'rgba(255,255,255,.2)', borderRadius: 99,
            fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,.9)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem',
          }}>
            {step + 1} of {STEPS.length} — {current.tag}
          </span>

          <div style={{
            width: 52, height: 52, borderRadius: 'var(--r)',
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.75rem',
          }}>
            <Icon size={26} color="#fff" strokeWidth={1.5} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.25 }}>
            {current.title}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem 2rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
            {current.desc}
          </p>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 99,
                background: i <= step ? 'var(--accent)' : 'var(--border)',
                transition: 'background .25s',
              }} />
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {step > 0 && (
              <button onClick={prev} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1.1rem', borderRadius: 'var(--r-sm)',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text-2)', fontWeight: 500, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'all .15s',
              }}>
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <button onClick={next} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem 1.4rem', borderRadius: 'var(--r-sm)',
              background: 'var(--grad)', color: '#fff',
              fontWeight: 600, fontSize: '0.875rem',
              border: 'none', cursor: 'pointer', transition: 'all .18s',
              boxShadow: '0 4px 12px rgba(124,58,237,.3)',
            }}>
              {isLast ? "Let's go" : 'Next'} <ArrowRight size={14} />
            </button>
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginTop: '1.25rem', cursor: 'pointer',
            fontSize: '0.8rem', color: 'var(--text-3)',
          }}>
            <input
              type="checkbox" checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
            />
            Don't show this again
          </label>
        </div>
      </div>
    </div>
  );
}
