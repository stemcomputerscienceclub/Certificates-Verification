'use client';

export default function Footer() {
  return (
    <footer className="glass-morphism border-t border-secondary border-opacity-20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold glow-text mb-3">STEM CS Club</h3>
            <p className="text-gray-400 text-sm">
              A community-driven platform for computer science enthusiasts to learn, grow, and succeed.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.stemcsclub.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition"
                >
                  Official Website
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/bhNm7jc7js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition"
                >
                  Discord Community
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@stemcsclub.org"
                  className="text-gray-400 hover:text-primary transition"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-white mb-3">Certificate Info</h4>
            <p className="text-gray-400 text-sm mb-3">
              All certificates are digitally verified and encrypted for security.
            </p>
            <p className="text-xs text-gray-500">v1.0.0 • MERN Stack</p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-secondary border-opacity-20 pt-6 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-gray-400 text-sm">
            &copy; 2025 STEM CS Club. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 mt-4 sm:mt-0">
            Secured with HTTPS | MongoDB Encrypted | Rate Limited
          </p>
        </div>
      </div>
    </footer>
  );
}
