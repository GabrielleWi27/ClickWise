// The big footer shown at the bottom of every page. It's mostly static
// text and links — nothing dynamic happens here. Note: the social icons
// (Twitter/LinkedIn/GitHub) below intentionally stay on the "lucide" icon
// set instead of Google's Material Symbols, because Google's icon set
// doesn't include other companies' brand logos.
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black pt-16 pb-10 relative overflow-hidden print:hidden">
      {/* the 4-column layout: logo+blurb (wide), then 2 link columns */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 relative z-10">
        <div className="md:col-span-2">
          {/* logo + brand name */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 flex items-center justify-center bg-[#ef233c] rounded-lg">
              <iconify-icon icon="material-symbols:shield" className="text-white text-sm"></iconify-icon>
            </div>
            <span className="text-2xl font-bold font-manrope tracking-tighter">CLICKWISE</span>
          </div>
          <p className="text-zinc-500 max-w-sm leading-relaxed mb-8">
            A risk-adaptive security awareness platform, turning real phishing simulations and hands-on training into stronger
            instincts. Empowering employees to become the strongest link in your cybersecurity chain.
          </p>
          {/* social icon links (Twitter/GitHub are placeholders — only LinkedIn is real) */}
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-all">
              <iconify-icon icon="lucide:twitter"></iconify-icon>
            </a>
            <a
              href="https://www.linkedin.com/in/gabrielle-okoth-b75a72278"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-all"
            >
              <iconify-icon icon="lucide:linkedin"></iconify-icon>
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-all">
              <iconify-icon icon="lucide:github"></iconify-icon>
            </a>
          </div>
        </div>

        {/* "Product" link column — jumps to the main feature pages */}
        <div>
          <h4 className="text-xs font-bold text-[#ef233c] uppercase tracking-widest mb-8">Product</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><Link to="/simulations" className="hover:text-white transition-colors">Phishing Simulations</Link></li>
            <li><Link to="/training" className="hover:text-white transition-colors">Adaptive Training</Link></li>
            <li><Link to="/reports" className="hover:text-white transition-colors">Risk Reporting</Link></li>
            <li><Link to="/threat-intel" className="hover:text-white transition-colors">Threat Intelligence</Link></li>
          </ul>
        </div>

        {/* "Get Started" link column — the account/onboarding pages */}
        <div>
          <h4 className="text-xs font-bold text-[#ef233c] uppercase tracking-widest mb-8">Get Started</h4>
          <ul className="space-y-4 text-zinc-400 text-sm">
            <li><Link to="/demo" className="hover:text-white transition-colors">Try a Free Demo</Link></li>
            <li><Link to="/sign-up" className="hover:text-white transition-colors">Sign Up Free</Link></li>
            <li><Link to="/sign-in" className="hover:text-white transition-colors">Sign In</Link></li>
          </ul>
        </div>
      </div>

      {/* giant, near-invisible watermark of the brand name across the footer */}
      <div className="flex justify-center items-center py-4 opacity-[0.03] pointer-events-none select-none">
        <h1 className="text-[10vw] leading-none font-bold font-manrope tracking-tighter text-stroke">CLICKWISE</h1>
      </div>

      {/* copyright + legal links along the very bottom */}
      <div className="max-w-7xl mx-auto px-6 border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between text-zinc-600 text-[10px] uppercase tracking-widest">
        <p>© {new Date().getFullYear()} CLICKWISE Security Inc. All rights reserved.</p>
        <div className="flex gap-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-zinc-400">Privacy Policy</a>
          <a href="#" className="hover:text-zinc-400">Terms of Service</a>
          <a href="#" className="hover:text-zinc-400">Cookie Settings</a>
        </div>
      </div>
    </footer>
  );
}
