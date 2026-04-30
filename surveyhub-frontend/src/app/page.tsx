import Link from 'next/link';
import { Sparkles, MessageSquare, Lightbulb, BarChart2, Zap, Shield } from 'lucide-react';

const FEATURES = [
  { Icon: Sparkles,      title: 'AI Survey Generation', desc: 'Describe a topic and Gemini drafts a complete survey in seconds — with mixed question types.' },
  { Icon: MessageSquare, title: 'Conversational Builder', desc: 'Chat naturally with an AI assistant to design the perfect survey through dialogue.' },
  { Icon: Lightbulb,     title: 'Response Insights', desc: 'Get executive summaries, sentiment analysis, and actionable recommendations on your data.' },
  { Icon: BarChart2,     title: 'Rich Analytics', desc: 'Visual response breakdowns, engagement metrics, completion rates, and CSV export.' },
  { Icon: Zap,           title: 'Webhook Integrations', desc: 'Fire real-time POST events to any endpoint when a new response is submitted.' },
  { Icon: Shield,        title: 'Role Management', desc: 'Invite team members, assign roles, and control access to surveys and data.' },
];

const STATS = [
  { value: '3 AI Modes', label: 'Generate, Chat & Analyse' },
  { value: '4 Types',    label: 'Text, Choice, Rating, Yes/No' },
  { value: '100%',       label: 'Open Source' },
];

export default function Home() {
  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)' }}>

      {/* Hero */}
      <section style={{
        background: 'var(--grad-hero)',
        padding: '6rem 1.5rem 5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
          <span style={{
            display: 'inline-block', padding: '0.3rem 1rem',
            background: 'rgba(139,92,246,.2)', border: '1px solid rgba(139,92,246,.4)',
            borderRadius: 99, fontSize: '0.78rem', fontWeight: 600,
            color: '#C4B5FD', letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            Powered by Gemini AI
          </span>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900,
            color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em',
            margin: '0 0 1.5rem',
          }}>
            Surveys that think
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #A78BFA, #818CF8, #38BDF8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              for themselves
            </span>
          </h1>

          <p style={{
            fontSize: '1.1rem', color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.7, margin: '0 auto 2.5rem',
            maxWidth: 520,
          }}>
            Build, distribute, and analyse surveys with the power of AI. From a single prompt to deep response insights — SurveyHub does it all.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth" style={{
              padding: '0.85rem 2rem',
              background: 'var(--grad)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              borderRadius: 'var(--r-sm)', textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(124,58,237,.45)',
              display: 'inline-block',
            }}>
              Start for free →
            </Link>
            <Link href="/dashboard" style={{
              padding: '0.85rem 2rem',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.95rem',
              borderRadius: 'var(--r-sm)', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'inline-block',
            }}>
              View dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '1.5rem',
      }}>
        <div style={{
          maxWidth: 700, margin: '0 auto',
          display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap',
        }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '1.25rem', fontWeight: 800,
                background: 'var(--grad-text)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{s.value}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Everything you need
            </h2>
            <p style={{ color: 'var(--text-2)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              One platform. AI-first. Built for results.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--r-sm)',
                  background: 'var(--accent-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <f.Icon size={20} color="var(--accent)" strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 0.4rem' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--grad-hero)', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
            Ready to get started?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.65 }}>
            Create your first AI-powered survey in minutes. No credit card required.
          </p>
          <Link href="/auth" style={{
            display: 'inline-block',
            padding: '0.9rem 2.5rem', background: 'var(--grad)',
            color: '#fff', fontWeight: 700, fontSize: '1rem',
            borderRadius: 'var(--r-sm)', textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(124,58,237,.45)',
          }}>
            Create your account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        padding: '1.5rem', textAlign: 'center',
        fontSize: '0.8rem', color: 'var(--text-3)',
      }}>
        SurveyHub — AI-powered survey platform
      </footer>
    </main>
  );
}
