import { jsxs, jsx } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.mjs";
import { Link } from "react-router-dom";
import { Moon, Sun, ArrowRight, Flame, Zap, MessageSquare, XCircle, TrendingUp, Heart, MessageCircle, BookOpen } from "lucide-react";
import { create } from "zustand";
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
      const api = (await import("./assets/api-BheD6Cod.mjs")).default;
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
      className: `relative w-9 h-9 rounded-xl border border-forge-border flex items-center justify-center transition-all hover:border-forge-border-bright hover:bg-forge-surface hover:shadow-glow-cyan group cursor-pointer ${className}`,
      children: isLight ? /* @__PURE__ */ jsx(Moon, { size: 14, className: "text-forge-muted group-hover:text-forge-accent transition-colors" }) : /* @__PURE__ */ jsx(Sun, { size: 14, className: "text-forge-muted group-hover:text-amber-400 transition-colors" })
    }
  );
}
const STATS = [
  { value: "10M+", label: "Clips Generated" },
  { value: "98.3%", label: "Accuracy Rate" },
  { value: "40×", label: "Faster Than Manual" }
];
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
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-forge-bg text-forge-text", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between px-5 sm:px-10 py-4 max-w-6xl mx-auto", children: [
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
    /* @__PURE__ */ jsxs("main", { className: "max-w-6xl mx-auto px-5 sm:px-10", children: [
      /* @__PURE__ */ jsxs("section", { className: "pt-12 sm:pt-20 pb-10 text-center", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-[2.5rem] sm:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.93] mb-5", children: [
          "AI Clip Maker — turn any video",
          /* @__PURE__ */ jsx("br", {}),
          "into ",
          /* @__PURE__ */ jsx("span", { className: "gradient-text", children: "viral clips." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-forge-subtext text-base sm:text-xl leading-relaxed mb-8 max-w-[55ch] mx-auto", children: "Paste any YouTube URL. VibeClip's AI finds the moments worth posting, auto-crops to 9:16, and burns in word-level captions — export-ready for TikTok, Instagram Reels, and YouTube Shorts in minutes." }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/app",
            className: "inline-flex items-center gap-2 text-base font-semibold px-7 py-3.5 rounded-2xl bg-forge-accent text-white hover:opacity-90 transition-opacity",
            children: [
              "Make a clip free ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "flex w-fit mx-auto mt-12 divide-x divide-forge-border border border-forge-border rounded-2xl overflow-hidden", children: STATS.map((s, i) => /* @__PURE__ */ jsxs("div", { className: "px-5 sm:px-8 py-4", children: [
          /* @__PURE__ */ jsx("span", { className: `text-xl sm:text-2xl font-black leading-none ${i === 2 ? "gradient-text" : "text-forge-text"}`, children: s.value }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-forge-muted mt-1 whitespace-nowrap", children: s.label })
        ] }, s.label)) })
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
          "Start turning videos into ",
          /* @__PURE__ */ jsx("span", { className: "gradient-text", children: "clips." })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/app",
            className: "inline-flex items-center gap-2 text-base font-semibold px-7 py-3.5 rounded-2xl bg-forge-accent text-white hover:opacity-90 transition-opacity",
            children: [
              "Make a clip free ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("footer", { className: "border-t border-forge-border py-8 text-center text-sm text-forge-muted", children: [
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
