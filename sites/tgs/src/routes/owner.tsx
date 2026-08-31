import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Sun, 
  Moon, 
  Mail, 
  Upload, 
  FileText, 
  Archive, 
  Sparkles, 
  Shield, 
  Zap, 
  UserPlus, 
  X, 
  Crown, 
  Terminal, 
  FileCheck, 
  ShieldCheck, 
  Lock 
} from "lucide-react";
import { ASCLOUD_HOSTING_URL } from "../lib/constants";

export const Route = createFileRoute("/owner")({
  component: OwnerPage,
});

export function OwnerPage({ embed = false }: { embed?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [showQueenPopup, setShowQueenPopup] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    if (embed) return;
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, [embed]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleRequestAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim();
    if (!cleanUsername) return;

    if (cleanUsername.toLowerCase() === "suhu") {
      setShowQueenPopup(true);
      return;
    }

    const email = "skycho@proton.me";
    const subject = encodeURIComponent(`Private Account Request: ${cleanUsername}`);
    const body = encodeURIComponent(
      `Hello AS,\n\nI would like to request a private CLOUD account with the requested username:\n\nUsername: ${cleanUsername}\n\nPlease let me know when it is ready.\n\nBest regards.`
    );
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setShowAccountModal(false);
    setUsernameInput("");
  };

  const features = [
    { icon: Upload, title: "File Cloud", desc: "Upload any file and get instant shareable links with permanent or temporary storage." },
    { icon: FileText, title: "Quick Notes", desc: "Write and publish anonymous notes with short shareable links. No sign-up needed." },
    { icon: Archive, title: "Media Convert", desc: "Convert audio and video files between formats directly in your browser." },
    { icon: Sparkles, title: "Claude AI Assistant", desc: "Access Claude 4.5 Haiku AI for writing, coding, and reasoning tasks." },
  ];

  const content = (
    <>
      <style>{`
        @keyframes blossomFall {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(250px) translateX(50px) rotate(360deg) scale(1.1);
            opacity: 0;
          }
        }
        .blossom-petal {
          position: absolute;
          animation: blossomFall 4s linear infinite;
          pointer-events: none;
          color: #ffb7c5;
          text-shadow: 0 0 6px rgba(255, 183, 197, 0.6);
        }
        @keyframes triSpinCW {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes triSpinCCW {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes ownerPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        .owner-pulse-anim {
          animation: ownerPulse 4s ease-in-out infinite;
        }
      `}</style>

      <section className={`flex-1 flex flex-col w-full gap-6 relative ${embed ? "py-2" : "px-4 py-8 sm:py-12 max-w-3xl mx-auto"}`}>
        
        {/* Centerpiece Visual Spinning Triangle Animation (EWON) - Responsive Sizing */}
        <div className="flex justify-center items-center select-none py-2 relative z-10">
          <div className="relative w-28 h-28 sm:w-40 sm:h-40 flex items-center justify-center">
            
            <svg className="absolute w-28 h-28 sm:w-40 sm:h-40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="triGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#a78bfa" }} />
                  <stop offset="100%" style={{ stopColor: "#f87171" }} />
                </linearGradient>
                <linearGradient id="triGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#c4b5fd" }} />
                  <stop offset="100%" style={{ stopColor: "#818cf8" }} />
                </linearGradient>
                <linearGradient id="triGrad3" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#f9a8d4" }} />
                  <stop offset="100%" style={{ stopColor: "#a78bfa" }} />
                </linearGradient>
                <filter id="triGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(167,139,250,0.08)" strokeWidth="1" strokeDasharray="4 8" />
              
              <g style={{ transformOrigin: "100px 100px", animation: "triSpinCW 12s linear infinite" }}>
                <polygon points="100,22 160,138 40,138" fill="none" stroke="url(#triGrad1)" strokeWidth="2" filter="url(#triGlow)" />
              </g>
              
              <g style={{ transformOrigin: "100px 100px", animation: "triSpinCCW 12s linear infinite" }}>
                <polygon points="100,22 160,138 40,138" fill="none" stroke="url(#triGrad2)" strokeWidth="1.5" filter="url(#triGlow)" />
              </g>
              
              <g style={{ transformOrigin: "100px 100px", animation: "triSpinCW 24s linear infinite" }}>
                <polygon points="100,15 170,145 30,145" fill="none" stroke="url(#triGrad3)" strokeWidth="1" opacity="0.4" />
              </g>
              
              <g style={{ transformOrigin: "100px 100px", animation: "triSpinCCW 6s linear infinite" }}>
                <polygon points="100,35 145,128 55,128" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              </g>
              
              <circle cx="100" cy="100" r="3" fill="rgba(167,139,250,0.5)">
                <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
              </circle>

              <g style={{ transformOrigin: "100px 100px", animation: "triSpinCW 8s linear infinite" }}>
                <circle cx="100" cy="12" r="2" fill="#a78bfa" />
              </g>
              <g style={{ transformOrigin: "100px 100px", animation: "triSpinCCW 12s linear infinite" }}>
                <circle cx="100" cy="12" r="1.5" fill="#f87171" />
              </g>
            </svg>

            <span className="relative z-30 font-black text-[22px] sm:text-[32px] tracking-[3px] bg-gradient-to-br from-purple-400 to-white bg-clip-text text-transparent select-none">
              AS
            </span>
          </div>

          <div className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-purple-500/5 filter blur-xl owner-pulse-anim -z-10" />
        </div>

        {/* Hero */}
        <div className="space-y-4 text-center">
          <h2 className="text-[36px] sm:text-[44px] md:text-[52px] font-black tracking-tighter leading-[1.05] bg-gradient-to-r from-foreground via-purple-400 to-foreground bg-clip-text text-transparent">
            CLOUD
          </h2>
          <p className="text-[14px] sm:text-[15px] leading-relaxed text-muted-foreground font-medium max-w-xl mx-auto">
            A premium Web OS for secure file sharing, anonymous note publishing, media conversion, and AI assistance — all inside a clean, minimal interface. No sign-ups, no tracking, no clutter.
          </p>
        </div>

        <div className="w-12 h-[2px] bg-purple-500 mx-auto" />

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="rounded-[20px] border border-border/40 bg-secondary/10 p-5 space-y-2.5 hover:border-purple-500/30 transition-colors">
                <div className="size-10 rounded-[12px] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Icon className="size-5 text-purple-500" />
                </div>
                <h4 className="text-[14px] font-black tracking-tight">{f.title}</h4>
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-border/40 bg-secondary/10 p-5 flex items-start gap-3.5">
            <Shield className="size-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-[13px] font-black tracking-tight">Privacy First</h4>
              <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">No accounts, no cookies, no analytics. Files are stored via encrypted CDN endpoints. Notes are anonymous by default.</p>
            </div>
          </div>
          <div className="rounded-[20px] border border-border/40 bg-secondary/10 p-5 flex items-start gap-3.5">
            <Zap className="size-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-[13px] font-black tracking-tight">Built for Speed</h4>
              <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">Deployed on edge workers globally. Instant page loads, smooth 60fps animations, and responsive across all devices.</p>
            </div>
          </div>
        </div>

        {/* Actions & Contact */}
        <div className="text-center pt-4 select-none space-y-4">
          <p className="text-[12px] text-muted-foreground font-bold">Built by <strong className="text-foreground">AS</strong></p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a 
              href="mailto:skycho@proton.me" 
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-foreground text-background font-bold text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md w-full sm:w-auto justify-center"
            >
              <Mail className="size-4" />
              <span>skycho@proton.me</span>
            </a>
            
            <button
              onClick={() => setShowAccountModal(true)}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 font-bold text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md w-full sm:w-auto justify-center"
            >
              <UserPlus className="size-4" />
              <span>Create Private Account</span>
            </button>

            <button
              onClick={() => setShowPolicyModal(true)}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 font-bold text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md w-full sm:w-auto justify-center"
            >
              <FileCheck className="size-4" />
              <span>Privacy & Terms Policy</span>
            </button>

            <Link
              to="/db-console"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md w-full sm:w-auto justify-center"
            >
              <Terminal className="size-4" />
              <span>Developer Mode</span>
            </Link>
          </div>
        </div>

        {/* Modal: Create Private Account Request */}
        {showAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md rounded-[24px] border border-border bg-secondary/95 p-6 shadow-2xl relative overflow-hidden ios-glass animate-spring-scale select-text">
              <button 
                onClick={() => setShowAccountModal(false)}
                className="absolute top-4 right-4 size-8 rounded-full bg-background/50 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>

              <h3 className="text-[20px] font-black tracking-tight flex items-center gap-2 text-purple-400">
                <UserPlus className="size-5" />
                <span>Request Account</span>
              </h3>
              <p className="text-[12.5px] text-muted-foreground mt-2 leading-relaxed">
                Choose your unique username. We will prepare an automated email request to AS to set up your account.
              </p>

              <form onSubmit={handleRequestAccount} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">Desired Username</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter username..."
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full h-11 bg-background border border-border/40 rounded-[14px] px-4 text-[13px] font-bold text-foreground outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-[14px] bg-purple-600 hover:bg-purple-500 text-white font-black text-[13px] hover:scale-[1.01] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/10"
                >
                  Generate Request Mail
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: reserved Queen Popup */}
        {showQueenPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm rounded-[24px] border border-pink-500/40 bg-[#160b10]/95 p-6 shadow-2xl relative overflow-hidden ios-glass animate-spring-scale text-center border-t-2 border-t-pink-500">
              
              {/* Falling Cherry Blossoms */}
              {Array.from({ length: 15 }).map((_, i) => (
                <span 
                  key={i} 
                  className="blossom-petal"
                  style={{
                    left: `${Math.random() * 85}%`,
                    top: `${-20 - Math.random() * 30}px`,
                    animationDelay: `${Math.random() * 3.5}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                    fontSize: `${12 + Math.random() * 12}px`
                  }}
                >
                  🌸
                </span>
              ))}

              <div className="mx-auto size-14 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4">
                <Crown className="size-7 text-pink-400 animate-pulse" />
              </div>

              <h4 className="text-[17px] font-black tracking-tight text-pink-300 flex items-center justify-center gap-1.5">
                <Sparkles className="size-4 text-pink-400" />
                Reserved Username
              </h4>
              
              <p className="text-[14px] text-pink-100/90 mt-3 leading-relaxed font-bold px-2">
                This username is reserved in honor of Her Majesty the Queen. 🌸👑
              </p>

              <button
                onClick={() => {
                  setShowQueenPopup(false);
                  setShowAccountModal(false);
                  setUsernameInput("");
                }}
                className="mt-6 w-full h-10 rounded-[14px] bg-pink-600 hover:bg-pink-500 text-white font-bold text-[12.5px] transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                Accept Majesty
              </button>
            </div>
          </div>
        )}

        {/* Modal: Privacy & Terms Policy */}
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-2xl max-h-[85vh] rounded-[24px] border border-border bg-secondary/95 p-6 shadow-2xl relative flex flex-col ios-glass animate-spring-scale select-text overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/40 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-black tracking-tight text-foreground">Privacy & Terms Policy</h3>
                    <p className="text-[11px] text-muted-foreground">Official System Guidelines & Security Architecture</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPolicyModal(false)}
                  className="size-8 rounded-full bg-background/50 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Policy Document Content */}
              <div className="flex-1 overflow-y-auto py-5 px-1 space-y-6 text-[13px] text-muted-foreground leading-relaxed scrollbar-thin">
                
                {/* Effective Date & Notice */}
                <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11.5px] font-medium flex items-start gap-2.5">
                  <Lock className="size-4 text-sky-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Last Updated: July 2026</strong> — This policy outlines the security standards, data handling procedures, and terms of service governing the Cloud OS Space platform and its edge utilities.
                  </div>
                </div>

                {/* Section 1 */}
                <div className="space-y-2">
                  <h4 className="text-[14px] font-black text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center">1</span>
                    Core Privacy Philosophy & Zero-Tracking Commitment
                  </h4>
                  <p>
                    Cloud OS Space is architected under a strict privacy-first directive. We do not track users across the web, sell data to third-party ad brokers, or deploy invasive analytics tracking scripts. Access to all public services—including File Cloud, Quick Notes, Media Convert, YT Downloader, and TempChat—is granted anonymously by default without requiring personal information or mandatory registration.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="space-y-2">
                  <h4 className="text-[14px] font-black text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center">2</span>
                    Data Logging, IP Records & Cloud Account Persistence
                  </h4>
                  <p>
                    To maintain network security, prevent automated abuse, and enable cross-session activity history for registered users:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[12.5px]">
                    <li><strong>Anonymous Interactions:</strong> Requests are logged to secure backend cloud audit tables (<code className="text-purple-400 font-mono font-bold">AS CLOUD SYSTEM</code>) capturing basic action metadata and the origin IP address for threat prevention.</li>
                    <li><strong>Registered Cloud Accounts:</strong> Users who create a private Cloud Account will have their user ID associated with their action history and IP address to allow activity synchronization across mobile and desktop devices.</li>
                    <li><strong>Data Retention:</strong> Audit histories are trimmed periodically and maintained strictly for operational security and personal dashboard syncing.</li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div className="space-y-2">
                  <h4 className="text-[14px] font-black text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center">3</span>
                    File Cloud & Media Conversion Standards
                  </h4>
                  <p>
                    Files uploaded via the File Cloud utility are processed through secure CDN endpoints. Media conversions (audio/video transcode) execute locally within client browser web assembly instances whenever possible, minimizing server storage overhead. Uploaded public assets are assigned randomly generated slugs and are subject to CDN expiration policies.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="space-y-2">
                  <h4 className="text-[14px] font-black text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center">4</span>
                    TempChat Ephemeral Messaging & Room Auto-Destruction
                  </h4>
                  <p>
                    TempChat operates on an ephemeral room lifecycle:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[12.5px]">
                    <li><strong>Admin Room Lifetime:</strong> The room administrator controls room existence. When the room admin leaves, the entire room, member list, and all associated messages are permanently purged.</li>
                    <li><strong>Media Attachments:</strong> Media sent in TempChat rooms is stored temporarily in isolated storage buffers to facilitate seamless streaming between room participants.</li>
                    <li><strong>Reserved Identifier Protection:</strong> System usernames and designated protected aliases are permanently reserved by system administration.</li>
                  </ul>
                </div>

                {/* Section 5 */}
                <div className="space-y-2">
                  <h4 className="text-[14px] font-black text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center">5</span>
                    Custom Link Shortener & Redirection Policies
                  </h4>
                  <p>
                    The Link Shortener permits users to generate custom short aliases pointing to external URLs. Short links pointing to malicious software, phishing pages, or illegal content are strictly prohibited and will be deactivated immediately upon discovery. Reserved core application routes cannot be claimed as short link slugs.
                  </p>
                </div>

                {/* Section 6 */}
                <div className="space-y-2">
                  <h4 className="text-[14px] font-black text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center">6</span>
                    Acceptable Use & Terms of Service
                  </h4>
                  <p>
                    By accessing or using Cloud OS Space services, you agree not to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[12.5px]">
                    <li>Use the platform for distribution of malware, ransomware, or unauthorized exploits.</li>
                    <li>Attempt denial-of-service (DoS/DDoS) attacks against edge routing nodes.</li>
                    <li>Engage in automated scraping or spamming of temporary communication channels.</li>
                  </ul>
                </div>

                {/* Section 7 */}
                <div className="space-y-2">
                  <h4 className="text-[14px] font-black text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center">7</span>
                    Contact & Administrative Inquiries
                  </h4>
                  <p>
                    For privacy inquiries, security reports, or private cloud node requests, contact system administration directly at <code className="text-purple-400 font-bold">skycho@proton.me</code>.
                  </p>
                </div>

              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-border/40 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setShowPolicyModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-foreground text-background font-black text-[12.5px] hover:opacity-90 transition-opacity"
                >
                  I Understand & Accept
                </button>
              </div>

            </div>
          </div>
        )}

      </section>
    </>
  );

  if (embed) return content;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative">
      <header className="px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between max-w-2xl md:max-w-6xl mx-auto w-full border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/80">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto">
          <Link to="/" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
            CLOUD
          </Link>
          <Link to="/note" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
            NOTES
          </Link>
          <Link to="/convert" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
            CONVERTS
          </Link>
          <Link to="/owner" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none flex-shrink-0">
            ABOUT
          </Link>
          <a 
            href={ASCLOUD_HOSTING_URL} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-80 hover:opacity-100 transition-opacity flex-shrink-0 text-amber-400 flex items-center gap-1"
            title="AS Cloud Hosting Subsite"
          >
            <span>HOSTING</span>
            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
              DEV
            </span>
          </a>
        </div>

        <button 
          onClick={toggleTheme}
          className="size-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-90 flex-shrink-0 ml-3"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </header>

      {content}
    </main>
  );
}
