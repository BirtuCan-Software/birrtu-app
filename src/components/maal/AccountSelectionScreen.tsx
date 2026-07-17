import React, { useState, useEffect } from "react";
import { useAccount } from "@/lib/accounts";
import { Link } from "@/lib/router";
import { AnimatePresence, motion } from "motion/react";
import DotField from "./DotField";
import { 
  Shield, 
  RefreshCw, 
  KeyRound, 
  AlertCircle, 
  ArrowRight, 
  Wallet, 
  Lock, 
  CheckCircle2, 
  Globe, 
  Plus, 
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Sparkles,
  Home,
  List,
  Settings as SettingsIcon,
  Search,
  Moon,
  Sun,
  ChevronRight,
  User,
  Smartphone,
  Landmark,
  Edit2,
  Trash2,
  Mail,
  Laptop,
  Check,
  Download,
  Upload,
  Github
} from "lucide-react";

export function AccountSelectionScreen() {
  const { googleSignIn, isLoggingIn, guestSignIn } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"landing" | "login">("landing");
  const [landingTheme, setLandingTheme] = useState<"dark" | "light">("dark");

  // State for FAQ Accordions
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // State for High-Fidelity Mobile App Mockup Showcase
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isManualPause, setIsManualPause] = useState(false);

  // Handle auto-rotation timer
  useEffect(() => {
    if (isManualPause) return;
    const interval = setInterval(() => {
      setActivePageIndex((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, [isManualPause]);

  // Handle resetting manual pause countdown after interaction
  useEffect(() => {
    if (!isManualPause) return;
    const timer = setTimeout(() => {
      setIsManualPause(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isManualPause, activePageIndex]);

  const handleTabClick = (index: number) => {
    setActivePageIndex(index);
    setIsManualPause(true);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const res = await googleSignIn();
    if (!res.success) {
      setError(res.error || "An error occurred during Google Sign-In.");
    }
  };

  const handleGuestSignIn = () => {
    setError(null);
    guestSignIn();
  };

  const scrollContainerToTop = () => {
    setTimeout(() => {
      document.getElementById("landing-scroll-container")?.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  const faqItems = [
    {
      q: "Where is my financial data stored?",
      a: "BirrTu is built local-first. All your account details, physical cash records, and transaction history are stored entirely within your browser's private and secure local sandbox storage. No third-party remote servers or corporate databases can ever capture, monitor, or access your financial records."
    },
    {
      q: "Does BirrTu link directly to my real Ethiopian bank accounts?",
      a: "No. BirrTu is a private manual ledger designed for maximum security, flexibility, and absolute privacy. You log your transactions manually or select easy templates. No passwords, API keys, or banking credentials are ever requested or stored."
    },
    {
      q: "How does the Google Drive Sync work?",
      a: "When you sign in and enable sync, BirrTu backs up your encrypted transactions directly to your personal Google Drive account. Crucially, it stores them in a secure private application storage space. This space is completely isolated and invisible to any other application or third party, remaining strictly private to your BirrTu app."
    },
    {
      q: "Is BirrTu free to use?",
      a: "Yes! BirrTu is 100% free, free of tracking scripts, and completely open. It is engineered with the sole focus of providing Ethiopian digital finance trackers with the cleanest, safest offline ledger tool possible."
    }
  ];

  const getTabSelectorClass = (index: number) => {
    const isActive = activePageIndex === index;
    if (landingTheme === "light") {
      return isActive
        ? "bg-[#ff5a1f]/10 border-[#ff5a1f] text-[#ff5a1f]"
        : "bg-white border-zinc-200 hover:border-zinc-300 hover:text-zinc-700 text-zinc-500 shadow-sm shadow-zinc-100/50";
    } else {
      return isActive
        ? "bg-[#ff5a1f]/10 border-[#ff5a1f] text-white"
        : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400";
    }
  };

  return (
    <div 
      id="landing-scroll-container" 
      className={`h-dvh overflow-y-auto font-sans flex flex-col relative overflow-x-hidden transition-colors duration-300 ${
        landingTheme === "light"
          ? "bg-[#fafafc] text-zinc-800 selection:bg-[#ff5a1f]/30 selection:text-zinc-900"
          : "bg-[#0a0b0f] text-zinc-100 selection:bg-[#ff5a1f] selection:text-black"
      }`}
    >
      {/* Interactive Orange DotField Background */}
      {view === "landing" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-300 opacity-100">
          <DotField
            dotRadius={1.6}
            dotSpacing={16}
            bulgeStrength={50}
            glowRadius={180}
            sparkle={true}
            waveAmplitude={2}
            gradientFrom={landingTheme === "light" ? "rgba(255, 90, 31, 0.85)" : "rgba(255, 90, 31, 0.90)"}
            gradientTo={landingTheme === "light" ? "rgba(255, 136, 63, 0.65)" : "rgba(255, 136, 63, 0.70)"}
            glowColor={landingTheme === "light" ? "#fbeee7" : "#1f0f08"}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 sm:px-6 flex items-center justify-between transition-colors duration-300 ${
        landingTheme === "light"
          ? "bg-[#fafafc]/80 border-zinc-200/80 text-zinc-800"
          : "bg-[#0a0b0f]/80 border-zinc-800/60 text-zinc-100"
      }`}>
        <button
          onClick={() => {
            setView("landing");
            setError(null);
            scrollContainerToTop();
          }}
          className="flex items-center gap-2 cursor-pointer group focus:outline-none bg-transparent border-none p-0"
        >
          <img 
            src="/logo.png" 
            alt="BirrTu" 
            className="h-8 w-8 object-contain group-hover:scale-105 transition-transform" 
          />
          <span 
            className={`text-sm font-black tracking-wider uppercase transition-colors duration-300 ${
              landingTheme === "light" ? "text-zinc-800 group-hover:text-zinc-950" : "text-zinc-200 group-hover:text-white"
            }`} 
            style={{ fontFamily: "var(--font-display)" }}
          >
            BirrTu
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Landing Theme Toggle */}
          <button
            onClick={() => setLandingTheme(prev => prev === "dark" ? "light" : "dark")}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
              landingTheme === "light"
                ? "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/80"
            }`}
            title={landingTheme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {landingTheme === "light" ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {view === "landing" ? (
            <button 
              onClick={() => {
                setView("login");
                setError(null);
                scrollContainerToTop();
              }}
              className="text-xs font-bold px-3 py-1.5 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 border border-transparent rounded-lg cursor-pointer transition-all text-white shadow-md shadow-[#ff5a1f]/10 hover:scale-[1.02]"
            >
              Sign In / Web App
            </button>
          ) : (
            <button 
              onClick={() => {
                setView("landing");
                setError(null);
                scrollContainerToTop();
              }}
              className={`text-xs font-bold px-3 py-1.5 border rounded-lg cursor-pointer transition-all ${
                landingTheme === "light"
                  ? "border-zinc-300 hover:border-zinc-400 text-zinc-600 hover:text-zinc-900 bg-white"
                  : "border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white"
              }`}
            >
              Back to Home
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div
              key="landing-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-5xl px-4 py-12 sm:px-8 flex flex-col gap-16 relative z-10"
            >
              {/* HERO SECTION */}
              <div className="text-center space-y-6 max-w-3xl mx-auto pt-8">
                <h1 
                  className={`text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] transition-colors duration-300 ${
                    landingTheme === "light" ? "text-zinc-900" : "text-white"
                  }`} 
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Take Absolute Command of Your <span className="text-[#ff5a1f]">Birr.</span>
                </h1>
                
                <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed transition-colors duration-300 ${
                  landingTheme === "light" ? "text-zinc-600" : "text-zinc-400"
                }`}>
                  BirrTu is an offline-first financial ledger designed specifically for Ethiopia. Track bank wallets like CBE, Telebirr, cash pouches, and custom digital cards without server trackers or privacy leaks.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button
                    onClick={() => {
                      setView("login");
                      scrollContainerToTop();
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 text-white font-bold rounded-xl shadow-lg shadow-[#ff5a1f]/20 flex items-center justify-center gap-2 group transition-all transform hover:scale-[1.02]"
                  >
                    <span>Launch Web App</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="#simulator"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-full sm:w-auto px-6 py-3.5 border rounded-xl font-bold flex items-center justify-center transition-all duration-300 ${
                      landingTheme === "light"
                        ? "border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 shadow-sm"
                        : "border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white"
                    }`}
                  >
                    Explore Live Demo
                  </a>
                </div>
              </div>

              {/* LIVE HIGH-FIDELITY MOBILE APP SHOWCASE */}
              <div 
                id="simulator" 
                className={`space-y-8 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border max-w-5xl w-full mx-auto transition-colors duration-300 ${
                  landingTheme === "light"
                    ? "bg-white border-zinc-200 shadow-md text-zinc-800"
                    : "bg-zinc-950/40 border-zinc-800/80 text-white"
                }`}
              >
                <div className="text-center space-y-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#ff5a1f] font-mono">Live Showroom</span>
                  <h3 
                    className={`text-2xl sm:text-3xl font-black px-2 transition-colors duration-300 ${
                      landingTheme === "light" ? "text-zinc-900" : "text-white"
                    }`} 
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Explore the Live App Interface
                  </h3>
                  <p className={`text-xs sm:text-sm max-w-lg mx-auto px-4 transition-colors duration-300 ${
                    landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"
                  }`}>
                    See exactly how BirrTu operates on your phone. Replicated here in high-fidelity with automatic and manual interactive swiping.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
                  
                  {/* Left Column - Detailed active screen details and manual control buttons */}
                  <div className="lg:col-span-5 space-y-6 order-last lg:order-first">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded bg-[#ff5a1f]/10 text-[#ff5a1f] font-mono">
                          TAB 0{activePageIndex + 1} OF 04
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className={`text-[10px] font-bold uppercase tracking-wider font-mono transition-colors duration-300 ${
                          landingTheme === "light" ? "text-zinc-400" : "text-zinc-500"
                        }`}>
                          Live Sandbox Mode
                        </span>
                      </div>

                      <h4 className={`text-xl font-black font-sans transition-colors duration-300 ${
                        landingTheme === "light" ? "text-zinc-900" : "text-white"
                      }`}>
                        {activePageIndex === 0 && "Personal Capital Dashboard"}
                        {activePageIndex === 1 && "Audit-Ready Transaction Activity"}
                        {activePageIndex === 2 && "Flexible Multi-Wallet Vault"}
                        {activePageIndex === 3 && "Secure Private Settings"}
                      </h4>

                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                        landingTheme === "light" ? "text-zinc-600" : "text-zinc-400"
                      }`}>
                        {activePageIndex === 0 && "A unified overview of your entire net worth in Ethiopia. Features a responsive net capital card, a dual-column directory of cash or bank wallets (CBE, Telebirr), a live-rendered transaction feed, and daily spending trend tracking."}
                        {activePageIndex === 1 && "The core of your financial accounting. Instant, offline transaction searching and categorical filters let you browse through years of records in milliseconds. High-contrast indicators tag cash flows cleanly."}
                        {activePageIndex === 2 && "Establish specific ledger cards for your bank accounts, mobile apps, or cash pouches. Includes live dynamic allocation metrics so you can analyze where your money is grouped across different wallets."}
                        {activePageIndex === 3 && "Complete authority over your setup. Connect Google Drive for encrypted cloud synchronization, set a biometric security passkey, select visual design presets (Tangelo, Obsidian), or export local database backups."}
                      </p>
                    </div>

                    {/* Explanatory bullet highlights */}
                    <div className={`space-y-3 p-4 rounded-2xl border transition-colors duration-300 ${
                      landingTheme === "light"
                        ? "bg-zinc-50 border-zinc-100"
                        : "bg-zinc-900/50 border-zinc-800/80"
                    }`}>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Key Capability Highlights</div>
                      {activePageIndex === 0 && (
                        <>
                          <div className="flex items-start gap-2.5 text-xs">
                            <CheckCircle2 size={14} className="text-[#ff5a1f] shrink-0 mt-0.5" />
                            <span className={`font-medium font-sans transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Auto-aggregating multi-wallet balance calculators.</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-xs">
                            <CheckCircle2 size={14} className="text-[#ff5a1f] shrink-0 mt-0.5" />
                            <span className={`font-medium font-sans transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Staggered feed highlighting recent transaction entries.</span>
                          </div>
                        </>
                      )}
                      {activePageIndex === 1 && (
                        <>
                          <div className="flex items-start gap-2.5 text-xs">
                            <CheckCircle2 size={14} className="text-[#ff5a1f] shrink-0 mt-0.5" />
                            <span className={`font-medium font-sans transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Categorized cash-flow logs grouped by month.</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-xs">
                            <CheckCircle2 size={14} className="text-[#ff5a1f] shrink-0 mt-0.5" />
                            <span className={`font-medium font-sans transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Clean search bars and tag filters with zero cloud tracking.</span>
                          </div>
                        </>
                      )}
                      {activePageIndex === 2 && (
                        <>
                          <div className="flex items-start gap-2.5 text-xs">
                            <CheckCircle2 size={14} className="text-[#ff5a1f] shrink-0 mt-0.5" />
                            <span className={`font-medium font-sans transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Dedicated bank cards supporting customized balances.</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-xs">
                            <CheckCircle2 size={14} className="text-[#ff5a1f] shrink-0 mt-0.5" />
                            <span className={`font-medium font-sans transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Visual percentage bar reflecting your asset weight spread.</span>
                          </div>
                        </>
                      )}
                      {activePageIndex === 3 && (
                        <>
                          <div className="flex items-start gap-2.5 text-xs">
                            <CheckCircle2 size={14} className="text-[#ff5a1f] shrink-0 mt-0.5" />
                            <span className={`font-medium font-sans transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Private Google Drive sync folder using appdata scope.</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-xs">
                            <CheckCircle2 size={14} className="text-[#ff5a1f] shrink-0 mt-0.5" />
                            <span className={`font-medium font-sans transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-300"}`}>Biometric PIN screens, custom styling and font configurations.</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Navigation controllers */}
                    <div className="space-y-2 pt-2">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Manual Tab Selector</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleTabClick(0)}
                          className={`px-3 py-2 text-left rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${getTabSelectorClass(0)}`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Home size={13} className="shrink-0" />
                            <span className="truncate">1. Home Overview</span>
                          </div>
                          <ChevronRight size={12} className={activePageIndex === 0 ? "opacity-100 shrink-0" : "opacity-40 shrink-0"} />
                        </button>
                        <button
                          onClick={() => handleTabClick(1)}
                          className={`px-3 py-2 text-left rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${getTabSelectorClass(1)}`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <List size={13} className="shrink-0" />
                            <span className="truncate">2. Ledger Logs</span>
                          </div>
                          <ChevronRight size={12} className={activePageIndex === 1 ? "opacity-100 shrink-0" : "opacity-40 shrink-0"} />
                        </button>
                        <button
                          onClick={() => handleTabClick(2)}
                          className={`px-3 py-2 text-left rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${getTabSelectorClass(2)}`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Wallet size={13} className="shrink-0" />
                            <span className="truncate">3. Wallets Vault</span>
                          </div>
                          <ChevronRight size={12} className={activePageIndex === 2 ? "opacity-100 shrink-0" : "opacity-40 shrink-0"} />
                        </button>
                        <button
                          onClick={() => handleTabClick(3)}
                          className={`px-3 py-2 text-left rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${getTabSelectorClass(3)}`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <SettingsIcon size={13} className="shrink-0" />
                            <span className="truncate">4. App Settings</span>
                          </div>
                          <ChevronRight size={12} className={activePageIndex === 3 ? "opacity-100 shrink-0" : "opacity-40 shrink-0"} />
                        </button>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium italic text-center lg:text-left mt-1">
                        💡 Auto-swipes every 3 seconds. Tap any option above or tab in the phone to pause and explore!
                      </div>
                    </div>
                  </div>

                  {/* Right Column - The Phone Mockup */}
                  <div className="lg:col-span-7 flex justify-center py-4 relative">
                    
                    {/* Shadow decor */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#ff5a1f]/10 via-transparent to-purple-500/5 rounded-full blur-3xl -z-10 max-w-sm mx-auto" />

                    {/* Realistic phone mockup frame */}
                    <div 
                      className="w-[300px] sm:w-[330px] h-[580px] sm:h-[640px] rounded-[38px] border-[10px] shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border-strong)",
                        boxShadow: "var(--shadow-lg)",
                      }}
                    >
                      
                      {/* Speaker grill & camera Notch */}
                      <div 
                        className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4.5 rounded-full z-50 flex items-center justify-center animate-pulse"
                        style={{
                          background: "var(--bg-surface-raised)",
                          border: "1px solid var(--border-subtle)"
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-black ml-auto mr-3 border border-zinc-800" /> {/* Camera lens */}
                        <div className="w-8 h-0.75 bg-zinc-950 rounded-full mr-auto" /> {/* Speaker slit */}
                      </div>

                      {/* Phone internal status bar */}
                      <div 
                        className="h-9 pt-1.5 px-6 flex justify-between items-center text-[10px] font-bold z-40 shrink-0 font-mono"
                        style={{
                          background: "var(--bg-base)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span>12:30</span>
                        <div className="flex items-center gap-1">
                          <span>LTE</span>
                          <span className="w-2.5 h-1.5 rounded-xs inline-block" style={{ background: "var(--text-secondary)" }} />
                          <span>85%</span>
                        </div>
                      </div>

                      {/* Interactive Display Area */}
                      <div 
                        className="flex-1 flex flex-col overflow-hidden relative"
                        style={{
                          background: "var(--bg-base)",
                          color: "var(--text-primary)",
                        }}
                      >
                        
                        {/* Mock AppHeader - Identical to AppHeader.tsx inside */}
                        <header
                          className="flex items-center justify-between px-3.5 py-2 shrink-0 z-40"
                          style={{
                            background: "var(--bg-base)",
                            borderBottom: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <img src="/logo.png" alt="BirrTu" className="h-6.5 w-6.5 object-contain" />
                            <div className="flex flex-col">
                              <span
                                className="text-[11px] font-bold tracking-tight leading-tight"
                                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                              >
                                BirrTu
                              </span>
                              <span className="text-[8px] font-bold leading-none mt-0.5" style={{ color: "var(--accent-primary)" }}>
                                Personal
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* Sync badge replica */}
                            <span
                              className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1"
                              style={{
                                background: "var(--bg-surface-sunken)",
                                color: "var(--income-positive)",
                                border: "1px solid var(--border-subtle)",
                              }}
                            >
                              <div className="h-1 w-1 rounded-full animate-pulse" style={{ background: "var(--income-positive)" }} /> Synced
                            </span>
                            
                            {/* Theme button replica */}
                            <div
                              className="flex h-6.5 w-6.5 items-center justify-center rounded-full"
                              style={{
                                background: "var(--bg-surface-raised)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-primary)",
                              }}
                            >
                              <Sun size={11} className="hidden dark:block text-[var(--accent-primary)]" />
                              <Moon size={11} className="block dark:hidden" />
                            </div>
                          </div>
                        </header>

                        {/* Interactive Main screen view with swipe animations */}
                        <div className="flex-1 overflow-y-auto px-3.5 py-3 text-left relative scrollbar-none">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activePageIndex}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.25 }}
                              className="h-full space-y-4 pb-4"
                            >
                              {/* PAGE 1: HOME PREVIEW */}
                              {activePageIndex === 0 && (
                                <>
                                  {/* Net Balance card */}
                                  <section 
                                    className="shadow-hard-md rounded-[16px] p-4 text-left" 
                                    style={{ 
                                      background: "var(--bg-surface)", 
                                      border: "1px solid var(--border-subtle)" 
                                    }}
                                  >
                                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      Net Balance
                                    </div>
                                    <div className="mt-1.5 flex items-baseline gap-1.5">
                                      <span className="tabular text-2xl font-bold leading-none" style={{ color: "var(--text-primary)" }}>
                                        25,320.00
                                      </span>
                                      <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                                        ETB
                                      </span>
                                    </div>
                                  </section>

                                  {/* Wallets header */}
                                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                    Wallets
                                  </div>

                                  {/* Wallets grid */}
                                  <div className="grid grid-cols-2 gap-2.5">
                                    {/* CBE WalletCard */}
                                    <div 
                                      className="shadow-hard-md flex flex-col justify-between rounded-[16px] p-3 text-left" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)", 
                                        minHeight: 96 
                                      }}
                                    >
                                      <div className="flex items-start justify-between">
                                        <span 
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px]" 
                                          style={{ 
                                            background: "var(--bg-surface-sunken)", 
                                            color: "var(--accent-primary)", 
                                            border: "1px solid var(--border-subtle)" 
                                          }}
                                        >
                                          <Landmark size={15} />
                                        </span>
                                        <span className="text-[8px] font-bold uppercase tracking-wider font-mono" style={{ color: "var(--text-secondary)" }}>
                                          CBE
                                        </span>
                                      </div>
                                      <div className="mt-2.5 truncate">
                                        <div className="text-[10px] font-semibold truncate" style={{ color: "var(--text-secondary)" }}>
                                          Commercial Bank
                                        </div>
                                        <div className="tabular mt-0.5 text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                                          14,250.00 ETB
                                        </div>
                                      </div>
                                    </div>

                                    {/* Telebirr WalletCard */}
                                    <div 
                                      className="shadow-hard-md flex flex-col justify-between rounded-[16px] p-3 text-left" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)", 
                                        minHeight: 96 
                                      }}
                                    >
                                      <div className="flex items-start justify-between">
                                        <span 
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px]" 
                                          style={{ 
                                            background: "var(--bg-surface-sunken)", 
                                            color: "var(--accent-primary)", 
                                            border: "1px solid var(--border-subtle)" 
                                          }}
                                        >
                                          <Smartphone size={15} />
                                        </span>
                                        <span className="text-[8px] font-bold uppercase tracking-wider font-mono" style={{ color: "var(--text-secondary)" }}>
                                          TELE
                                        </span>
                                      </div>
                                      <div className="mt-2.5 truncate">
                                        <div className="text-[10px] font-semibold truncate" style={{ color: "var(--text-secondary)" }}>
                                          Telebirr Wallet
                                        </div>
                                        <div className="tabular mt-0.5 text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                                          8,420.00 ETB
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Recent activity header */}
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider pt-1">
                                    <span style={{ color: "var(--text-secondary)" }}>Recent activity</span>
                                    <span className="text-[8px] font-mono font-bold hover:underline cursor-pointer" style={{ color: "var(--accent-primary)" }}>
                                      VIEW ALL →
                                    </span>
                                  </div>

                                  {/* Transaction list - matching TxRow */}
                                  <div className="space-y-2">
                                    {/* Salary Deposit */}
                                    <div 
                                      className="flex items-center gap-2.5 py-2 px-3 rounded-[12px]" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)" 
                                      }}
                                    >
                                      <div 
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]" 
                                        style={{ 
                                          background: "var(--bg-surface-sunken)", 
                                          color: "var(--income-positive)", 
                                          border: "1px solid var(--border-subtle)" 
                                        }}
                                      >
                                        <ArrowDownLeft size={14} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>
                                          Salary Deposit
                                        </div>
                                        <div className="text-[8px]" style={{ color: "var(--text-secondary)" }}>
                                          CBE Savings · Just now
                                        </div>
                                      </div>
                                      <div className="tabular text-right text-[10px] font-bold shrink-0" style={{ color: "var(--income-positive)" }}>
                                        + 15,000.00
                                      </div>
                                    </div>

                                    {/* Rent Payment */}
                                    <div 
                                      className="flex items-center gap-2.5 py-2 px-3 rounded-[12px]" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)" 
                                      }}
                                    >
                                      <div 
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]" 
                                        style={{ 
                                          background: "var(--bg-surface-sunken)", 
                                          color: "var(--expense-negative)", 
                                          border: "1px solid var(--border-subtle)" 
                                        }}
                                      >
                                        <ArrowUpRight size={14} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>
                                          Fuel Payment
                                        </div>
                                        <div className="text-[8px]" style={{ color: "var(--text-secondary)" }}>
                                          Telebirr Wallet · 2h ago
                                        </div>
                                      </div>
                                      <div className="tabular text-right text-[10px] font-bold shrink-0" style={{ color: "var(--expense-negative)" }}>
                                        − 1,200.00
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* PAGE 2: LEDGER PREVIEW */}
                              {activePageIndex === 1 && (
                                <>
                                  {/* Filter card */}
                                  <div className="space-y-2.5 text-left">
                                    <div className="flex items-center justify-between">
                                      <h2 className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                                        All activity
                                      </h2>
                                      <span 
                                        className="text-[8px] py-0.5 px-2 font-bold rounded-[6px]" 
                                        style={{ 
                                          background: "var(--bg-surface-raised)", 
                                          border: "1px solid var(--border-subtle)", 
                                          color: "var(--text-secondary)",
                                          boxShadow: "1px 1px 0 0 var(--border-strong)"
                                        }}
                                      >
                                        View Trends
                                      </span>
                                    </div>

                                    {/* Search input mockup */}
                                    <div 
                                      className="p-2 rounded-lg border flex items-center gap-2"
                                      style={{ 
                                        background: "var(--bg-surface-sunken)", 
                                        borderColor: "var(--border-subtle)" 
                                      }}
                                    >
                                      <Search size={11} style={{ color: "var(--text-secondary)" }} />
                                      <span className="text-[9px]" style={{ color: "var(--text-disabled)" }}>Search transactions...</span>
                                    </div>

                                    {/* Segmented control buttons */}
                                    <div className="flex gap-1.5">
                                      <span 
                                        className="px-2.5 py-0.5 rounded text-[8px] font-bold"
                                        style={{ background: "var(--accent-primary)", color: "var(--accent-primary-fg)" }}
                                      >
                                        All
                                      </span>
                                      <span 
                                        className="px-2.5 py-0.5 rounded text-[8px] font-bold border"
                                        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                                      >
                                        Income
                                      </span>
                                      <span 
                                        className="px-2.5 py-0.5 rounded text-[8px] font-bold border"
                                        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                                      >
                                        Expense
                                      </span>
                                    </div>
                                  </div>

                                  {/* Monthly heading */}
                                  <div className="text-[9px] font-bold tracking-wider uppercase font-mono" style={{ color: "var(--text-secondary)" }}>
                                    JULY 2026
                                  </div>

                                  {/* Ledger rows */}
                                  <div className="space-y-2">
                                    <div 
                                      className="flex items-center gap-2.5 py-2 px-3 rounded-[12px]" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)" 
                                      }}
                                    >
                                      <div 
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]" 
                                        style={{ 
                                          background: "var(--bg-surface-sunken)", 
                                          color: "var(--income-positive)", 
                                          border: "1px solid var(--border-subtle)" 
                                        }}
                                      >
                                        <ArrowDownLeft size={14} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>Salary Deposit</div>
                                        <div className="text-[8px]" style={{ color: "var(--text-secondary)" }}>Today, 09:12 AM · Salary</div>
                                      </div>
                                      <span className="tabular text-[10px] font-bold shrink-0" style={{ color: "var(--income-positive)" }}>+15,000.00</span>
                                    </div>

                                    <div 
                                      className="flex items-center gap-2.5 py-2 px-3 rounded-[12px]" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)" 
                                      }}
                                    >
                                      <div 
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]" 
                                        style={{ 
                                          background: "var(--bg-surface-sunken)", 
                                          color: "var(--expense-negative)", 
                                          border: "1px solid var(--border-subtle)" 
                                        }}
                                      >
                                        <ArrowUpRight size={14} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>Fuel Payment</div>
                                        <div className="text-[8px]" style={{ color: "var(--text-secondary)" }}>Yesterday · Transport</div>
                                      </div>
                                      <span className="tabular text-[10px] font-bold shrink-0" style={{ color: "var(--text-secondary)" }}>-1,200.00</span>
                                    </div>

                                    <div 
                                      className="flex items-center gap-2.5 py-2 px-3 rounded-[12px]" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)" 
                                      }}
                                    >
                                      <div 
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]" 
                                        style={{ 
                                          background: "var(--bg-surface-sunken)", 
                                          color: "var(--expense-negative)", 
                                          border: "1px solid var(--border-subtle)" 
                                        }}
                                      >
                                        <ArrowUpRight size={14} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>Local Market Grocery</div>
                                        <div className="text-[8px]" style={{ color: "var(--text-secondary)" }}>July 12 · Food</div>
                                      </div>
                                      <span className="tabular text-[10px] font-bold shrink-0" style={{ color: "var(--text-secondary)" }}>-850.00</span>
                                    </div>

                                    <div 
                                      className="flex items-center gap-2.5 py-2 px-3 rounded-[12px]" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)" 
                                      }}
                                    >
                                      <div 
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]" 
                                        style={{ 
                                          background: "var(--bg-surface-sunken)", 
                                          color: "var(--expense-negative)", 
                                          border: "1px solid var(--border-subtle)" 
                                        }}
                                      >
                                        <ArrowUpRight size={14} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>Home Rent</div>
                                        <div className="text-[8px]" style={{ color: "var(--text-secondary)" }}>July 01 · Housing</div>
                                      </div>
                                      <span className="tabular text-[10px] font-bold shrink-0" style={{ color: "var(--text-secondary)" }}>-5,000.00</span>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* PAGE 3: WALLETS PREVIEW */}
                              {activePageIndex === 2 && (
                                <>
                                  <div className="flex justify-between items-center text-left">
                                    <h2 className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                                      Wallets
                                    </h2>
                                    <span 
                                      className="px-2.5 py-0.5 text-[8px] font-bold rounded"
                                      style={{ 
                                        background: "var(--accent-primary)", 
                                        color: "var(--accent-primary-fg)",
                                        boxShadow: "1.5px 1.5px 0 0 var(--border-strong)"
                                      }}
                                    >
                                      + Add Wallet
                                    </span>
                                  </div>

                                  {/* Detailed wallet stacks - Identical to wallets.tsx design */}
                                  <div className="space-y-2.5 text-left">
                                    {/* CBE Row */}
                                    <div 
                                      className="shadow-hard-md flex items-center justify-between rounded-[16px] p-2.5 gap-2.5" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)" 
                                      }}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span 
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] shrink-0" 
                                          style={{ 
                                            background: "var(--bg-surface-sunken)", 
                                            color: "var(--accent-primary)", 
                                            border: "1px solid var(--border-subtle)" 
                                          }}
                                        >
                                          <Landmark size={17} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <h3 className="font-bold text-[10px] truncate" style={{ color: "var(--text-primary)" }}>
                                            Commercial Bank
                                          </h3>
                                          <div className="mt-0.5 flex">
                                            <span 
                                              className="text-[7px] uppercase font-bold tracking-wider px-1 py-0.2 rounded"
                                              style={{ 
                                                background: "var(--bg-surface-sunken)", 
                                                color: "var(--text-secondary)", 
                                                border: "1px solid var(--border-subtle)" 
                                              }}
                                            >
                                              Bank
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="tabular text-[11px] font-bold" style={{ color: "var(--text-primary)" }}>
                                          14,250.00 ETB
                                        </div>
                                        <div className="text-[7px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-secondary)" }}>
                                          Balance ETB
                                        </div>
                                      </div>
                                    </div>

                                    {/* Telebirr Row */}
                                    <div 
                                      className="shadow-hard-md flex items-center justify-between rounded-[16px] p-2.5 gap-2.5" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)" 
                                      }}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span 
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] shrink-0" 
                                          style={{ 
                                            background: "var(--bg-surface-sunken)", 
                                            color: "var(--accent-primary)", 
                                            border: "1px solid var(--border-subtle)" 
                                          }}
                                        >
                                          <Smartphone size={17} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <h3 className="font-bold text-[10px] truncate" style={{ color: "var(--text-primary)" }}>
                                            Telebirr Wallet
                                          </h3>
                                          <div className="mt-0.5 flex">
                                            <span 
                                              className="text-[7px] uppercase font-bold tracking-wider px-1 py-0.2 rounded"
                                              style={{ 
                                                background: "var(--bg-surface-sunken)", 
                                                color: "var(--text-secondary)", 
                                                border: "1px solid var(--border-subtle)" 
                                              }}
                                            >
                                              Mobile
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="tabular text-[11px] font-bold" style={{ color: "var(--text-primary)" }}>
                                          8,420.00 ETB
                                        </div>
                                        <div className="text-[7px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-secondary)" }}>
                                          Balance ETB
                                        </div>
                                      </div>
                                    </div>

                                    {/* Cash Row */}
                                    <div 
                                      className="shadow-hard-md flex items-center justify-between rounded-[16px] p-2.5 gap-2.5" 
                                      style={{ 
                                        background: "var(--bg-surface)", 
                                        border: "1px solid var(--border-subtle)" 
                                      }}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span 
                                          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] shrink-0" 
                                          style={{ 
                                            background: "var(--bg-surface-sunken)", 
                                            color: "var(--accent-primary)", 
                                            border: "1px solid var(--border-subtle)" 
                                          }}
                                        >
                                          <Wallet size={17} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <h3 className="font-bold text-[10px] truncate" style={{ color: "var(--text-primary)" }}>
                                            Physical Cash
                                          </h3>
                                          <div className="mt-0.5 flex">
                                            <span 
                                              className="text-[7px] uppercase font-bold tracking-wider px-1 py-0.2 rounded"
                                              style={{ 
                                                background: "var(--bg-surface-sunken)", 
                                                color: "var(--text-secondary)", 
                                                border: "1px solid var(--border-subtle)" 
                                              }}
                                            >
                                              Cash
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="tabular text-[11px] font-bold" style={{ color: "var(--text-primary)" }}>
                                          2,650.00 ETB
                                        </div>
                                        <div className="text-[7px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-secondary)" }}>
                                          Balance ETB
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Distribution progress bar */}
                                  <div 
                                    className="p-2.5 rounded-lg space-y-2 text-left"
                                    style={{ 
                                      background: "var(--bg-surface)", 
                                      border: "1px solid var(--border-subtle)" 
                                    }}
                                  >
                                    <div className="text-[8px] font-bold uppercase tracking-wider font-mono" style={{ color: "var(--text-secondary)" }}>
                                      Asset Weight Distribution
                                    </div>
                                    <div className="h-2 rounded-full flex overflow-hidden bg-zinc-800" style={{ background: "var(--bg-surface-sunken)" }}>
                                      <div className="h-full" style={{ width: "56%", background: "var(--accent-primary)" }} />
                                      <div className="h-full" style={{ width: "33%", background: "var(--accent-secondary)" }} />
                                      <div className="h-full" style={{ width: "11%", background: "var(--text-disabled)" }} />
                                    </div>
                                    <div className="flex justify-between text-[7px] font-bold font-mono" style={{ color: "var(--text-secondary)" }}>
                                      <span>CBE (56%)</span>
                                      <span>TELE (33%)</span>
                                      <span>CASH (11%)</span>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* PAGE 4: SETTINGS PREVIEW */}
                              {activePageIndex === 3 && (
                                <>
                                  <div className="text-left mb-1">
                                    <h2 className="text-sm font-bold animate-fade-in" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                                      Settings
                                    </h2>
                                  </div>

                                  {/* Section 1: Workspaces */}
                                  <div
                                    className="shadow-hard-sm rounded-[16px] p-3 space-y-2"
                                    style={{
                                      background: "var(--bg-surface)",
                                      border: "1px solid var(--border-subtle)",
                                    }}
                                  >
                                    <h3 className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      Workspaces
                                    </h3>
                                    <div className="space-y-1.5">
                                      {/* Active workspace */}
                                      <div
                                        className="flex items-center justify-between rounded-[8px] p-2"
                                        style={{
                                          background: "var(--bg-surface-sunken)",
                                          border: "1.5px solid var(--accent-primary)",
                                        }}
                                      >
                                        <div>
                                          <div className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                                            consulting_work
                                            <span
                                              className="text-[6px] rounded-full px-1 py-0.2 font-bold"
                                              style={{
                                                background: "var(--accent-primary)",
                                                color: "var(--bg-base)",
                                              }}
                                            >
                                              Active Workspace
                                            </span>
                                          </div>
                                          <div className="text-[7px]" style={{ color: "var(--text-secondary)" }}>
                                            Created 7/12/2026
                                          </div>
                                        </div>
                                        <div className="flex gap-1.5" style={{ color: "var(--text-secondary)" }}>
                                          <Edit2 size={9} />
                                          <Trash2 size={9} />
                                        </div>
                                      </div>

                                      {/* Secondary Workspace */}
                                      <div
                                        className="flex items-center justify-between rounded-[8px] p-2"
                                        style={{
                                          background: "transparent",
                                          border: "1.5px solid var(--border-subtle)",
                                        }}
                                      >
                                        <div>
                                          <div className="text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>
                                            personal_finance
                                          </div>
                                          <div className="text-[7px]" style={{ color: "var(--text-secondary)" }}>
                                            Created 7/10/2026
                                          </div>
                                        </div>
                                        <div className="flex gap-1.5" style={{ color: "var(--text-secondary)" }}>
                                          <Edit2 size={9} />
                                          <Trash2 size={9} />
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      className="w-full flex items-center justify-center gap-1 rounded-[8px] border border-dashed py-1.5 text-[8px] font-bold cursor-pointer"
                                      style={{
                                        borderColor: "var(--border-subtle)",
                                        color: "var(--text-secondary)",
                                      }}
                                    >
                                      <Plus size={10} /> Add New Workspace
                                    </button>
                                  </div>

                                  {/* Section 2: Google Account Identity */}
                                  <div
                                    className="shadow-hard-sm rounded-[16px] p-3 space-y-3"
                                    style={{
                                      background: "var(--bg-surface)",
                                      border: "1px solid var(--border-subtle)",
                                    }}
                                  >
                                    <h3 className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      Google Account Identity
                                    </h3>
                                    
                                    <div className="flex items-center gap-2.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/80 text-left">
                                      <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 uppercase shrink-0">
                                        JD
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3 text-[#ff5a1f]" />
                                          <span className="font-bold text-[10px] text-zinc-100 truncate">John Doe</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <Mail className="h-3 w-3 text-zinc-400" />
                                          <span className="text-[8px] text-zinc-400 truncate font-semibold">john.doe@gmail.com</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex gap-1.5 text-left">
                                      <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                      <div className="space-y-0.5">
                                        <h4 className="text-[8px] font-bold text-emerald-400">Security Managed securely by Google</h4>
                                        <p className="text-[7.5px] text-zinc-400 leading-normal">
                                          Your credentials and sign-in keys are handled securely by Google Identity Services.
                                        </p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      className="w-full flex items-center justify-center gap-1 rounded-[8px] py-1.5 text-[8px] font-bold border text-red-400 hover:bg-red-950/20 cursor-pointer"
                                      style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
                                    >
                                      Log Out of Account
                                    </button>
                                  </div>

                                  {/* Section 3: Appearance Presets */}
                                  <div
                                    className="shadow-hard-sm rounded-[16px] p-3 space-y-2"
                                    style={{
                                      background: "var(--bg-surface)",
                                      border: "1px solid var(--border-subtle)",
                                    }}
                                  >
                                    <h3 className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      Appearance · Preset
                                    </h3>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {/* Tangelo Neon */}
                                      <div
                                        className="rounded-[8px] p-2 text-left flex flex-col gap-1.5 justify-between"
                                        style={{
                                          background: "var(--bg-surface-sunken)",
                                          border: "1.5px solid var(--accent-primary)",
                                        }}
                                      >
                                        <div className="text-[8.5px] font-bold text-zinc-200 leading-none">Tangelo Neon</div>
                                        <div className="flex gap-1 mt-1">
                                          <span className="h-3 w-3 rounded-full bg-[#ff5a1f] border border-zinc-700 inline-block shrink-0" />
                                          <span className="h-3 w-3 rounded-full bg-[#2d8cff] border border-zinc-700 inline-block shrink-0" />
                                          <span className="h-3 w-3 rounded-full bg-[#0a0b0f] border border-zinc-700 inline-block shrink-0" />
                                        </div>
                                      </div>
                                      {/* Arctic Pulse */}
                                      <div
                                        className="rounded-[8px] p-2 text-left flex flex-col gap-1.5 justify-between"
                                        style={{
                                          background: "transparent",
                                          border: "1.5px solid var(--border-subtle)",
                                        }}
                                      >
                                        <div className="text-[8.5px] font-bold text-zinc-400 leading-none">Arctic Pulse</div>
                                        <div className="flex gap-1 mt-1">
                                          <span className="h-3 w-3 rounded-full bg-[#2d8cff] border border-zinc-700 inline-block shrink-0" />
                                          <span className="h-3 w-3 rounded-full bg-[#00f58c] border border-zinc-700 inline-block shrink-0" />
                                          <span className="h-3 w-3 rounded-full bg-[#0a0d14] border border-zinc-700 inline-block shrink-0" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Section 4: Font Style */}
                                  <div
                                    className="shadow-hard-sm rounded-[16px] p-3 space-y-2"
                                    style={{
                                      background: "var(--bg-surface)",
                                      border: "1px solid var(--border-subtle)",
                                    }}
                                  >
                                    <h3 className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      Appearance · Font style
                                    </h3>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div
                                        className="rounded-[8px] p-2 text-left"
                                        style={{
                                          background: "var(--bg-surface-sunken)",
                                          border: "1.5px solid var(--accent-primary)",
                                        }}
                                      >
                                        <div className="text-[6.5px] font-bold text-zinc-400">Geometric (Space Grotesk)</div>
                                        <div className="text-[11px] font-bold text-zinc-100 mt-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Abc 123</div>
                                      </div>
                                      <div
                                        className="rounded-[8px] p-2 text-left"
                                        style={{
                                          background: "transparent",
                                          border: "1.5px solid var(--border-subtle)",
                                        }}
                                      >
                                        <div className="text-[6.5px] font-bold text-zinc-400">Technical (JetBrains Mono)</div>
                                        <div className="text-[11px] font-bold text-zinc-100 mt-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>Abc 123</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Section 5: Time Format */}
                                  <div
                                    className="shadow-hard-sm rounded-[16px] p-3 space-y-2"
                                    style={{
                                      background: "var(--bg-surface)",
                                      border: "1px solid var(--border-subtle)",
                                    }}
                                  >
                                    <h3 className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      Appearance · Time format
                                    </h3>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div
                                        className="rounded-[8px] py-1 text-[9px] font-semibold text-center cursor-pointer"
                                        style={{
                                          background: "var(--bg-surface-sunken)",
                                          color: "var(--text-primary)",
                                          border: "1.5px solid var(--accent-primary)",
                                        }}
                                      >
                                        12-Hour
                                      </div>
                                      <div
                                        className="rounded-[8px] py-1 text-[9px] font-semibold text-center cursor-pointer"
                                        style={{
                                          background: "transparent",
                                          color: "var(--text-secondary)",
                                          border: "1.5px solid var(--border-subtle)",
                                        }}
                                      >
                                        24-Hour
                                      </div>
                                    </div>
                                  </div>

                                  {/* Section 6: Sync & Security Settings */}
                                  <div
                                    className="shadow-hard-sm rounded-[16px] p-3 space-y-2"
                                    style={{
                                      background: "var(--bg-surface)",
                                      border: "1px solid var(--border-subtle)",
                                    }}
                                  >
                                    <h3 className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      Sync & security
                                    </h3>
                                    
                                    {/* Auto-sync Toggle */}
                                    <div className="flex items-center justify-between py-1 text-left">
                                      <div>
                                        <div className="text-[10px] font-semibold text-zinc-200 leading-none">Auto-sync</div>
                                        <div className="text-[7px] mt-0.5" style={{ color: "var(--text-secondary)" }}>Sync on network, conserves mobile data</div>
                                      </div>
                                      <div
                                        className="relative inline-flex h-4 w-7.5 items-center rounded-full p-0.5 shrink-0"
                                        style={{
                                          background: "var(--accent-primary)",
                                          border: "1px solid var(--border-strong)",
                                        }}
                                      >
                                        <span className="h-3 w-3 translate-x-3 transform rounded-full bg-white transition duration-200" />
                                      </div>
                                    </div>

                                    {/* Device lock Toggle */}
                                    <div className="flex items-center justify-between py-1 border-t border-zinc-800/60 pt-2 text-left">
                                      <div>
                                        <div className="text-[10px] font-semibold text-zinc-200 leading-none">Device lock</div>
                                        <div className="text-[7px] mt-0.5" style={{ color: "var(--text-secondary)" }}>Require biometric or PIN on open</div>
                                      </div>
                                      <div
                                        className="relative inline-flex h-4 w-7.5 items-center rounded-full p-0.5 shrink-0"
                                        style={{
                                          background: "var(--accent-primary)",
                                          border: "1px solid var(--border-strong)",
                                        }}
                                      >
                                        <span className="h-3 w-3 translate-x-3 transform rounded-full bg-white transition duration-200" />
                                      </div>
                                    </div>

                                    {/* Sync Status Info Box */}
                                    <div
                                      className="mt-2 flex items-center justify-between rounded-[8px] p-2"
                                      style={{
                                        background: "var(--bg-surface-sunken)",
                                        border: "1px solid var(--border-subtle)",
                                      }}
                                    >
                                      <div className="text-left">
                                        <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-wide leading-none">ONLINE</div>
                                        <div className="text-[7px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                          Last sync Just now
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="px-2 py-0.5 text-[8px] font-bold rounded cursor-pointer"
                                        style={{
                                          background: "var(--bg-surface-raised)",
                                          border: "1px solid var(--border-subtle)",
                                          color: "var(--text-primary)",
                                        }}
                                      >
                                        Sync Now
                                      </button>
                                    </div>
                                  </div>

                                  {/* Section 7: PDF Backup & Restore */}
                                  <div
                                    className="shadow-hard-sm rounded-[16px] p-3 space-y-2 text-left"
                                    style={{
                                      background: "var(--bg-surface)",
                                      border: "1px solid var(--border-subtle)",
                                    }}
                                  >
                                    <h3 className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      Local PDF Backup & Restore
                                    </h3>
                                    <p className="text-[7px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                      Export your transactions and wallets as a beautifully formatted PDF backup. Import the PDF file at any time to restore your history.
                                    </p>
                                    <div className="flex gap-1.5 w-full">
                                      <button
                                        type="button"
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-1 text-[8px] font-bold rounded cursor-pointer text-white"
                                        style={{
                                          background: "var(--accent-primary)",
                                        }}
                                      >
                                        <Download size={10} /> Export PDF
                                      </button>
                                      <button
                                        type="button"
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-1 text-[8px] font-bold rounded border border-dashed cursor-pointer"
                                        style={{
                                          borderColor: "var(--border-subtle)",
                                          color: "var(--text-secondary)",
                                        }}
                                      >
                                        <Upload size={10} /> Import PDF
                                      </button>
                                    </div>
                                  </div>

                                  {/* Section 8: Native App Status */}
                                  <div
                                    className="shadow-hard-sm rounded-[16px] p-3 space-y-2 text-left"
                                    style={{
                                      background: "var(--bg-surface)",
                                      border: "1px solid var(--border-subtle)",
                                    }}
                                  >
                                    <h3 className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      Native App & Offline Status
                                    </h3>
                                    <div
                                      className="p-2 rounded-[8px] space-y-1.5 text-[7.5px]"
                                      style={{
                                        background: "var(--bg-surface-sunken)",
                                        border: "1px solid var(--border-subtle)",
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span style={{ color: "var(--text-secondary)" }}>App Environment:</span>
                                        <span className="font-bold flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
                                          <Laptop size={9} className="text-emerald-400" /> Standalone Native PWA
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span style={{ color: "var(--text-secondary)" }}>Offline Engine:</span>
                                        <span className="font-mono font-bold flex items-center gap-0.5 text-emerald-400">
                                          <Check size={9} /> Active (IndexedDB)
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span style={{ color: "var(--text-secondary)" }}>PWA Capabilities:</span>
                                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                                          Full offline, cached
          </span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      className="w-full text-[8px] py-1.5 flex items-center justify-center gap-1.5 rounded-lg font-bold text-white cursor-pointer"
                                      style={{
                                        background: "var(--accent-primary)",
                                      }}
                                    >
                                      <Sparkles size={10} /> Install BirrTu PWA Application
                                    </button>
                                  </div>

                                  {/* Section 9: About */}
                                  <div
                                    className="shadow-hard-sm rounded-[16px] p-3 space-y-2 text-left"
                                    style={{
                                      background: "var(--bg-surface)",
                                      border: "1px solid var(--border-subtle)",
                                    }}
                                  >
                                    <h3 className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                                      About
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      <img src="/logo.png" className="h-6 w-6 rounded border border-zinc-800" alt="BirrTu" />
                                      <div>
                                        <div className="text-[9px] font-semibold leading-none">BirrTu · v1.0</div>
                                        <div className="text-[7px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                          Local-first ETB finance tracker
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-[7.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                      Developed by{" "}
                                      <a
                                        href="https://birtucansoftware.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold underline hover:underline"
                                        style={{ color: "var(--accent-primary)" }}
                                      >
                                        BirtuCan Technologies
                                      </a>
                                      .
                                    </p>
                                  </div>
                                </>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        {/* Replicated BottomNav for Mockup Phone - Identical to BottomNav.tsx inside */}
                        <nav
                          className="flex items-end px-2 pb-2 pt-1 w-full shrink-0 z-40"
                          style={{
                            background: "var(--bg-surface-raised)",
                            borderTop: "1px solid var(--border-subtle)",
                            boxShadow: "0 -3px 0 0 var(--border-subtle)",
                          }}
                        >
                          {/* Left tabs: Home, Activity */}
                          <div className="flex flex-1 items-center justify-around">
                            <button 
                              onClick={() => handleTabClick(0)}
                              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                              style={{ color: activePageIndex === 0 ? "var(--accent-primary)" : "var(--text-secondary)" }}
                            >
                              <Home size={15} strokeWidth={2} />
                              <span className="text-[9px] font-medium font-sans">Home</span>
                            </button>
                            <button 
                              onClick={() => handleTabClick(1)}
                              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                              style={{ color: activePageIndex === 1 ? "var(--accent-primary)" : "var(--text-secondary)" }}
                            >
                              <List size={15} strokeWidth={2} />
                              <span className="text-[9px] font-medium font-sans">Activity</span>
                            </button>
                          </div>

                          {/* Center Add button replica */}
                          <div className="relative -mt-4.5 flex w-12 items-center justify-center shrink-0">
                            <div
                              className="press-3d flex h-9.5 w-9.5 items-center justify-center rounded-full cursor-pointer"
                              style={{
                                background: "var(--accent-primary)",
                                color: "var(--accent-primary-fg)",
                                boxShadow: "2px 2px 0 0 var(--border-strong)",
                                filter: "brightness(0.9)",
                              }}
                            >
                              <Plus size={18} strokeWidth={2.5} />
                            </div>
                          </div>

                          {/* Right tabs: Wallets, Settings */}
                          <div className="flex flex-1 items-center justify-around">
                            <button 
                              onClick={() => handleTabClick(2)}
                              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                              style={{ color: activePageIndex === 2 ? "var(--accent-primary)" : "var(--text-secondary)" }}
                            >
                              <Wallet size={15} strokeWidth={2} />
                              <span className="text-[9px] font-medium font-sans">Wallets</span>
                            </button>
                            <button 
                              onClick={() => handleTabClick(3)}
                              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                              style={{ color: activePageIndex === 3 ? "var(--accent-primary)" : "var(--text-secondary)" }}
                            >
                              <SettingsIcon size={15} strokeWidth={2} />
                              <span className="text-[9px] font-medium font-sans">Settings</span>
                            </button>
                          </div>
                        </nav>

                      </div>

                      {/* iPhone bottom pill bar */}
                      <div 
                        className="h-4 flex justify-center items-center shrink-0 z-40 pb-1"
                        style={{ background: "var(--bg-base)" }}
                      >
                        <div className="w-24 h-1 bg-zinc-700/60 rounded-full" />
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* CORE ADVANTAGES BENTO GRID */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <span className={`text-[10px] uppercase tracking-widest font-bold font-mono transition-colors duration-300 ${
                    landingTheme === "light" ? "text-zinc-500" : "text-[#ff5a1f]"
                  }`}>Why Choose BirrTu?</span>
                  <h3 
                    className={`text-2xl font-black transition-colors duration-300 ${
                      landingTheme === "light" ? "text-zinc-900" : "text-white"
                    }`} 
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Guaranteed Security, Native Features
                  </h3>
                  <p className={`text-sm max-w-lg mx-auto transition-colors duration-300 ${
                    landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"
                  }`}>
                    A secure alternative to cloud-based spreadsheets. Engineered to run inside your browser sandboxed environment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bento Box 1 - Local-first */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
                    landingTheme === "light" 
                      ? "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md text-zinc-800" 
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-white"
                  }`}>
                    <div className="space-y-4">
                      <div className="h-10 w-10 rounded-xl bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 flex items-center justify-center text-[#ff5a1f]">
                        <Lock size={18} />
                      </div>
                      <h4 
                        className={`text-base font-bold transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-900" : "text-white"}`} 
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        100% Offline-First
                      </h4>
                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                        Your transaction logs and digital balances stay stored locally on your physical device. No database servers can capture or compromise your records.
                      </p>
                    </div>
                  </div>

                  {/* Bento Box 2 - Bank templates */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
                    landingTheme === "light" 
                      ? "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md text-zinc-800" 
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-white"
                  }`}>
                    <div className="space-y-4">
                      <div className="h-10 w-10 rounded-xl bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 flex items-center justify-center text-[#ff5a1f]">
                        <Wallet size={18} />
                      </div>
                      <h4 
                        className={`text-base font-bold transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-900" : "text-white"}`} 
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Ethiopian Bank Templates
                      </h4>
                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                        Tailored presets for Commercial Bank of Ethiopia (CBE), Telebirr, Awash, Dashen, Hibret, COOP, and cash pouches. Get started with zero setup hassle.
                      </p>
                    </div>
                  </div>

                  {/* Bento Box 3 - Google Drive backup */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
                    landingTheme === "light" 
                      ? "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md text-zinc-800" 
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-white"
                  }`}>
                    <div className="space-y-4">
                      <div className="h-10 w-10 rounded-xl bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 flex items-center justify-center text-[#ff5a1f]">
                        <Globe size={18} />
                      </div>
                      <h4 
                        className={`text-base font-bold transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-900" : "text-white"}`} 
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Secure Google Backup
                      </h4>
                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                        Never lose your data when clearing cookies. Back up incrementally to your private Google Drive AppData folder. Fully hidden and secure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HOW IT WORKS */}
              <div className={`space-y-8 p-8 rounded-3xl border transition-colors duration-300 ${
                landingTheme === "light"
                  ? "bg-white border-zinc-200/80 shadow-sm text-zinc-800"
                  : "bg-zinc-950/20 border-zinc-900 text-white"
              }`}>
                <div className="text-center space-y-2">
                  <h3 
                    className={`text-2xl font-black transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-900" : "text-white"}`} 
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Simple Setup, Fast Logging
                  </h3>
                  <p className={`text-xs max-w-sm mx-auto transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                    Three easy steps to elevate your financial accountability.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex gap-4">
                    <div className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border transition-colors duration-300 ${
                      landingTheme === "light"
                        ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                    }`}>
                      1
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-800" : "text-zinc-200"}`}>Sign In with Google</h4>
                      <p className={`text-[11px] leading-relaxed mt-1 transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                        Log in using standard Google Auth. No separate password or registry databases managed.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border transition-colors duration-300 ${
                      landingTheme === "light"
                        ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                    }`}>
                      2
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-800" : "text-zinc-200"}`}>Create Ethiopian Wallets</h4>
                      <p className={`text-[11px] leading-relaxed mt-1 transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                        Add savings portfolios, digital wallets, or physical cash balances directly inside the app.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border transition-colors duration-300 ${
                      landingTheme === "light"
                        ? "bg-[#ff5a1f]/10 text-[#ff5a1f] border-[#ff5a1f]/20"
                        : "bg-[#ff5a1f]/20 text-[#ff5a1f] border-[#ff5a1f]/30"
                    }`}>
                      3
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-800" : "text-zinc-200"}`}>Secure Sync Backup</h4>
                      <p className={`text-[11px] leading-relaxed mt-1 transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                        Optionally toggle Google Drive AppData synchronization. Your ledger backups stay strictly isolated and private.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ SECTION */}
              <div className="max-w-3xl mx-auto w-full space-y-6">
                <div className="text-center space-y-2">
                  <h3 
                    className={`text-2xl font-black transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-900" : "text-white"}`} 
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Frequently Asked Questions
                  </h3>
                  <p className={`text-xs transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                    Got questions? We have quick, upfront answers.
                  </p>
                </div>

                <div className="space-y-3">
                  {faqItems.map((item, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                        landingTheme === "light"
                          ? "border-zinc-200 bg-white shadow-sm"
                          : "border-zinc-800 bg-zinc-950/40"
                      }`}
                    >
                      <button
                        onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                        className={`w-full flex items-center justify-between p-4 font-bold text-xs sm:text-sm text-left cursor-pointer select-none transition-colors duration-300 ${
                          landingTheme === "light"
                            ? "text-zinc-700 hover:text-zinc-950"
                            : "text-zinc-200 hover:text-white"
                        }`}
                      >
                        <span>{item.q}</span>
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform duration-300 ${
                            landingTheme === "light" ? "text-zinc-400" : "text-zinc-500"
                          } ${activeFaq === index ? "rotate-180 text-[#ff5a1f]" : ""}`} 
                        />
                      </button>
                      {activeFaq === index && (
                        <div className={`px-4 pb-4 text-xs leading-relaxed pt-3 transition-colors duration-300 ${
                          landingTheme === "light"
                            ? "text-zinc-650 border-t border-zinc-100"
                            : "text-zinc-400 border-t border-zinc-900"
                        }`}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTTOM CALL TO ACTION */}
              <div className={`text-center p-8 rounded-3xl space-y-4 max-w-2xl mx-auto border transition-colors duration-300 ${
                landingTheme === "light"
                  ? "bg-white border-zinc-200 shadow-md text-zinc-800"
                  : "bg-zinc-950 border border-zinc-800 text-white"
              }`}>
                <h3 
                  className={`text-xl sm:text-2xl font-black transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-900" : "text-white"}`} 
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Ready to optimize your cash flow?
                </h3>
                <p className={`text-xs max-w-sm mx-auto transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                  Take control of your Commercial Bank, Telebirr, and cash budgets today.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setView("login");
                      scrollContainerToTop();
                    }}
                    className="px-6 py-3 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all inline-flex items-center gap-2"
                  >
                    <span>Launch Web App</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Rich Landing Page Footer Section */}
              <div className={`border-t mt-10 pt-6 pb-6 text-left relative z-10 transition-colors duration-300 ${
                landingTheme === "light" ? "border-zinc-200" : "border-zinc-900/80"
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Brand & Mission Column */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <img 
                        src="/logo.png" 
                        alt="BirrTu" 
                        className="h-7 w-7 object-contain" 
                      />
                      <span className={`font-extrabold tracking-tight text-lg font-sans transition-colors duration-300 ${
                        landingTheme === "light" ? "text-zinc-900" : "text-white"
                      }`}>
                        Birr<span className="text-[#ff5a1f]">Tu</span>
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed max-w-xs transition-colors duration-300 ${
                      landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"
                    }`}>
                      A simple, local-first budget tracker and personal ledger crafted specifically for Ethiopian banking ecosystems and digital wallets. Complete privacy, zero tracking databases.
                    </p>
                  </div>

                  {/* Core Features Column */}
                  <div className="space-y-3">
                    <h4 className={`text-xs font-bold uppercase tracking-widest font-mono transition-colors duration-300 ${
                      landingTheme === "light" ? "text-zinc-400" : "text-zinc-200"
                    }`}>
                      Features
                    </h4>
                    <ul className={`space-y-2 text-xs transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                      <li>
                        <span className={`transition-colors ${landingTheme === "light" ? "hover:text-zinc-800" : "hover:text-zinc-200"}`}>Multiple Account Ledger</span>
                      </li>
                      <li>
                        <span className={`transition-colors ${landingTheme === "light" ? "hover:text-zinc-800" : "hover:text-zinc-200"}`}>Ethiopian Bank Presets</span>
                      </li>
                      <li>
                        <span className={`transition-colors ${landingTheme === "light" ? "hover:text-zinc-800" : "hover:text-zinc-200"}`}>Physical Cash Management</span>
                      </li>
                      <li>
                        <span className={`transition-colors ${landingTheme === "light" ? "hover:text-zinc-800" : "hover:text-zinc-200"}`}>Interactive Statistics</span>
                      </li>
                    </ul>
                  </div>

                  {/* Security & Isolation Column */}
                  <div className="space-y-3">
                    <h4 className={`text-xs font-bold uppercase tracking-widest font-mono transition-colors duration-300 ${
                      landingTheme === "light" ? "text-zinc-400" : "text-zinc-200"
                    }`}>
                      Privacy & Trust
                    </h4>
                    <ul className={`space-y-2 text-xs transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        <span>No Remote Tracking</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        <span>Secure Local Sandbox</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        <span>Isolated Drive Backup</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        <span>Zero Shared Cookies</span>
                      </li>
                    </ul>
                  </div>

                  {/* Legal & Compliance Column */}
                  <div className="space-y-3">
                    <h4 className={`text-xs font-bold uppercase tracking-widest font-mono transition-colors duration-300 ${
                      landingTheme === "light" ? "text-zinc-400" : "text-zinc-200"
                    }`}>
                      Legal
                    </h4>
                    <ul className={`space-y-2 text-xs font-sans transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                      <li>
                        <Link
                          to="/privacy"
                          className={`transition-colors cursor-pointer text-left ${landingTheme === "light" ? "hover:text-zinc-900 text-zinc-500" : "hover:text-white text-zinc-400"}`}
                        >
                          Privacy Policy
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/terms"
                          className={`transition-colors cursor-pointer text-left ${landingTheme === "light" ? "hover:text-zinc-900 text-zinc-500" : "hover:text-white text-zinc-400"}`}
                        >
                          Terms of Use
                        </Link>
                      </li>
                      <li>
                        <span className={landingTheme === "light" ? "text-zinc-400" : "text-zinc-500"}>Security Audited</span>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Copyright Line at the absolute bottom */}
                <div className={`border-t mt-12 pt-6 text-[10px] transition-colors duration-300 ${
                  landingTheme === "light" ? "border-zinc-200 text-zinc-400" : "border-zinc-900/50 text-zinc-500"
                }`}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      © 2026{" "}
                      <a
                        href="https://birtucansoftware.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ff5a1f] hover:text-[#ff5a1f]/80 font-bold hover:underline transition-colors"
                      >
                        BirtuCan Technologies
                      </a>
                      . All rights reserved.
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="https://github.com/BirtuCan-Software/birrtu-app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 hover:underline transition-colors ${
                          landingTheme === "light" ? "text-zinc-500 hover:text-zinc-900" : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Github size={12} className="text-[#ff5a1f]" />
                        <span>GitHub Repository</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {view === "login" && (
            <motion.div
              key="login-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm px-4 py-16"
            >
              <div className={`border-2 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 transition-colors duration-300 ${
                landingTheme === "light" 
                  ? "bg-white border-zinc-200/80 shadow-md text-zinc-800" 
                  : "bg-zinc-950 border-zinc-800 text-white"
              }`}>
                <div className="text-center space-y-2">
                  <h2 
                    className={`text-2xl font-black tracking-tight transition-colors duration-300 ${
                      landingTheme === "light" ? "text-zinc-900" : "text-white"
                    }`} 
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Welcome to BirrTu
                  </h2>
                  <p className={`text-xs transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-500" : "text-zinc-400"}`}>
                    A private, local-first digital ledger for tracking your Ethiopian wallets, bank accounts, and cash.
                  </p>
                </div>

                {error && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg font-semibold flex items-start gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* GSI Material Button styling */}
                <div className="flex justify-center w-full">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoggingIn}
                    className="w-full relative inline-flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-800 font-semibold px-4 py-3 rounded-xl shadow-lg border border-neutral-300 transition-all cursor-pointer select-none disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-neutral-500" />
                    ) : (
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 block">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    )}
                    <span className="text-xs sm:text-sm font-bold">
                      {isLoggingIn ? "Connecting Google Account..." : "Sign In with Google"}
                    </span>
                  </button>
                </div>

                {/* Continue as Guest Button */}
                <div className="flex justify-center -mt-1 pb-1">
                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    className={`text-xs transition-colors cursor-pointer underline underline-offset-4 font-medium ${
                      landingTheme === "light" ? "text-zinc-500 hover:text-[#ff5a1f]" : "text-zinc-400 hover:text-[#ff5a1f]"
                    }`}
                  >
                    Continue as Guest (No Cloud Backup)
                  </button>
                </div>

                {/* Value propositions */}
                <div className={`space-y-3 pt-3 border-t transition-colors duration-300 ${
                  landingTheme === "light" ? "border-zinc-200" : "border-zinc-800"
                }`}>
                  <div className="flex gap-2">
                    <Shield className="h-4 w-4 text-[#ff5a1f] shrink-0 mt-0.5" />
                    <div>
                      <h4 className={`text-[11px] font-bold transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-200"}`}>Google Drive AppData Storage</h4>
                      <p className="text-[10px] leading-relaxed text-zinc-500">
                        All sync and backup data is stored in your private Google Drive hidden app folder, invisible to other apps.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <KeyRound className="h-4 w-4 text-[#ff5a1f] shrink-0 mt-0.5" />
                    <div>
                      <h4 className={`text-[11px] font-bold transition-colors duration-300 ${landingTheme === "light" ? "text-zinc-700" : "text-zinc-200"}`}>100% Offline-First</h4>
                      <p className="text-[10px] leading-relaxed text-zinc-500">
                        Financial data is stored securely in your browser's local database. Sync is only triggered with Google Drive for backup.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer terms */}
                <div className={`text-center text-[10px] pt-4 flex justify-center gap-3 transition-colors duration-300 ${
                  landingTheme === "light" ? "border-t border-zinc-100 text-zinc-400" : "border-t border-zinc-800/80 text-zinc-500"
                }`}>
                  <Link
                    to="/privacy"
                    className="hover:text-[#ff5a1f] underline cursor-pointer"
                  >
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <Link
                    to="/terms"
                    className="hover:text-[#ff5a1f] underline cursor-pointer"
                  >
                    Terms of Use
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {view !== "landing" && (
        <footer className={`py-6 text-center text-[10px] mt-auto border-t transition-colors duration-300 ${
          landingTheme === "light" 
            ? "bg-zinc-100/60 border-zinc-200 text-zinc-600" 
            : "bg-zinc-950/20 border-zinc-900 text-zinc-500"
        }`}>
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 order-first sm:order-last">
              <Link
                to="/privacy"
                className={`transition-colors cursor-pointer ${
                  landingTheme === "light" ? "hover:text-zinc-900 text-zinc-500" : "hover:text-zinc-300 text-zinc-400"
                }`}
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link
                to="/terms"
                className={`transition-colors cursor-pointer ${
                  landingTheme === "light" ? "hover:text-zinc-900 text-zinc-500" : "hover:text-zinc-300 text-zinc-400"
                }`}
              >
                Terms of Use
              </Link>
              <span>•</span>
              <a 
                href="https://github.com/BirtuCan-Software/birrtu-app"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  landingTheme === "light" ? "hover:text-zinc-900 text-zinc-500" : "hover:text-zinc-300 text-zinc-400"
                }`}
              >
                <Github size={11} className="text-[#ff5a1f]" />
                <span>GitHub</span>
              </a>
            </div>
            <div className="order-last sm:order-first">
              © 2026{" "}
              <a
                href="https://birtucansoftware.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff5a1f] hover:text-[#ff5a1f]/80 font-bold hover:underline transition-colors"
              >
                BirtuCan Technologies
              </a>
              . All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
