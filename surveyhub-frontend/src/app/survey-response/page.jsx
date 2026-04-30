"use client";
import Link from 'next/link';

export default function SurveyResponsePage() {
  return (
    <main className="main-container">
      <div className="grid-center" style={{ maxWidth: 480 }}>
        <h1 className="page-title" style={{ fontSize: '1.6rem' }}>Survey Response</h1>
        <p className="page-desc">To fill out a survey, use the link provided by the survey creator, or go to a direct survey URL like /survey-response/[id].</p>
        <Link href="/dashboard" className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] font-semibold hover:opacity-90 transition text-sm">
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
