'use client';

import { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaDownload, FaShare } from 'react-icons/fa';
import axios from 'axios';

export default function CertificateVerifier() {
  const [certificateId, setCertificateId] = useState('');
  const [state, setState] = useState('idle'); // idle, loading, success, error
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    if (!/^\d{7}$/.test(certificateId)) {
      setError('Certificate ID must be exactly 7 digits');
      return;
    }

    setState('loading');
    setError('');

    try {
      const response = await axios.get(
        `${API_URL}/certificates/verify/${certificateId.trim().toUpperCase()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.verified) {
        setCertificate(response.data.certificate);
        setState('success');
      } else {
        setError(response.data.message || 'Certificate not found');
        setState('error');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Failed to verify certificate');
      setState('error');
    }
  };

  const handleShare = async () => {
    const text = `I just verified my STEM CS Club Certificate!\nID: ${certificate.certificateId}\nProgram: ${certificate.program}\n\nVerify: ${window.location.origin}?id=${certificate.certificateId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'STEM CSC Certificate',
          text,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        alert('Certificate info copied to clipboard!');
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  const resetForm = () => {
    setCertificateId('');
    setCertificate(null);
    setError('');
    setState('idle');
  };

  // Handle URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id && !certificateId) {
      setCertificateId(id);
      // Trigger verification
      setTimeout(() => {
        const form = document.getElementById('verifyForm');
        if (form) form.dispatchEvent(new Event('submit'));
      }, 0);
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 glow-text">Verify Your Certificate</h1>
        <p className="text-xl text-gray-300">
          Enter your certificate ID to validate and view your achievement
        </p>
      </div>

      {/* States */}
      {state === 'idle' || state === 'error' ? (
        <div className="card mb-8">
          <form id="verifyForm" onSubmit={handleSubmit} className="space-y-6">
            {/* Input Group */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Certificate ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={certificateId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 7);
                    setCertificateId(value);
                  }}
                  placeholder="YYSSCCC (e.g., 2501001)"
                  maxLength="7"
                  className="input-field pl-10"
                  disabled={state === 'loading'}
                />
                <span className="absolute left-3 top-3 text-primary">📋</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Format: YYSSCCC
                <br />
                YY = Year (25 = 2025) | SS = Program (01 = Online Chapter) | CCC = Serial number
              </p>
            </div>

            {/* Error Message */}
            {error && state === 'error' && (
              <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-50 rounded-lg">
                <p className="text-red-400 text-sm font-semibold">❌ {error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={state === 'loading'}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {state === 'loading' ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Verifying...
                </>
              ) : (
                <>
                  <FaCheckCircle /> Verify Certificate
                </>
              )}
            </button>
          </form>
        </div>
      ) : null}

      {/* Loading State */}
      {state === 'loading' && (
        <div className="card text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-secondary border-t-primary rounded-full mx-auto mb-4" />
          <p className="text-gray-300">Verifying your certificate...</p>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="card text-center py-12">
          <FaExclamationCircle className="text-5xl text-red-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-2xl font-bold mb-2 text-red-400">Certificate Not Found</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={resetForm} className="btn-secondary">
            Try Another
          </button>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && certificate && (
        <div className="space-y-6">
          {/* Certificate Card */}
          <div className="card border-2 border-secondary border-opacity-75 shadow-lg shadow-secondary/30">
            <div className="text-center space-y-6">
              {/* Header */}
              <div>
                <div className="text-6xl mb-4 glow-text animate-float">⭐</div>
                <h2 className="text-4xl font-bold glow-text">Certificate of Achievement</h2>
              </div>

              {/* Body */}
              <div className="space-y-4 border-y border-secondary border-opacity-30 py-8">
                <p className="text-sm text-gray-400 uppercase tracking-widest">This is to certify that</p>
                <h3 className="text-3xl font-bold text-primary">{certificate.recipientName}</h3>

                <p className="text-sm text-gray-400 uppercase tracking-widest">has successfully completed</p>
                <p className="text-2xl font-bold text-secondary">{certificate.program}</p>

                <p className="text-sm text-gray-400 uppercase tracking-widest">awarded on</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(certificate.awardDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end pt-4">
                <div className="text-left">
                  <p className="text-xs text-gray-400 uppercase">Certificate ID</p>
                  <p className="font-mono text-lg font-bold text-primary">{certificate.certificateId}</p>
                </div>
                <div className="flex items-center gap-2 text-success font-bold">
                  <FaCheckCircle className="text-2xl" />
                  VERIFIED
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="card">
            <h4 className="text-xl font-bold mb-4 glow-text">Certificate Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-dark border border-secondary border-opacity-20 rounded-lg">
                <p className="text-xs text-gray-400 uppercase">Year</p>
                <p className="text-lg font-bold text-primary">{certificate.year}</p>
              </div>
              <div className="p-3 bg-dark border border-secondary border-opacity-20 rounded-lg">
                <p className="text-xs text-gray-400 uppercase">Program</p>
                <p className="text-lg font-bold text-secondary">{certificate.program}</p>
              </div>
              <div className="p-3 bg-dark border border-secondary border-opacity-20 rounded-lg">
                <p className="text-xs text-gray-400 uppercase">Serial Number</p>
                <p className="text-lg font-bold text-primary">{certificate.serialNumber} / 9999</p>
              </div>
              <div className="p-3 bg-dark border border-success border-opacity-30 rounded-lg">
                <p className="text-xs text-gray-400 uppercase">Status</p>
                <p className="text-lg font-bold text-success">Verified ✓</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button onClick={handleShare} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <FaShare /> Share
            </button>
            <button onClick={resetForm} className="btn-secondary flex-1">
              Verify Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
