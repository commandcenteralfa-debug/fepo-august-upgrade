"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone } from "lucide-react";

const InstagramIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Footer() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    if (path === "/") {
      router.push("/");
    } else {
      const element = document.querySelector(path);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const quickLinks = [
    { label: "Home", path: "/" },
    { label: "Festivals", path: "#festival-section" },
    { label: "Categories", path: "#categories-section" },
    { label: "About", path: "#footer" },
  ];

  return (
    <footer id="footer" className="bg-stone-700 py-8 px-4 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-white tracking-wider mb-3 font-headline">
              FEPO
            </h3>
            <p className="text-stone-300 text-sm font-body">
              Your digital partner. Create stunning visuals for your business in seconds.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 font-body">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => handleNavigation(link.path)}
                    className="text-stone-300 hover:text-white transition-colors text-sm text-left font-body"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 font-body">Company</h4>
            <ul className="space-y-2">
              {[
                { label: "Contact", icon: Mail },
                { label: "Privacy Policy", icon: null },
                { label: "Terms of Service", icon: null },
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    href="#" 
                    className="text-stone-300 hover:text-white transition-colors text-sm flex items-center gap-2 font-body"
                  >
                    {item.icon && <item.icon size={14} />}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 font-body">Connect</h4>
            <div className="flex gap-3">
              {[
                { icon: InstagramIcon, label: "Instagram" },
                { icon: FacebookIcon, label: "Facebook" },
                { icon: Mail, label: "Email" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-stone-600 flex items-center justify-center text-white hover:bg-primary transition-colors"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-stone-300 text-xs flex items-center gap-2 font-body">
                <Mail size={12} /> fepodigitals@gmail.com
              </p>
              <p className="text-stone-300 text-xs flex items-center gap-2 font-body">
                <Phone size={12} /> +91 7777991909
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-600 text-center">
          <p className="text-stone-400 text-sm font-body">
            © 2026 FEPO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
