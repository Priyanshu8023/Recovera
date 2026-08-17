"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  ChevronRight,
  Shield,
  Zap,
  GitPullRequest,
  Activity,
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState, MouseEvent } from "react";

const E = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────────────────────────
   BACKGROUND: Technical dot matrix, industrial vignette, & low-noise grain
───────────────────────────────────────────────────────────────────────────── */
function BackgroundLayout() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden
    >
      {/* Root pitch-black background to match the repo's homepage style seamlessly */}
      <div className="absolute inset-0 bg-black" />

      {/* Technical Dot Matrix Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(113, 113, 122, 0.22) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 75% at 50% 35%, black 30%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 85% 75% at 50% 35%, black 30%, transparent 100%)",
        }}
      />

      {/* Industrial High-Quality Low-Noise Grain Overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png")',
          backgroundSize: "200px 200px",
        }}
      />

      {/* Deep Console Muted Ambient Vignette (No flashy purple/cyan AI orbs) */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -25, 15, 0],
          scale: [1, 1.05, 0.98, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{
          top: "0%",
          left: "20%",
          width: 650,
          height: 650,
          background:
            "radial-gradient(circle, rgba(63, 63, 70, 0.22) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Hardware Steel Top Calibration Bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800/60 to-transparent" />

      {/* Seamless Transition Bottom Fading Mask */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   INCIDENT FEED TERMINAL: Live-running system event log automation simulation
───────────────────────────────────────────────────────────────────────────── */
const LOGS = [
  {
    time: "03:41:22",
    level: "WARN",
    svc: "api-gateway",
    msg: "p99 latency spike → 1840ms",
  },
  {
    time: "03:41:23",
    level: "INFO",
    svc: "recovera",
    msg: "Anomaly detected. Pulling CloudWatch diff…",
  },
  {
    time: "03:41:24",
    level: "INFO",
    svc: "recovera",
    msg: "Correlating with deploy d7f3c2a (18 min ago)",
  },
  {
    time: "03:41:25",
    level: "INFO",
    svc: "recovera",
    msg: "Root cause: connection pool exhaustion in auth-svc",
  },
  {
    time: "03:41:26",
    level: "INFO",
    svc: "recovera",
    msg: "Confidence: 94% — auto-remediation eligible",
  },
  {
    time: "03:41:27",
    level: "INFO",
    svc: "recovera",
    msg: "Safety check passed (REQUIRE_HUMAN_APPROVAL: N/A)",
  },
  {
    time: "03:41:28",
    level: "INFO",
    svc: "github",
    msg: "Branch fix/pool-exhaust-2603 created",
  },
  {
    time: "03:41:29",
    level: "INFO",
    svc: "github",
    msg: "PR #418 opened — patch applies connection limit",
  },
  {
    time: "03:41:30",
    level: "OK",
    svc: "api-gateway",
    msg: "p99 latency → 42ms. Incident resolved.",
  },
];

const LEVEL_COLOR: Record<string, string> = {
  WARN: "#f59e0b",
  INFO: "rgba(161, 161, 170, 0.7)",
  OK: "#10b981",
};

function IncidentFeed() {
  const [visible, setVisible] = useState(1);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible >= LOGS.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => {
      setVisible((v) => v + 1);
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 700);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setVisible(1);
      setDone(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <div className="relative rounded border border-zinc-800/80 bg-zinc-950/80 font-mono backdrop-blur-xl h-[240px] flex flex-col overflow-hidden shadow-2xl">
      {/* Terminal Window Header Control Panel */}
      <div className="flex items-center gap-1.5 px-4 py-3 shrink-0 border-b border-zinc-900 bg-zinc-900/30">
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
        <span className="ml-3 text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
          recovera — telemetry-trace
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[9px] font-bold text-emerald-500 tracking-widest uppercase">
            live stream
          </span>
        </span>
      </div>

      {/* Streaming Code Logs */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden px-4 py-3 flex flex-col gap-1 select-text selection:bg-zinc-800"
      >
        <AnimatePresence>
          {LOGS.slice(0, visible).map((l, i) => (
            <motion.div
              key={`${l.time}-${i}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-start gap-3 text-[10.5px] leading-relaxed text-zinc-300"
            >
              <span className="text-zinc-600 select-none min-w-[54px]">
                {l.time}
              </span>
              <span
                style={{ color: LEVEL_COLOR[l.level], minWidth: "32px" }}
                className="font-semibold select-none"
              >
                {l.level}
              </span>
              <span className="text-zinc-500 select-none min-w-[80px]">
                {l.svc}
              </span>
              <span
                className={
                  l.level === "OK"
                    ? "text-emerald-400 font-medium"
                    : l.level === "WARN"
                      ? "text-amber-200"
                      : "text-zinc-300"
                }
              >
                {l.msg}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {!done && (
          <motion.span
            className="inline-block w-1.5 h-3.5 bg-zinc-500 ml-1 mt-0.5"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>

      {/* Platform Autonomous Auto-Resolution Confirmation Badge */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 py-2 border-t border-emerald-950/50 bg-gradient-to-t from-zinc-950 to-zinc-950/90"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">
              Incident automated in 8s · mttr drop 94%
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   USP VALUE PILLS: Platform capabilities checklist
───────────────────────────────────────────────────────────────────────────── */
const USPS = [
  { icon: Zap, label: "Zero-config deploy" },
  { icon: Activity, label: "Continuous profiling" },
  { icon: GitPullRequest, label: "Auto patch generation" },
  { icon: Shield, label: "Policy-gated safe room" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   MOUSE-DRIVEN TILT CONTAINER WRAPPER FOR 3D PERSPECTIVE ILLUSION
───────────────────────────────────────────────────────────────────────────── */
function MouseDrivenTilt({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xMovement = useMotionValue(0);
  const yMovement = useMotionValue(0);
  const smoothX = useSpring(xMovement, { stiffness: 220, damping: 25 });
  const smoothY = useSpring(yMovement, { stiffness: 220, damping: 25 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], ["4deg", "-4deg"]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], ["-4deg", "4deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    xMovement.set((e.clientX - rect.left) / rect.width - 0.5);
    yMovement.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    xMovement.set(0);
    yMovement.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN RENDER WORKSPACE
───────────────────────────────────────────────────────────────────────────── */
export default function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative w-full overflow-hidden bg-black flex flex-col justify-center min-h-[96vh]">
      <BackgroundLayout />

      {/* Technical Perspective Telemetry Grid Base Floor */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5, delay: 0.4, ease: "easeOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[1500px] h-[500px] pointer-events-none select-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(63, 63, 70, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(63, 63, 70, 0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          transform: "translateX(-50%) perspective(800px) rotateX(68deg)",
          transformOrigin: "bottom center",
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)",
        }}
      />

      {/* Core Split Column Blueprint Layout Frame */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center lg:items-start gap-16 lg:gap-12 xl:gap-24 pt-36 pb-24">
        {/* ── LEFT FRAME COLUMN: Technical Content Deck ── */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-[50%] shrink-0">
          {/* Infrastructure Engine Identity Status Tag */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: E }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded border border-zinc-800 bg-zinc-900/30 backdrop-blur-md mb-8 group hover:border-zinc-700 transition-colors duration-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            <span className="text-[10.5px] font-mono font-medium text-zinc-400 uppercase tracking-widest">
              Recovera Core Engine v1.0
            </span>
            <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:translate-x-0.5 transition-transform duration-300" />
          </motion.div>

          {/* Premium Typography Headline Restored: Modern Geometric Sans-Serif */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.06, ease: E }}
            className="text-5xl sm:text-7xl md:text-[5.2rem] font-bold tracking-tight text-white mb-6 leading-[1.03]"
          >
            Reliability, <br />
            <span className="bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
              engineered.
            </span>
          </motion.h1>

          {/* Sharp Steel Separator Line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.18, ease: E }}
            className="w-full max-w-[240px] h-px bg-gradient-to-r from-zinc-700 via-zinc-800 to-transparent mb-6 origin-left"
          />

          {/* Clean Infrastructure Profile Description Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: E }}
            className="text-base text-zinc-400/90 leading-relaxed font-normal max-w-lg mb-8 tracking-normal"
          >
            Stop writing reactive scripts. Deploy an autonomous SRE that
            continuously anticipates, diagnoses, and silently resolves incidents
            in milliseconds.
          </motion.p>

          {/* Monospace System Feature Flags Tags */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26, ease: E }}
            className="flex flex-wrap gap-2 mb-10 justify-center lg:justify-start"
          >
            {USPS.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.05, ease: E }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-900 bg-zinc-900/10 text-[11px] font-mono text-zinc-500 tracking-wide backdrop-blur-sm"
              >
                <Icon className="w-3 h-3 text-zinc-400" />
                {label}
              </motion.div>
            ))}
          </motion.div>

          {/* Hardware-Grade Snappy CTA Button Matrix Interface */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: E }}
            className="flex flex-col sm:flex-row items-center lg:items-start gap-3 w-full sm:w-auto"
          >
            {session ? (
              <MouseDrivenTilt>
                <Link
                  href="/dashboard"
                  className="group relative flex items-center justify-center gap-2 px-7 py-3 text-sm font-medium text-black bg-white rounded transition-all duration-300 ease-out active:scale-[0.98] hover:bg-zinc-100 hover:shadow-[0_0_35px_rgba(255,255,255,0.15)] w-full sm:w-auto text-center"
                >
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:translate-x-0.5 transition-transform duration-300 ease-out" />
                </Link>
              </MouseDrivenTilt>
            ) : (
              <MouseDrivenTilt>
                <button
                  onClick={() =>
                    signIn("github", { callbackUrl: "/dashboard" })
                  }
                  className="group relative flex items-center justify-center gap-2.5 px-7 py-3 text-sm font-medium text-black bg-white rounded transition-all duration-300 ease-out active:scale-[0.98] hover:bg-zinc-100 hover:shadow-[0_0_35px_rgba(255,255,255,0.18)] w-full sm:w-auto"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Connect with GitHub
                </button>
              </MouseDrivenTilt>
            )}

            <MouseDrivenTilt>
              <Link
                href="#pipeline"
                className="group flex items-center justify-center gap-1.5 px-7 py-3 text-sm font-normal text-zinc-400 bg-zinc-950 border border-zinc-900 rounded transition-all duration-300 ease-out active:scale-[0.98] hover:bg-zinc-900/40 hover:border-zinc-800 hover:text-zinc-200 backdrop-blur-md w-full sm:w-auto text-center"
              >
                See how it works
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
              </Link>
            </MouseDrivenTilt>
          </motion.div>

          {/* System Licensing Legal Sub-text Footnote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="text-[10.5px] font-mono tracking-wide text-zinc-600 mt-6"
          >
            MIT Licensed · Cloud Native Open Source Platform
          </motion.p>
        </div>

        {/* ── RIGHT FRAME COLUMN: Live Simulation Terminal & Analytics Deck ── */}
        <div className="w-full lg:flex-1 flex flex-col gap-3.5">
          {/* Terminal Console Enclosure */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.22, ease: E }}
          >
            <IncidentFeed />
          </motion.div>

          {/* Micro-Metrics Operational Analytics Row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42, ease: E }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              {
                value: "< 12ms",
                label: "Avg Resolution",
                color: "text-emerald-400/90",
              },
              { value: "99.98%", label: "Uptime SLA", color: "text-zinc-300" },
              { value: "94%", label: "Trace Match", color: "text-zinc-400" },
            ].map(({ value, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.46 + i * 0.05, ease: E }}
                whileHover={{ y: -1, borderColor: "rgba(63, 63, 70, 0.4)" }}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded border border-zinc-900 bg-zinc-950/30 backdrop-blur-sm cursor-default transition-colors duration-300"
              >
                <span
                  className={`font-mono text-lg font-bold tracking-tight ${color}`}
                >
                  {value}
                </span>
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest font-semibold">
                  {label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Project Environment Architecture Badges Panel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.58, ease: "easeOut" }}
            className="flex flex-wrap gap-1.5 items-center pt-2 select-none"
          >
            <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-wider mr-2">
              Engine Spec
            </span>
            {[
              "Next.js",
              "TypeScript",
              "AWS Cloud",
              "PostgreSQL",
              "BullMQ",
              "Prisma",
            ].map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[9.5px] font-mono text-zinc-500 border border-zinc-900 rounded bg-zinc-950/20 tracking-wide"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── FOOTER SCROLLING PLATFORM TICKER TAPE ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-8 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md overflow-hidden pointer-events-none select-none">
        <motion.div
          className="flex items-center h-full whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
        >
          {[
            "Automated Investigation",
            "Safety-First Remediation",
            "Closed-Loop Learning",
            "AI-Driven Root Cause Analysis",
            "Multi-Cloud Support",
            "Policy-Gated Actions",
            "GitHub PR Auto-Generation",
            "AES-256 Credential Encryption",
            "Automated Investigation",
            "Safety-First Remediation",
            "Closed-Loop Learning",
            "AI-Driven Root Cause Analysis",
            "Multi-Cloud Support",
            "Policy-Gated Actions",
            "GitHub PR Auto-Generation",
            "AES-256 Credential Encryption",
          ].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-2.5 px-6 font-mono text-[9.5px] font-semibold text-zinc-600 tracking-widest uppercase"
            >
              <span className="text-zinc-800 text-[6px]">◆</span>
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
