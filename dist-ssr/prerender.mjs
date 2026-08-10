import { jsxs, jsx } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.mjs";
import { Link } from "react-router-dom";
import { Moon, Sun, ArrowRight, Flame, Zap, MessageSquare, XCircle, TrendingUp, Heart, MessageCircle, BookOpen } from "lucide-react";
import { create } from "zustand";
import { memo } from "react";
import { motion } from "framer-motion";
function VibeClipLogo({ size = 32, className = "" }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 512 512",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className,
      children: [
        /* @__PURE__ */ jsx("rect", { width: "512", height: "512", rx: "96", fill: "#09090B" }),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M156 128C156 114.745 170.745 106.837 181.778 114.223L380.222 247.223C390.083 253.83 390.083 268.17 380.222 274.777L181.778 407.777C170.745 415.163 156 407.255 156 394V128Z",
            fill: "#06B6D4"
          }
        ),
        /* @__PURE__ */ jsx("rect", { x: "140", y: "248", width: "74", height: "16", fill: "#09090B" }),
        /* @__PURE__ */ jsx("rect", { x: "298", y: "248", width: "74", height: "16", fill: "#09090B" }),
        /* @__PURE__ */ jsx("circle", { cx: "218", cy: "214", r: "24", stroke: "#09090B", strokeWidth: "14", fill: "none" }),
        /* @__PURE__ */ jsx("circle", { cx: "218", cy: "298", r: "24", stroke: "#09090B", strokeWidth: "14", fill: "none" }),
        /* @__PURE__ */ jsx("path", { d: "M236 238L306 194", stroke: "#09090B", strokeWidth: "16", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("path", { d: "M236 274L306 318", stroke: "#09090B", strokeWidth: "16", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("circle", { cx: "242", cy: "256", r: "8", fill: "#09090B" })
      ]
    }
  );
}
const getSavedTheme = () => localStorage.getItem("theme") || "dark";
const applyTheme = (theme) => {
  const html = document.documentElement;
  if (theme === "light") {
    html.classList.add("light");
  } else {
    html.classList.remove("light");
  }
  localStorage.setItem("theme", theme);
};
applyTheme(getSavedTheme());
const getSavedUser = () => {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const useStore = create((set, get) => ({
  // ── App state ──
  currentJob: null,
  clips: [],
  selectedClipId: null,
  theme: getSavedTheme(),
  // ── Auth state ──
  user: getSavedUser(),
  token: localStorage.getItem("auth_token") || null,
  setCurrentJob: (job) => set({ currentJob: job }),
  setClips: (clips) => set({ clips }),
  setSelectedClipId: (id) => set({ selectedClipId: id }),
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
  // ── Auth actions ──
  setAuth: ({ access_token, user }) => {
    localStorage.setItem("auth_token", access_token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    set({ token: access_token, user });
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    set({ token: null, user: null, currentJob: null, clips: [], selectedClipId: null });
  },
  refreshUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const api = (await import("./assets/api-D_9KfXzr.mjs")).default;
      const { data } = await api.get("/api/auth/me");
      localStorage.setItem("auth_user", JSON.stringify(data));
      set({ user: data });
    } catch {
    }
  },
  updateClip: (clipId, updates) => set((state) => ({
    clips: state.clips.map((c) => c.id === clipId ? { ...c, ...updates } : c)
  })),
  getRecentJobs: () => {
    try {
      const all = JSON.parse(localStorage.getItem("recentJobs") || "[]");
      return all.filter((j) => j.status === "ready");
    } catch {
      return [];
    }
  },
  addRecentJob: (job) => {
    const recent = get().getRecentJobs();
    const updated = [
      {
        id: job.job_id,
        title: job.video_title ?? null,
        status: job.status ?? "ready",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      ...recent.filter((j) => j.id !== job.job_id)
    ].slice(0, 10);
    localStorage.setItem("recentJobs", JSON.stringify(updated));
  }
}));
function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useStore();
  const isLight = theme === "light";
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: toggleTheme,
      title: isLight ? "Switch to dark mode" : "Switch to light mode",
      className: `relative w-9 h-9 rounded-full border border-forge-border bg-forge-surface/60 flex items-center justify-center transition-colors hover:border-forge-border-bright group cursor-pointer ${className}`,
      children: isLight ? /* @__PURE__ */ jsx(Moon, { size: 14, className: "text-forge-muted group-hover:text-forge-text transition-colors" }) : /* @__PURE__ */ jsx(Sun, { size: 14, className: "text-forge-muted group-hover:text-forge-text transition-colors" })
    }
  );
}
const HeroBg = memo(() => /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 overflow-hidden pointer-events-none select-none", "aria-hidden": "true", children: [
  /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "absolute inset-0 origin-center",
      style: {
        background: [
          "conic-gradient(from 0deg at 25% 55%,",
          "  transparent 0deg,",
          "  rgba(6,182,212,0.09) 45deg,",
          "  rgba(20,184,166,0.07) 90deg,",
          "  transparent 140deg,",
          "  rgba(34,211,238,0.06) 210deg,",
          "  rgba(6,182,212,0.08) 255deg,",
          "  transparent 310deg,",
          "  rgba(16,185,129,0.05) 340deg,",
          "  transparent 360deg",
          ")"
        ].join("")
      },
      animate: { rotate: 360 },
      transition: { duration: 28, repeat: Infinity, ease: "linear" }
    }
  ),
  /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "absolute inset-0 origin-[70%_40%]",
      style: {
        background: [
          "conic-gradient(from 180deg at 70% 40%,",
          "  transparent 0deg,",
          "  rgba(20,184,166,0.06) 50deg,",
          "  transparent 110deg,",
          "  rgba(6,182,212,0.07) 190deg,",
          "  rgba(34,211,238,0.05) 230deg,",
          "  transparent 290deg,",
          "  rgba(16,185,129,0.04) 340deg,",
          "  transparent 360deg",
          ")"
        ].join("")
      },
      animate: { rotate: -360 },
      transition: { duration: 38, repeat: Infinity, ease: "linear" }
    }
  ),
  /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full",
      style: { background: "radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 68%)", filter: "blur(55px)" },
      animate: { x: [0, 35, -15, 25, 0], y: [0, -25, 35, -15, 0] },
      transition: { duration: 20, repeat: Infinity, ease: "easeInOut" }
    }
  ),
  /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "absolute bottom-[-15%] right-[-5%] w-[50%] h-[55%] rounded-full",
      style: { background: "radial-gradient(circle, rgba(20,184,166,0.13) 0%, transparent 65%)", filter: "blur(50px)" },
      animate: { x: [0, -30, 20, -10, 0], y: [0, 20, -30, 15, 0] },
      transition: { duration: 24, repeat: Infinity, ease: "easeInOut", delay: 3 }
    }
  ),
  /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "absolute top-[35%] left-[45%] w-[35%] h-[35%] rounded-full",
      style: { background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)", filter: "blur(45px)" },
      animate: { x: [0, -20, 30, -10, 20, 0], y: [0, 25, -15, 30, -10, 0], scale: [1, 1.15, 0.9, 1.08, 1] },
      transition: { duration: 18, repeat: Infinity, ease: "easeInOut", delay: 6 }
    }
  ),
  /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "absolute top-[5%] right-[15%] w-[28%] h-[28%] rounded-full",
      style: { background: "radial-gradient(circle, rgba(34,211,238,0.11) 0%, transparent 65%)", filter: "blur(35px)" },
      animate: { x: [0, 20, -25, 10, 0], y: [0, 30, -10, 25, 0] },
      transition: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
    }
  ),
  /* @__PURE__ */ jsx(
    "div",
    {
      className: "absolute inset-0 opacity-[0.028]",
      style: {
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.85) 1px, transparent 1px)",
        backgroundSize: "30px 30px"
      }
    }
  ),
  /* @__PURE__ */ jsx(
    "div",
    {
      className: "absolute inset-0 opacity-[0.018]",
      style: {
        backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 40px)"
      }
    }
  )
] }));
const CLIP_TYPES = [
  { label: "Controversy", Icon: Flame },
  { label: "Hook Intro", Icon: Zap },
  { label: "Quotable", Icon: MessageSquare },
  { label: "Myth Bust", Icon: XCircle },
  { label: "Shocking Stat", Icon: TrendingUp },
  { label: "Emotional Peak", Icon: Heart },
  { label: "Debate Moment", Icon: MessageCircle },
  { label: "Story Arc", Icon: BookOpen }
];
const STEPS = [
  { n: 1, title: "Paste your YouTube URL", text: "Drop any YouTube link or upload a video file (MP4/MOV up to 2GB)." },
  { n: 2, title: "AI detects viral moments", text: "VibeClip transcribes the video and finds the 3–15 most share-worthy moments automatically." },
  { n: 3, title: "Review and customize", text: "Preview each clip, adjust trim points, pick a caption style, add a viral hook overlay." },
  { n: 4, title: "Export and share", text: "Download 9:16 vertical clips ready for TikTok, Instagram Reels, or YouTube Shorts — captions baked in." }
];
const FAQ = [
  { q: "How do I turn a YouTube video into TikTok clips?", a: "Paste the YouTube URL into VibeClip. The AI transcribes the video, detects the most viral moments, crops them to 9:16, adds captions, and lets you export clip-ready videos for TikTok in minutes." },
  { q: "Does VibeClip add captions automatically?", a: "Yes. VibeClip generates word-level captions using AI transcription and burns them into each clip. Choose from 15+ caption styles including word highlight, neon glow, and karaoke pop." },
  { q: "What video formats does VibeClip support?", a: "YouTube URLs and direct uploads (MP4, MOV up to 2GB). It exports MP4 in 9:16 (TikTok/Reels/Shorts), 1:1 (square), or 16:9 (landscape)." },
  { q: "Is VibeClip free to use?", a: "VibeClip offers a free tier with credits included on signup. Paid plans provide monthly credits for higher volume clipping, plus 1080p downloads." },
  { q: "How long does it take to generate clips?", a: "Most videos process in 2–5 minutes depending on length. Transcription, AI analysis, and clip extraction run in parallel on the backend." }
];
function Landing() {
  return /* @__PURE__ */ jsxs("div", { className: "relative min-h-screen bg-forge-bg text-forge-text overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-x-0 top-0 h-screen",
        style: { maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)" },
        children: /* @__PURE__ */ jsx(HeroBg, {})
      }
    ),
    /* @__PURE__ */ jsxs("header", { className: "relative z-10 flex items-center justify-between px-5 sm:px-10 py-4 max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(VibeClipLogo, { size: 32 }),
        /* @__PURE__ */ jsx("span", { className: "font-black text-lg tracking-tight", children: "VibeClip" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(ThemeToggle, {}),
        /* @__PURE__ */ jsx(Link, { to: "/signin", className: "text-sm text-forge-subtext hover:text-forge-text transition-colors", children: "Sign in" }),
        /* @__PURE__ */ jsx(Link, { to: "/app", className: "text-sm font-semibold px-4 py-2 rounded-xl bg-forge-accent text-white hover:opacity-90 transition-opacity", children: "Start free" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "relative z-10 max-w-6xl mx-auto px-5 sm:px-10", children: [
      /* @__PURE__ */ jsxs("section", { className: "pt-12 sm:pt-20 pb-10 text-center", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-[2.6rem] sm:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.98] mb-5", children: [
          "Turn any video into",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-display italic font-normal gradient-text tracking-tight", children: "viral clips" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-forge-subtext text-base sm:text-xl leading-relaxed mb-8 max-w-[50ch] mx-auto", children: "Paste a YouTube URL. AI finds the moments worth posting, crops to 9:16, and burns in word-level captions — ready for TikTok, Reels, and Shorts in minutes." }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/app",
            className: "btn-primary inline-flex items-center gap-2 text-base font-bold px-8 py-4 rounded-2xl text-white",
            children: [
              "Make a clip free ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-forge-muted", children: "Free credits on signup · No credit card needed" })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-black tracking-tight text-center mb-12", children: "How VibeClip works" }),
        /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-5", children: STEPS.map((s) => /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-6 border border-forge-border", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xl font-black gradient-text", children: s.n }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold mt-3 mb-1.5", children: s.title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-forge-subtext leading-relaxed", children: s.text })
        ] }, s.n)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "py-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-black tracking-tight text-center mb-3", children: "Every kind of viral moment" }),
        /* @__PURE__ */ jsx("p", { className: "text-forge-subtext text-center mb-12 max-w-[50ch] mx-auto", children: "VibeClip's AI is trained to spot the moments that travel — not just random cuts." }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: CLIP_TYPES.map(({ label, Icon }) => /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 border border-forge-border flex flex-col items-center text-center gap-2", children: [
          /* @__PURE__ */ jsx(Icon, { size: 24, className: "text-forge-accent" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: label })
        ] }, label)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "py-16 max-w-3xl mx-auto", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl font-black tracking-tight text-center mb-12", children: "Frequently asked questions" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: FAQ.map(({ q, a }) => /* @__PURE__ */ jsxs("details", { className: "glass-card rounded-2xl p-5 border border-forge-border", children: [
          /* @__PURE__ */ jsx("summary", { className: "font-bold cursor-pointer", children: q }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-forge-subtext leading-relaxed mt-3", children: a })
        ] }, q)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "py-20 text-center", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-3xl sm:text-5xl font-black tracking-tighter mb-5", children: [
          "Start turning videos into",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-display italic font-normal gradient-text tracking-tight", children: "clips" })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/app",
            className: "btn-primary inline-flex items-center gap-2 text-base font-bold px-8 py-4 rounded-2xl text-white",
            children: [
              "Make a clip free ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-forge-muted", children: "Free credits on signup · No credit card needed" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("footer", { className: "relative z-10 border-t border-forge-border py-8 text-center text-sm text-forge-muted", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsx(VibeClipLogo, { size: 20 }),
        /* @__PURE__ */ jsx("span", { className: "font-bold", children: "VibeClip" })
      ] }),
      /* @__PURE__ */ jsx("p", { children: "AI Clip Maker — YouTube to TikTok, Reels & Shorts." })
    ] })
  ] });
}
function render() {
  return renderToString(
    /* @__PURE__ */ jsx(StaticRouter, { location: "/", children: /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-forge-bg text-forge-text", children: /* @__PURE__ */ jsx(Landing, {}) }) })
  );
}
export {
  render
};
