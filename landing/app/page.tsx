import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Snacc Buddy — Your AI Food Diary",
};

/* ─────────────────────── Inline SVG icons ─────────────────────── */

type IconProps = { className?: string; style?: React.CSSProperties };

function IconCamera({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconSparkles({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z" />
      <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75z" />
    </svg>
  );
}

function IconChart({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconBook({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="12" y1="6" x2="16" y2="6" />
      <line x1="12" y1="10" x2="16" y2="10" />
    </svg>
  );
}

function IconHeart({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconStar({ className, style, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconCheck({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}


function IconBolt({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconApple({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function IconPlayStore({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.18 23.76a2 2 0 0 0 2.8.74l10.47-6.05-2.96-2.96-10.31 8.27zM20.65 10.4L16.7 8.14 13.4 11.44l3.3 3.3 3.96-2.28a2 2 0 0 0 0-3.46v.4zM2 1.86a2 2 0 0 0-.18.84v18.6c0 .3.06.58.18.84l.1.1 10.41-10.41v-.24L2.1 1.76 2 1.86zM13.4 12.56L3.18 23.76a2 2 0 0 0 2.8-.0l10.72-6.2-3.3-3.3-.0-.0z" />
    </svg>
  );
}

/* ─────────────────────── Phone mockup ─────────────────────── */

function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 270 }}>
      {/* Floating blobs around phone */}
      <div className="blob animate-float w-14 h-14 bg-mint absolute -left-10 top-16 rounded-full border-2" style={{ borderColor: "#7ECFB0" }} />
      <div className="blob animate-float-delay w-10 h-10 bg-peach absolute -right-8 top-8 rounded-full border-2" style={{ borderColor: "#FFBA7A" }} />
      <div className="blob animate-float-slow w-12 h-12 bg-lavender absolute -right-12 bottom-24 rounded-full border-2" style={{ borderColor: "#B89DD0" }} />
      <div className="blob animate-float w-8 h-8 bg-lemon absolute -left-8 bottom-16 rounded-full border-2" style={{ borderColor: "#FFD97A" }} />

      {/* Phone shell */}
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          width: 270,
          height: 560,
          borderRadius: 44,
          border: "3px solid #FFB3C6",
          boxShadow: "8px 8px 0px #FFB3C6, inset 0 2px 8px rgba(255,133,161,0.15)",
          background: "#FFF5F7",
        }}
      >
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-pink-200 rounded-full z-10" />

        {/* Screen */}
        <div className="absolute inset-0 flex flex-col pt-10 px-4 pb-4 gap-3">
          {/* App header */}
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-clay-muted font-body">Good morning!</p>
              <p className="text-sm font-heading font-bold text-clay-text">Sarah&apos;s Diary</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-white text-sm" style={{ background: "#FF85A1", border: "2px solid #D4506A" }}>
              S
            </div>
          </div>

          {/* Daily summary card */}
          <div className="rounded-2xl p-3" style={{ background: "#FF85A1", border: "2px solid #D4506A", boxShadow: "4px 4px 0px #D4506A" }}>
            <p className="text-white text-xs font-body opacity-90">Today&apos;s calories</p>
            <p className="text-white text-2xl font-heading font-bold">1,240</p>
            <div className="mt-2 h-2 bg-pink-400 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-white opacity-90" style={{ width: "62%" }} />
            </div>
            <p className="text-white text-xs mt-1 font-body opacity-80">Goal: 2,000 kcal &nbsp;·&nbsp; 62% reached</p>
          </div>

          {/* Food log entries */}
          <p className="text-xs font-heading font-semibold text-clay-mid mt-1">Today&apos;s log</p>

          {[
            { label: "Avocado Toast", cal: "320 kcal", color: "#A8E6CF", border: "#7ECFB0", dot: "#7ECFB0" },
            { label: "Oat Latte", cal: "150 kcal", color: "#FFD3A5", border: "#FFBA7A", dot: "#FFBA7A" },
            { label: "Chicken Salad", cal: "410 kcal", color: "#D4B8E0", border: "#B89DD0", dot: "#B89DD0" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
              style={{ background: item.color, border: `2px solid ${item.border}`, boxShadow: `3px 3px 0px ${item.border}` }}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.dot }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-semibold text-clay-text truncate">{item.label}</p>
              </div>
              <p className="text-xs font-body text-clay-mid flex-shrink-0">{item.cal}</p>
            </div>
          ))}

          {/* Camera CTA */}
          <div
            className="mt-auto flex items-center justify-center gap-2 rounded-2xl py-3 cursor-pointer"
            style={{ background: "#2D1B2E", border: "2px solid #1a0f1b", boxShadow: "3px 3px 0px #1a0f1b" }}
          >
            <IconCamera className="w-4 h-4 text-pink-300" />
            <span className="text-white text-sm font-heading font-semibold">Snap a snack</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Stars component ─────────────────────── */

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} filled={i < count} className="w-4 h-4 text-yellow-400" />
      ))}
    </div>
  );
}

/* ─────────────────────── Feature card ─────────────────────── */

const FEATURES = [
  {
    icon: <IconCamera className="w-6 h-6 text-pink-500" />,
    iconBg: "bg-pink-100",
    title: "Snap your snack",
    body: "Just point your camera at any meal. No scanning barcodes, no tedious typing.",
    variant: "clay-card",
  },
  {
    icon: <IconSparkles className="w-6 h-6" style={{ color: "#9B59B6" }} />,
    iconBg: "bg-lavender",
    title: "Instant AI magic",
    body: "Gemini AI identifies every ingredient, estimates portions, and calculates calories in seconds.",
    variant: "clay-card-lavender",
  },
  {
    icon: <IconChart className="w-6 h-6" style={{ color: "#27AE60" }} />,
    iconBg: "bg-mint",
    title: "Watch your progress",
    body: "Beautiful charts show your weekly trends, macros breakdown, and calorie streaks.",
    variant: "clay-card-mint",
  },
  {
    icon: <IconBook className="w-6 h-6" style={{ color: "#E67E22" }} />,
    iconBg: "bg-peach",
    title: "Personal food diary",
    body: "Your food story, day by day. Add notes, moods, and memories to every meal.",
    variant: "clay-card-peach",
  },
  {
    icon: <IconHeart className="w-6 h-6 text-pink-400" />,
    iconBg: "bg-pink-100",
    title: "Mindful eating",
    body: "Set daily goals, get gentle nudges, and celebrate every healthy choice you make.",
    variant: "clay-card",
  },
  {
    icon: <IconBolt className="w-6 h-6" style={{ color: "#F1C40F" }} />,
    iconBg: "bg-lemon",
    title: "Always-on insights",
    body: "Smart suggestions based on your eating patterns help you make better choices effortlessly.",
    variant: "clay-card-lemon",
  },
] as const;

/* ─────────────────────── Page ─────────────────────── */

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── Navbar ── */}
      <header className="fixed top-4 left-4 right-4 z-50">
        <nav
          className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur-md"
          style={{ borderRadius: 18, border: "2px solid #FFB3C6", boxShadow: "4px 4px 0px #FFB3C6" }}
        >
          <a href="#" className="flex items-center gap-2 font-heading font-bold text-xl text-clay-text">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FF85A1", border: "2px solid #D4506A" }}>
              <IconCamera className="w-4 h-4 text-white" />
            </div>
            Snacc Buddy
          </a>

          <div className="hidden md:flex items-center gap-6 text-sm font-body font-semibold text-clay-mid">
            <a href="#how-it-works" className="hover:text-pink-400 transition-colors duration-200">How it works</a>
            <a href="#features" className="hover:text-pink-400 transition-colors duration-200">Features</a>
            <a href="#reviews" className="hover:text-pink-400 transition-colors duration-200">Reviews</a>
          </div>

          <a href="#download" className="btn-clay text-sm py-2.5 px-5 text-base">
            Download free
          </a>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-28 pb-16 px-4">
        {/* Background blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-pink-100 opacity-60 blur-2xl pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-64 h-64 rounded-full bg-mint opacity-40 blur-2xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-48 h-48 rounded-full bg-lavender opacity-30 blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 font-body text-sm font-semibold" style={{ background: "#FFE4EC", border: "2px solid #FFB3C6", color: "#D4506A" }}>
              <IconSparkles className="w-4 h-4" />
              Powered by Gemini AI
            </div>

            <h1 className="font-heading font-extrabold text-5xl lg:text-6xl xl:text-7xl text-clay-text leading-tight mb-6">
              Your personal{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-pink-400">food diary</span>
                <span
                  className="absolute inset-x-0 bottom-0 h-4 -z-0 rotate-[-1deg]"
                  style={{ background: "#FFE4EC", borderRadius: 6 }}
                />
              </span>
              <br />
              powered by AI
            </h1>

            <p className="font-body text-lg text-clay-mid leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Snap a photo of your meal and let Snacc Buddy instantly identify ingredients, estimate calories, and write it all in your personal food journal — effortlessly.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
              <a href="#download" className="btn-clay">
                <IconApple className="w-5 h-5" />
                App Store
              </a>
              <a href="#download" className="btn-clay-outline">
                <IconPlayStore className="w-5 h-5" />
                Google Play
              </a>
            </div>

            {/* Social proof mini */}
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {["#FF85A1", "#A8E6CF", "#D4B8E0", "#FFD3A5"].map((c, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white font-heading font-bold text-xs" style={{ background: c }}>
                    {["S", "J", "M", "L"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <IconStar key={i} filled className="w-3.5 h-3.5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs font-body text-clay-muted">Loved by 10,000+ snack trackers</p>
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="order-1 lg:order-2 flex justify-center">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-14">
            <p className="font-body font-semibold text-pink-400 mb-2 uppercase tracking-widest text-sm">How it works</p>
            <h2 className="font-heading font-extrabold text-4xl lg:text-5xl text-clay-text">
              Three simple steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <IconCamera className="w-8 h-8 text-pink-400" />,
                title: "Snap your meal",
                body: "Open the app, point your camera at your food, and tap the button. That's it — no login needed.",
                variant: "clay-card",
                stepColor: "#FF85A1",
              },
              {
                step: "02",
                icon: <IconSparkles className="w-8 h-8" style={{ color: "#9B59B6" }} />,
                title: "AI does the work",
                body: "Gemini AI analyses your photo in seconds — identifying every ingredient, portion size, and calorie count.",
                variant: "clay-card-lavender",
                stepColor: "#D4B8E0",
              },
              {
                step: "03",
                icon: <IconBook className="w-8 h-8" style={{ color: "#27AE60" }} />,
                title: "It goes in your diary",
                body: "Your meal is instantly logged in your personal food diary with nutrition info and a beautiful entry.",
                variant: "clay-card-mint",
                stepColor: "#A8E6CF",
              },
            ].map(({ step, icon, title, body, variant, stepColor }) => (
              <div key={step} className={`${variant} p-7 relative`}>
                <div
                  className="absolute -top-4 -left-2 w-10 h-10 rounded-full flex items-center justify-center font-heading font-extrabold text-white text-sm"
                  style={{ background: stepColor, border: "2.5px solid rgba(0,0,0,0.1)" }}
                >
                  {step}
                </div>
                <div className="mt-4 mb-4">{icon}</div>
                <h3 className="font-heading font-bold text-xl text-clay-text mb-2">{title}</h3>
                <p className="font-body text-clay-mid text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4 bg-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body font-semibold text-pink-400 mb-2 uppercase tracking-widest text-sm">Features</p>
            <h2 className="font-heading font-extrabold text-4xl lg:text-5xl text-clay-text">
              Everything you need,{" "}
              <span className="text-pink-400">nothing you don&apos;t</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {FEATURES.map(({ icon, iconBg, title, body, variant }) => (
              <div key={title} className={`${variant} p-6 cursor-pointer transition-transform duration-200 hover:-translate-y-1`}>
                <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
                  {icon}
                </div>
                <h3 className="font-heading font-bold text-lg text-clay-text mb-2">{title}</h3>
                <p className="font-body text-clay-mid text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's included ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          {/* List */}
          <div>
            <p className="font-body font-semibold text-pink-400 mb-2 uppercase tracking-widest text-sm">Why Snacc Buddy?</p>
            <h2 className="font-heading font-extrabold text-4xl text-clay-text mb-6">
              Calorie tracking that actually feels good
            </h2>
            <p className="font-body text-clay-mid leading-relaxed mb-8">
              We built Snacc Buddy because calorie apps felt like homework. We wanted something that felt like writing in a diary — personal, warm, and fun.
            </p>
            <ul className="space-y-4">
              {[
                "No manual food database searching",
                "Works with any cuisine from any country",
                "Handles homemade and restaurant meals",
                "Private — your diary stays on your device",
                "Completely free to download and use",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#A8E6CF", border: "2px solid #7ECFB0" }}>
                    <IconCheck className="w-3.5 h-3.5 text-green-700" />
                  </div>
                  <span className="font-body text-clay-mid text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-5">
            {[
              { value: "10K+", label: "Active users", bg: "bg-pink-100", border: "#FFB3C6", shadow: "#FFB3C6" },
              { value: "4.9", label: "App Store rating", bg: "bg-lemon", border: "#FFD97A", shadow: "#FFD97A" },
              { value: "< 3s", label: "Analysis speed", bg: "bg-mint", border: "#7ECFB0", shadow: "#7ECFB0" },
              { value: "50+", label: "Cuisines detected", bg: "bg-lavender", border: "#B89DD0", shadow: "#B89DD0" },
            ].map(({ value, label, bg, border, shadow }) => (
              <div
                key={label}
                className={`${bg} rounded-clay p-6 text-center`}
                style={{ border: `2.5px solid ${border}`, boxShadow: `5px 5px 0px ${shadow}` }}
              >
                <p className="font-heading font-extrabold text-4xl text-clay-text mb-1">{value}</p>
                <p className="font-body text-sm text-clay-mid">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="reviews" className="py-20 px-4 bg-pink-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body font-semibold text-pink-400 mb-2 uppercase tracking-widest text-sm">Reviews</p>
            <h2 className="font-heading font-extrabold text-4xl lg:text-5xl text-clay-text">
              Snackers love it
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            {[
              {
                name: "Sarah K.",
                handle: "@sarahkfoods",
                review: "I've tried every calorie app out there. Snacc Buddy is the first one I've actually stuck with. It feels like my diary, not a chore.",
                avatar: "#FF85A1",
                variant: "clay-card",
                stars: 5,
              },
              {
                name: "James L.",
                handle: "@jlfit",
                review: "The AI is scarily accurate. It identified my grandma's home-cooked curry and got the calories spot on. Blew my mind.",
                avatar: "#A8E6CF",
                variant: "clay-card-mint",
                stars: 5,
              },
              {
                name: "Mia T.",
                handle: "@mia_eats",
                review: "Love how colourful and fun it is. Other apps feel clinical, Snacc Buddy feels like journalling. Actually excited to log my food now!",
                avatar: "#D4B8E0",
                variant: "clay-card-lavender",
                stars: 5,
              },
            ].map(({ name, handle, review, avatar, variant, stars }) => (
              <div key={name} className={`${variant} p-6 flex flex-col gap-4`}>
                <Stars count={stars} />
                <p className="font-body text-clay-mid text-sm leading-relaxed flex-1">&ldquo;{review}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-white flex-shrink-0" style={{ background: avatar }}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-sm text-clay-text">{name}</p>
                    <p className="font-body text-xs text-clay-muted">{handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download CTA ── */}
      <section id="download" className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="rounded-[28px] p-10 md:p-16 relative overflow-hidden"
            style={{ background: "#FF85A1", border: "3px solid #D4506A", boxShadow: "8px 8px 0px #D4506A" }}
          >
            {/* Decorative blobs inside card */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-pink-300 opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-pink-200 opacity-40 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="font-heading font-extrabold text-4xl lg:text-5xl text-white mb-4">
                Start your food diary today
              </h2>
              <p className="font-body text-lg text-white opacity-90 mb-10 max-w-xl mx-auto leading-relaxed">
                Free forever. No subscriptions. Just you, your snacks, and a little AI magic.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <a href="#" className="btn-clay-white">
                  <IconApple className="w-6 h-6" />
                  <span>
                    <span className="block text-xs font-body font-normal opacity-70">Download on the</span>
                    App Store
                  </span>
                </a>
                <a href="#" className="btn-clay-white">
                  <IconPlayStore className="w-6 h-6" />
                  <span>
                    <span className="block text-xs font-body font-normal opacity-70">Get it on</span>
                    Google Play
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-4 border-t-2 border-pink-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <a href="#" className="flex items-center gap-2 font-heading font-bold text-xl text-clay-text">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FF85A1", border: "2px solid #D4506A" }}>
              <IconCamera className="w-4 h-4 text-white" />
            </div>
            Snacc Buddy
          </a>

          <div className="flex gap-6 text-sm font-body text-clay-muted">
            <a href="#" className="hover:text-pink-400 transition-colors duration-200">Privacy</a>
            <a href="#" className="hover:text-pink-400 transition-colors duration-200">Terms</a>
            <a href="#" className="hover:text-pink-400 transition-colors duration-200">Contact</a>
          </div>

          <p className="text-sm font-body text-clay-muted" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} Snacc Buddy. Made with{" "}
            <IconHeart className="w-3.5 h-3.5 inline text-pink-400" />
          </p>
        </div>
      </footer>
    </div>
  );
}
