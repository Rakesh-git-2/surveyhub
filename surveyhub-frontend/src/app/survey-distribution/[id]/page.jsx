"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '../../../api/api';

export default function SurveyDistributionDetailPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [copied, setCopied] = useState('');

  const responseUrl = typeof window !== 'undefined' ? `${window.location.origin}/survey-response/${id}` : '';
  const embedCode = `<iframe src="${responseUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  useEffect(() => {
    apiRequest({ method: 'GET', url: `/api/surveys/${id}/` }).then(setSurvey).catch(() => {});
  }, [id]);

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-h))', background: 'var(--bg)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Share Survey</h1>
        {survey && <p className="text-[var(--text-secondary)] mb-8">{survey.title}</p>}

        <div className="flex flex-col gap-6">
          {/* Shareable Link */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
            <h2 className="font-semibold text-[var(--text-main)] mb-3">Shareable Link</h2>
            <div className="flex gap-2">
              <input
                readOnly
                value={responseUrl}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] text-sm outline-none"
              />
              <button
                onClick={() => copy(responseUrl, 'link')}
                className="px-4 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] text-sm font-medium hover:opacity-90 transition"
              >
                {copied === 'link' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Embed Code */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
            <h2 className="font-semibold text-[var(--text-main)] mb-3">Embed Code</h2>
            <div className="flex gap-2">
              <input
                readOnly
                value={embedCode}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--primary-bg)] text-[var(--text-main)] text-xs outline-none font-mono"
              />
              <button
                onClick={() => copy(embedCode, 'embed')}
                className="px-4 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] text-sm font-medium hover:opacity-90 transition"
              >
                {copied === 'embed' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">Paste this code on any webpage to embed your survey.</p>
          </div>

          {/* QR Placeholder */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
            <h2 className="font-semibold text-[var(--text-main)] mb-3">QR Code</h2>
            <div className="w-40 h-40 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(responseUrl)}`}
                alt="QR Code"
                className="w-36 h-36 rounded-lg"
              />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">Scan to open the survey on mobile.</p>
          </div>

          {/* Share Options */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
            <h2 className="font-semibold text-[var(--text-main)] mb-3">Share Via</h2>
            <div className="flex gap-3 flex-wrap">
              <a
                href={`mailto:?subject=Please fill out this survey&body=${encodeURIComponent(responseUrl)}`}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-main)] hover:bg-[var(--secondary-bg)] transition"
              >
                Email
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(responseUrl)}&text=Please fill out my survey!`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-main)] hover:bg-[var(--secondary-bg)] transition"
              >
                Twitter / X
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(responseUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-main)] hover:bg-[var(--secondary-bg)] transition"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
