'use client';

import Link from 'next/link';
import { FaCertificate } from 'react-icons/fa';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 glass-morphism border-b border-secondary border-opacity-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <FaCertificate className="text-3xl glow-text animate-float" />
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold glow-text">STEM CSC</h1>
              <p className="text-xs text-gray-400">Certificate Verification</p>
            </div>
          </Link>

          {/* Right Links */}
          <div className="flex items-center gap-4">
            <Link
              href="https://www.stemcsclub.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-300 hover:text-primary transition"
            >
              Official Site
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary rounded-lg text-white font-semibold text-sm hover:shadow-lg hover:shadow-secondary/50 transition"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
