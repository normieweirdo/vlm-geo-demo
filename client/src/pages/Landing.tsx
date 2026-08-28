import React, { useRef } from "react";
import { ArrowRight, Orbit, Radar, ScanSearch, Sparkles } from "lucide-react";

const heroImage = "/manus-storage/geoquery-orbital-horizon_68b1e642.jpg";

type LandingProps = { onEnter: (mode: "text" | "vision") => void };

export default function Landing({ onEnter }: LandingProps) {
  const landingRef = useRef<HTMLElement | null>(null);

  function updateParallax(clientX: number, clientY: number, element: HTMLElement) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = element.getBoundingClientRect();
    const x = ((clientX - bounds.left) / bounds.width - 0.5) * 18;
    const y = ((clientY - bounds.top) / bounds.height - 0.5) * 14;
    landingRef.current?.style.setProperty("--parallax-x", `${x}px`);
    landingRef.current?.style.setProperty("--parallax-y", `${y}px`);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    updateParallax(event.clientX, event.clientY, event.currentTarget);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    if (touch) updateParallax(touch.clientX, touch.clientY, event.currentTarget);
  }

  function handlePointerLeave() {
    landingRef.current?.style.setProperty("--parallax-x", "0px");
    landingRef.current?.style.setProperty("--parallax-y", "0px");
  }

  return (
    <main ref={landingRef} onPointerMove={handlePointerMove} onTouchMove={handleTouchMove} onPointerLeave={handlePointerLeave} onTouchEnd={handlePointerLeave} className="landing-page relative min-h-screen touch-pan-y overflow-hidden bg-[#04151d] text-white">
      <style>{`\n        .landing-page { --parallax-x: 0px; --parallax-y: 0px; }\n        .landing-page .landing-image { transform: translate3d(var(--parallax-x), var(--parallax-y), 0) scale(1.06); transition: transform 700ms cubic-bezier(.23,1,.32,1); }\n        .landing-page .landing-glow { animation: landing-glow 8s ease-in-out infinite; }\n        .landing-page .landing-orbit { animation: landing-orbit 18s linear infinite; transform-origin: center; }\n        .landing-page .landing-pulse { animation: landing-pulse 3.2s ease-in-out infinite; }\n        .landing-page .landing-reveal { animation: landing-reveal 700ms cubic-bezier(.23,1,.32,1) both; }\n        .landing-page .landing-reveal-delay-1 { animation-delay: 90ms; }\n        .landing-page .landing-reveal-delay-2 { animation-delay: 170ms; }\n        .landing-page .landing-reveal-delay-3 { animation-delay: 250ms; }
        .landing-page .landing-step { animation: landing-step 700ms cubic-bezier(.23,1,.32,1) both; }
        .landing-page .landing-step:nth-child(1) { animation-delay: 320ms; }
        .landing-page .landing-step:nth-child(2) { animation-delay: 410ms; }
        .landing-page .landing-step:nth-child(3) { animation-delay: 500ms; }
        .landing-page .geoquery-mark { position: relative; display: grid; place-items: center; }
        .landing-page .geoquery-mark::after { content: ""; position: absolute; width: 5px; height: 5px; right: -1px; top: 1px; border-radius: 999px; background: #ffd0a5; box-shadow: 0 0 10px #ffd0a5; }
        .landing-page .landing-touch-glow { animation: landing-touch-glow 7s ease-in-out infinite; }
        @keyframes landing-step { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes landing-touch-glow { 0%,100% { transform: translate3d(-8px, 0, 0) scale(.96); } 50% { transform: translate3d(8px, -8px, 0) scale(1.05); } }\n        @keyframes landing-glow { 0%,100% { opacity: .2; transform: translate3d(0,0,0) scale(1); } 50% { opacity: .42; transform: translate3d(18px,-10px,0) scale(1.08); } }\n        @keyframes landing-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n        @keyframes landing-pulse { 0%,100% { opacity: .5; transform: scale(.92); } 50% { opacity: 1; transform: scale(1.18); } }\n        @keyframes landing-reveal { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }\n        @media (prefers-reduced-motion: reduce) {\n          .landing-page .landing-image, .landing-page .landing-glow, .landing-page .landing-orbit, .landing-page .landing-pulse, .landing-page .landing-reveal, .landing-page .landing-step, .landing-page .landing-touch-glow { animation: none; transition: none; }\n        }\n      `}</style>\n      <div className="landing-image absolute inset-[-18px] bg-cover bg-center opacity-70" style={{ backgroundImage: `url(${heroImage})` }} aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#04151d_0%,rgba(4,21,29,.88)_30%,rgba(4,21,29,.34)_66%,rgba(4,21,29,.7)_100%)]" aria-hidden="true" />
      <div className="landing-glow landing-touch-glow absolute -right-20 top-24 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_36%,rgba(156,232,219,.16),transparent_25%),linear-gradient(180deg,rgba(4,21,29,.15),#04151d_94%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[8%] top-[26%] hidden h-72 w-72 rounded-full border border-cyan-100/15 sm:block" aria-hidden="true"><div className="landing-orbit absolute inset-[-1px] rounded-full border border-dashed border-orange-200/30"><span className="landing-pulse absolute -left-1 top-1/2 h-2 w-2 rounded-full bg-orange-200 shadow-[0_0_18px_#ffd0a5]" /></div><div className="absolute inset-10 rounded-full border border-cyan-100/10" /></div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/15 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-orange-200/35 bg-orange-200/10 text-orange-100"><span data-testid="geoquery-mark" className="geoquery-mark"><ScanSearch size={18} /></span></div>
            <div><p className="text-sm font-bold tracking-[0.22em]">ISRO / GEOQUERY</p><p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/55">Earth observation intelligence</p></div>
          </div>
          <div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 sm:flex"><span className="h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_14px_#9ce8db]" /> Mission interface online</div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-12 lg:py-12">
          <div className="landing-reveal max-w-2xl">
            <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.32em] text-orange-200"><Sparkles size={14} /> From orbit to insight</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[.94] tracking-[-0.06em] sm:text-6xl lg:text-7xl">Read the Earth<br /><span className="text-cyan-200">with new eyes.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">GeoQuery turns Earth observation imagery into an explorable conversation. Ask what is changing, where the evidence sits, and why it matters. Then see the model’s reasoning mapped back onto the scene.</p>
            <div data-testid="workflow-sequence" aria-label="Ask, Detect, Explain workflow" className="landing-reveal landing-reveal-delay-1 mt-6 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
              <div className="landing-step border-t border-cyan-200/30 pt-3"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">01</span><p className="mt-2 text-sm font-bold text-white">Ask</p><p className="mt-1 text-[11px] leading-4 text-white/45">Name the question.</p></div>
              <div className="landing-step border-t border-cyan-200/30 pt-3"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">02</span><p className="mt-2 text-sm font-bold text-white">Detect</p><p className="mt-1 text-[11px] leading-4 text-white/45">Find the evidence.</p></div>
              <div className="landing-step border-t border-cyan-200/30 pt-3"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">03</span><p className="mt-2 text-sm font-bold text-white">Explain</p><p className="mt-1 text-[11px] leading-4 text-white/45">See why it matters.</p></div>
            </div>
            <div className="landing-reveal landing-reveal-delay-3 mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => onEnter("vision")} className="group inline-flex h-12 items-center gap-3 rounded-full bg-orange-500 px-6 text-sm font-bold text-white shadow-xl shadow-orange-950/35 hover:bg-orange-400">Start with an image <ArrowRight className="transition-transform group-hover:translate-x-1" size={17} /></button>
              <button type="button" onClick={() => onEnter("text")} className="inline-flex h-12 items-center gap-3 rounded-full border border-white/20 bg-white/[.06] px-6 text-sm font-bold text-white backdrop-blur hover:bg-white/[.12]"><ScanSearch size={16} /> Ask a text query</button>
            </div>
          </div>

          <div className="landing-reveal landing-reveal-delay-2 lg:justify-self-end">
            <div className="max-w-md border-l border-cyan-200/35 pl-6 sm:pl-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200">A visual intelligence field note</p>
              <p className="mt-4 text-2xl font-semibold leading-tight text-white/90 sm:text-3xl">“The map is not the answer. It is the beginning of a better question.”</p>
              <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/15 pt-5"><div><Radar className="mb-3 text-orange-200" size={19} /><p className="text-xs leading-5 text-white/55">Region-level evidence from a single frame.</p></div><div><Orbit className="mb-3 text-cyan-200" size={19} /><p className="text-xs leading-5 text-white/55">Built for explainable Earth observation.</p></div></div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/15 py-5 text-[10px] uppercase tracking-[0.18em] text-white/40 sm:flex-row sm:items-center sm:justify-between"><span>Independent research demo</span><span>Explore a scene · ask a question · inspect the evidence</span></footer>
      </div>
    </main>
  );
}
