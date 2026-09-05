import Link from "next/link";
import { IconBrandX, IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";

export function LandingFooter() {
  return (
    <footer className="bg-[#0a1f16] text-[#FDFBF7]/80 pt-32 pb-12 px-4 rounded-t-[3rem] mt-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Massive CTA */}
        <div className="flex flex-col items-center text-center mb-32 pb-16 border-b border-white/10">
          <h2 className="font-serif text-[clamp(3rem,5vw,5rem)] text-white mb-6 leading-tight max-w-4xl">
            Start your first meeting in seconds.
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl font-sans">
            Join thousands of teams upgrading their communication infrastructure. No installs. Free to start.
          </p>
          <button className="bg-white text-[#0a1f16] px-10 py-5 rounded-full font-bold text-xl transition-transform duration-700 ease-out active:scale-95 hover:bg-[#FDFBF7]">
            Create free account
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-8 mb-24">
          
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-[2px] mb-6">
              <div className="relative w-10 h-10 shrink-0 mr-1">
                <div className="absolute inset-0 rounded-full border-[5px] border-[#3FB27A]"></div>
                <div className="absolute inset-0 animate-[spin_7s_linear_infinite]">
                  {/* Dot with a dark green shadow matching the footer background to cut the green ring */}
                  <div className="absolute top-[-4px] left-1/2 -ml-[5px] w-2.5 h-2.5 rounded-full bg-[#ECEDF0] shadow-[0_0_0_4px_#0a1f16]"></div>
                </div>
              </div>
              <div 
                style={{ fontFamily: "'Almaden Sans', 'Instrument Sans', system-ui, sans-serif" }} 
                className="text-4xl font-semibold tracking-[-0.05em] leading-[0.9] text-white"
              >
                rbit
              </div>
            </Link>
            <p className="text-sm text-[#FDFBF7]/60 leading-relaxed max-w-xs">
              Professional video calling with AI-powered summaries, action items, and cinematic immersion.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6 uppercase tracking-widest text-xs">Product</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6 uppercase tracking-widest text-xs">Company</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6 uppercase tracking-widest text-xs">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <IconBrandX size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <IconBrandGithub size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <IconBrandLinkedin size={18} />
              </a>
            </div>
            
            <div className="mt-8">
              <h4 className="text-white font-medium mb-4 uppercase tracking-widest text-xs">Subscribe</h4>
              <div className="flex p-1 rounded-full bg-white/5 ring-1 ring-white/10 focus-within:ring-white/30 transition-all">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-transparent border-none outline-none text-sm px-4 w-full placeholder:text-white/40 text-white"
                />
                <button className="bg-white text-[#0a1f16] px-4 py-2 rounded-full text-xs font-bold hover:bg-[#FDFBF7] transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-xs text-[#FDFBF7]/40">
          <p>© {new Date().getFullYear()} Orbit Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
