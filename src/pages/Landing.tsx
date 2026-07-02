import { Link } from 'react-router-dom'
import {
  Flame, Zap, MessageSquare, XCircle, TrendingUp, Heart,
  MessageCircle, BookOpen, ArrowRight, type LucideIcon,
} from 'lucide-react'
import VibeClipLogo from '../components/VibeClipLogo'
import ThemeToggle from '../components/ThemeToggle'
import HeroBg from '../components/HeroBg'

// ponytail: public marketing page, zero auth/API deps so it prerenders to static HTML.
// Real app dashboard lives at /app (protected). Crawlers + AI bots read this page.

const CLIP_TYPES: { label: string; Icon: LucideIcon }[] = [
  { label: 'Controversy', Icon: Flame },
  { label: 'Hook Intro', Icon: Zap },
  { label: 'Quotable', Icon: MessageSquare },
  { label: 'Myth Bust', Icon: XCircle },
  { label: 'Shocking Stat', Icon: TrendingUp },
  { label: 'Emotional Peak', Icon: Heart },
  { label: 'Debate Moment', Icon: MessageCircle },
  { label: 'Story Arc', Icon: BookOpen },
]

const STEPS = [
  { n: 1, title: 'Paste your YouTube URL', text: 'Drop any YouTube link or upload a video file (MP4/MOV up to 2GB).' },
  { n: 2, title: 'AI detects viral moments', text: 'VibeClip transcribes the video and finds the 3–15 most share-worthy moments automatically.' },
  { n: 3, title: 'Review and customize', text: 'Preview each clip, adjust trim points, pick a caption style, add a viral hook overlay.' },
  { n: 4, title: 'Export and share', text: 'Download 9:16 vertical clips ready for TikTok, Instagram Reels, or YouTube Shorts — captions baked in.' },
]

const FAQ = [
  { q: 'How do I turn a YouTube video into TikTok clips?', a: 'Paste the YouTube URL into VibeClip. The AI transcribes the video, detects the most viral moments, crops them to 9:16, adds captions, and lets you export clip-ready videos for TikTok in minutes.' },
  { q: 'Does VibeClip add captions automatically?', a: 'Yes. VibeClip generates word-level captions using AI transcription and burns them into each clip. Choose from 15+ caption styles including word highlight, neon glow, and karaoke pop.' },
  { q: 'What video formats does VibeClip support?', a: 'YouTube URLs and direct uploads (MP4, MOV up to 2GB). It exports MP4 in 9:16 (TikTok/Reels/Shorts), 1:1 (square), or 16:9 (landscape).' },
  { q: 'Is VibeClip free to use?', a: 'VibeClip offers a free tier with credits included on signup. Paid plans provide monthly credits for higher volume clipping, plus 1080p downloads.' },
  { q: 'How long does it take to generate clips?', a: 'Most videos process in 2–5 minutes depending on length. Transcription, AI analysis, and clip extraction run in parallel on the backend.' },
]

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-forge-bg text-forge-text overflow-hidden">
      {/* Aurora backdrop scoped to the first viewport, fading out below the hero */}
      <div
        className="absolute inset-x-0 top-0 h-screen"
        style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}
      >
        <HeroBg />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-10 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <VibeClipLogo size={32} />
          <span className="font-black text-lg tracking-tight">VibeClip</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/signin" className="text-sm text-forge-subtext hover:text-forge-text transition-colors">Sign in</Link>
          <Link to="/app" className="text-sm font-semibold px-4 py-2 rounded-xl bg-forge-accent text-white hover:opacity-90 transition-opacity">
            Start free
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 sm:px-10">
        {/* Hero */}
        <section className="pt-12 sm:pt-20 pb-10 text-center">
          <h1 className="text-[2.6rem] sm:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.98] mb-5">
            Turn any video into{' '}
            <span className="font-display italic font-normal gradient-text tracking-tight">viral clips</span>
          </h1>
          <p className="text-forge-subtext text-base sm:text-xl leading-relaxed mb-8 max-w-[50ch] mx-auto">
            Paste a YouTube URL. AI finds the moments worth posting, crops to 9:16, and burns in
            word-level captions — ready for TikTok, Reels, and Shorts in minutes.
          </p>
          <Link
            to="/app"
            className="btn-primary inline-flex items-center gap-2 text-base font-bold px-8 py-4 rounded-2xl text-white"
          >
            Make a clip free <ArrowRight size={18} />
          </Link>
          <p className="mt-4 text-xs text-forge-muted">
            Free credits on signup · No credit card needed
          </p>
        </section>

        {/* How it works */}
        <section className="py-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center mb-12">How VibeClip works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="glass-card rounded-2xl p-6 border border-forge-border">
                <span className="text-3xl font-black gradient-text">{s.n}</span>
                <h3 className="font-bold mt-3 mb-1.5">{s.title}</h3>
                <p className="text-sm text-forge-subtext leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Clip types */}
        <section className="py-16">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center mb-3">Every kind of viral moment</h2>
          <p className="text-forge-subtext text-center mb-12 max-w-[50ch] mx-auto">
            VibeClip's AI is trained to spot the moments that travel — not just random cuts.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CLIP_TYPES.map(({ label, Icon }) => (
              <div key={label} className="glass-card rounded-2xl p-5 border border-forge-border flex flex-col items-center text-center gap-2">
                <Icon size={24} className="text-forge-accent" />
                <span className="text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="glass-card rounded-2xl p-5 border border-forge-border">
                <summary className="font-bold cursor-pointer">{q}</summary>
                <p className="text-sm text-forge-subtext leading-relaxed mt-3">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-5">
            Start turning videos into{' '}
            <span className="font-display italic font-normal gradient-text tracking-tight">clips</span>
          </h2>
          <Link
            to="/app"
            className="btn-primary inline-flex items-center gap-2 text-base font-bold px-8 py-4 rounded-2xl text-white"
          >
            Make a clip free <ArrowRight size={18} />
          </Link>
          <p className="mt-4 text-xs text-forge-muted">
            Free credits on signup · No credit card needed
          </p>
        </section>
      </main>

      <footer className="relative z-10 border-t border-forge-border py-8 text-center text-sm text-forge-muted">
        <div className="flex items-center justify-center gap-2 mb-2">
          <VibeClipLogo size={20} />
          <span className="font-bold">VibeClip</span>
        </div>
        <p>AI Clip Maker — YouTube to TikTok, Reels & Shorts.</p>
      </footer>
    </div>
  )
}
