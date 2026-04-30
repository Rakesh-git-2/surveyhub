"use client";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/authContext';
import AppTour from '../components/AppTour';
import {
  Sparkles, MessageSquare, Lightbulb, BarChart2, TrendingUp,
  Share2, Bell, Zap, Shield, User, Settings, LogOut,
} from 'lucide-react';
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const NAV_LINKS = [
  { href: '/dashboard',      label: 'Dashboard' },
  { href: '/survey-creation',label: 'Create' },
  { href: '/survey-report',  label: 'Reports' },
];

const MORE_ITEMS = [
  { group: 'AI', items: [
    { href: '/ai-survey-generation', label: 'AI Generation',    Icon: Sparkles },
    { href: '/conversational-ai',    label: 'Conversational AI',Icon: MessageSquare },
    { href: '/ai-recommendations',   label: 'AI Insights',      Icon: Lightbulb },
  ]},
  { group: 'Analytics', items: [
    { href: '/advanced-reporting',  label: 'Advanced Reports',  Icon: BarChart2 },
    { href: '/engagement-metrics',  label: 'Engagement',        Icon: TrendingUp },
  ]},
  { group: 'Manage', items: [
    { href: '/survey-distribution', label: 'Distribution',      Icon: Share2 },
    { href: '/notifications',       label: 'Notifications',     Icon: Bell },
    { href: '/integrations',        label: 'Integrations',      Icon: Zap },
    { href: '/role-management',     label: 'Roles',             Icon: Shield },
    { href: '/user-management',     label: 'Profile',           Icon: User },
    { href: '/admin-panel',         label: 'Admin',             Icon: Settings },
  ]},
];

function MoreDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
        style={{ color: open ? 'var(--accent)' : 'var(--text-2)', background: open ? 'var(--accent-hover)' : 'transparent' }}
      >
        More
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
            width: 520, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-xl)',
            padding: '1.25rem', zIndex: 200,
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem',
          }}
        >
          {MORE_ITEMS.map(group => (
            <div key={group.group}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.6rem' }}>
                {group.group}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.45rem 0.6rem', borderRadius: 'var(--r-sm)',
                      fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-2)',
                      textDecoration: 'none', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
                  >
                    <item.Icon size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (pathname?.startsWith(href + '/') ?? false);
  return (
    <Link
      href={href}
      style={{
        position: 'relative', padding: '0.4rem 0.75rem', borderRadius: 'var(--r-sm)',
        fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
        color: active ? 'var(--accent)' : 'var(--text-2)',
        background: active ? 'var(--accent-hover)' : 'transparent',
        transition: 'all .15s',
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
    >
      {label}
    </Link>
  );
}

function NavAuth() {
  const { state, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (state.loading) return <div style={{ width: 80, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', animation: 'pulse 1.5s infinite' }} />;

  if (!state.isAuthenticated) {
    return (
      <Link href="/auth" className="btn btn-primary btn-sm">
        Get Started
      </Link>
    );
  }

  const initials = (state.user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setMenuOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 0.75rem 0.35rem 0.35rem',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: '99px', cursor: 'pointer', transition: 'all .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--grad)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <span style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-2)' }}>
          {state.user?.username}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r)', boxShadow: 'var(--shadow-lg)',
          padding: '0.5rem', minWidth: 180, zIndex: 200,
        }}>
          <div style={{ padding: '0.5rem 0.75rem 0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.4rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>{state.user?.username}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{state.user?.email}</p>
          </div>
          {[
            { href: '/user-management', label: 'Profile settings', Icon: User },
            { href: '/notifications',   label: 'Notifications',    Icon: Bell },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.45rem 0.75rem', borderRadius: 'var(--r-sm)',
                fontSize: '0.85rem', color: 'var(--text-2)', textDecoration: 'none',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
            >
              <item.Icon size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} /> {item.label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
            <button
              onClick={() => { logout(); router.push('/'); setMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                padding: '0.45rem 0.75rem', borderRadius: 'var(--r-sm)',
                fontSize: '0.85rem', color: 'var(--error)', background: 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--error-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const { state } = useAuth();

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link
        href="/"
        style={{ textDecoration: 'none', marginRight: '2rem', flexShrink: 0 }}
      >
        <span style={{
          fontSize: '1.15rem', fontWeight: 800,
          background: 'var(--grad-text)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          letterSpacing: '-0.02em',
        }}>
          SurveyHub
        </span>
      </Link>

      {/* Primary nav */}
      {state.isAuthenticated && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
          {NAV_LINKS.map(l => <NavLink key={l.href} href={l.href} label={l.label} />)}
          <MoreDropdown />
        </div>
      )}

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
        {state.isAuthenticated && (
          <Link href="/survey-creation" className="btn btn-primary btn-sm">
            + New Survey
          </Link>
        )}
        <NavAuth />
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <Navbar />
          {children}
          <AppTour />
        </AuthProvider>
      </body>
    </html>
  );
}
