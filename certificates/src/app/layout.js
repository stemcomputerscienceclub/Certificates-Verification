'use client';

import './globals.css';
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Certificate Verification | STEM CSC</title>
        <meta
          name="description"
          content="Professional certificate verification system for STEM CS Club. Secure, fast, and reliable certificate validation."
        />
        <meta name="keywords" content="certificate, verification, STEM, CS Club" />
        <meta property="og:title" content="Certificate Verification | STEM CSC" />
        <meta
          property="og:description"
          content="Verify your STEM CS Club certificates securely and instantly."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://verify.stemcsclub.org" />
      </head>
      <body className="min-h-screen flex flex-col bg-dark">
        <canvas
          id="matrixCanvas"
          className="fixed inset-0 opacity-5 pointer-events-none"
          style={{ zIndex: 0 }}
        />

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
