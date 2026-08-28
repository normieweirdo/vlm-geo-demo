import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { AlertCircle, ArrowUpRight, Check, Copy, Download, FileImage, GalleryHorizontalEnd, Image as ImageIcon, Link2, Loader2, MapPin, Radar, RefreshCw, Sparkles, TextCursorInput, UploadCloud, X } from "lucide-react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import AnimatedList from "@/components/AnimatedList";
import MoltenMetal from "@/components/MoltenMetal";

type Region = { label: string; bbox: [number, number, number, number] };
export type Result = { imageUrl: string; answer: string; confidence: number; regions?: Region[]; source: string; mode?: string; query?: string };

const prompts = [
  "Identify built-up areas and explain the dominant land-use pattern.",
  "Locate roads, water bodies, and the most visually significant structures.",
  "Summarize the scene for a geospatial analyst in two sentences.",
];

const sampleGallery = [
  { id: "change", title: "Urban edge / optical", description: "A prepared change-detection scene for testing region evidence.", kind: "change" as const },
  { id: "sar", title: "Industrial corridor / SAR", description: "A fused radar-inspired scene with high-return structures.", kind: "sar" as const },
];

const processingMessages = [
  "Reading spatial context…",
  "Locating visual evidence…",
  "Structuring the VLM response…",
];

async function loadDemo(kind: "change" | "sar" | "text"): Promise<Result> {
  const path = kind === "change" ? "/demos/change-detection.json" : kind === "sar" ? "/demos/sar-fusion.json" : "/demos/text-query.json";
  const response = await fetch(path);
  if (!response.ok) throw new Error("Demo payload unavailable. Please retry.");
  return response.json() as Promise<Result>;
}

export function OverlayImage({ result }: { result: Result }) {
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  return <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-2xl">
    <img src={result.imageUrl} alt="Analyzed geospatial image" className="block aspect-[16/10] w-full object-cover" />
    <div className="pointer-events-none absolute inset-0">
      {result.regions?.map((region, index) => {
        const [xMin, yMin, xMax, yMax] = region.bbox;
        const confidenceLabel = `${Math.round(result.confidence * 100)}% confidence`;
        return <button key={`${region.label}-${index}`} type="button" aria-label={`${region.label}, ${confidenceLabel}`} onMouseEnter={() => setHoveredRegion(index)} onMouseLeave={() => setHoveredRegion(null)} onFocus={() => setHoveredRegion(index)} onBlur={() => setHoveredRegion(null)} className="group pointer-events-auto absolute border-2 border-cyan-300 bg-cyan-300/10 text-left shadow-[0_0_0_1px_rgba(255,255,255,.25)] outline-none transition-colors duration-150 hover:bg-cyan-300/20 focus-visible:bg-cyan-300/20 focus-visible:ring-2 focus-visible:ring-white/80" style={{ left: `${xMin * 100}%`, top: `${yMin * 100}%`, width: `${(xMax - xMin) * 100}%`, height: `${(yMax - yMin) * 100}%` }}>
          <span className="absolute -top-7 left-0 whitespace-nowrap rounded-md bg-cyan-300 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950">{region.label}</span>
          <span role="tooltip" className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/15 bg-[#061b24]/95 px-2 py-1 text-[10px] font-bold tracking-[0.08em] text-white shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${hoveredRegion === index ? "opacity-100" : "opacity-0"}`}>{confidenceLabel}</span>
        </button>;
      })}
    </div>
  </div>;
}

export default function Home({ initialMode = "vision", onBack, initialResult }: { initialMode?: "text" | "vision"; onBack?: () => void; initialResult?: Result }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(initialResult?.imageUrl ?? "");
  const [query, setQuery] = useState(prompts[0]);
  const [result, setResult] = useState<Result | null>(initialResult ?? null);
  const [error, setError] = useState("");
  const [processingMessage, setProcessingMessage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasActed, setHasActed] = useState(Boolean(initialResult));
  const [mode, setMode] = useState<"text" | "vision">(initialMode);
  const [gallery, setGallery] = useState<Record<string, Result>>({});
  const [shareLink, setShareLink] = useState("");
  const [shareError, setShareError] = useState("");
  const analyze = trpc.pipeline2.analyze.useMutation();
  const createShare = trpc.share.create.useMutation();

  useEffect(() => {
    if (mode !== "vision") return;
    let active = true;
    Promise.all(sampleGallery.map(async (sample) => [sample.id, await loadDemo(sample.kind)] as const)).then((entries) => {
      if (active) setGallery(Object.fromEntries(entries));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [mode]);

  useEffect(() => {
    if (!analyze.isPending) {
      setProcessingMessage(0);
      return;
    }
    const timer = window.setInterval(() => {
      setProcessingMessage((current) => (current + 1) % processingMessages.length);
    }, 1150);
    return () => window.clearInterval(timer);
  }, [analyze.isPending]);

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const canSubmit = Boolean(query.trim() && !analyze.isPending && (mode === "text" || file));
  const hasSessionState = Boolean(file || preview || result || error || query !== prompts[0]);
  const fileLabel = useMemo(() => file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "No image selected", [file]);

  function acceptFile(next: File | undefined) {
    if (!next) return;
    if (!next.type.startsWith("image/")) { setError("Please choose a JPG, PNG, WEBP, or GIF image."); return; }
    setError(""); setResult(null); setHasActed(true); setFile(next); setPreview(URL.createObjectURL(next));
  }

  function handleDragEnter(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragOver(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLButtonElement>) {
    if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  function clearResults() {
    setFile(null);
    setPreview("");
    setQuery(prompts[0]);
    setResult(null);
    setError("");
    setProcessingMessage(0);
    setIsDragging(false);
    setHasActed(false);
    setShareLink("");
    setShareError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit() {
    if (!canSubmit) return;
    setHasActed(true);
    if (mode === "text") {
      setError("");
      setResult(null);
      try {
        const demo = await loadDemo("text");
        setResult(demo);
        setPreview(demo.imageUrl);
        setFile(null);
        setIsDragging(false);
        if (fileInput.current) fileInput.current.value = "";
      } catch (textError) {
        setError(textError instanceof Error ? textError.message : "Text query unavailable. Please retry.");
      }
      return;
    }
    if (!file) return;
    setError(""); setResult(null); setProcessingMessage(0);
    const reader = new FileReader();
    reader.onload = () => analyze.mutate({ imageData: String(reader.result), fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif", query: query.trim() }, { onSuccess: (data) => setResult({ ...data, source: "Live VLM" }), onError: (err) => setError(err.message || "The analysis timed out. Please retry.") });
    reader.readAsDataURL(file);
  }

  async function runDemo(kind: "change" | "sar") {
    setHasActed(true);
    setError("");
    try { const demo = await loadDemo(kind); setResult({ ...demo, query }); setPreview(demo.imageUrl); setFile(null); setIsDragging(false); if (fileInput.current) fileInput.current.value = ""; }
    catch (demoError) { setError(demoError instanceof Error ? demoError.message : "Demo payload unavailable. Please retry."); }
  }

  async function dataUrlToPngFile(dataUrl: string, name: string) {
    const [meta, raw = ""] = dataUrl.split(",", 2);
    const decoded = meta.includes(";base64") ? atob(raw) : decodeURIComponent(raw);
    const sourceBytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
    const fallback = () => new File([sourceBytes], name, { type: "image/png" });
    if (typeof Image === "undefined" || typeof document === "undefined") return fallback();
    return await new Promise<File>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || 1200;
        canvas.height = image.naturalHeight || 760;
        const context = canvas.getContext("2d");
        if (!context) { resolve(fallback()); return; }
        context.drawImage(image, 0, 0);
        canvas.toBlob((blob) => resolve(new File([blob ?? sourceBytes], name, { type: "image/png" })), "image/png");
      };
      image.onerror = () => resolve(fallback());
      image.src = dataUrl;
    });
  }

  async function selectGallery(id: string) {
    const selected = gallery[id];
    if (!selected) return;
    setMode("vision");
    setHasActed(true);
    setError("");
    setResult(null);
    const sampleFile = await dataUrlToPngFile(selected.imageUrl, `${id}-earth-observation.png`);
    setFile(sampleFile);
    setPreview(selected.imageUrl);
    setIsDragging(false);
    setShareLink("");
    setShareError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function switchMode(next: "text" | "vision") {
    if (next === mode) return;
    setMode(next);
    setHasActed(false);
    setResult(null);
    setPreview("");
    setFile(null);
    setError("");
    setShareLink("");
    setShareError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function downloadPdf() {
    if (!result) return;
    const pdf = new jsPDF();
    pdf.setFillColor(6, 27, 36);
    pdf.rect(0, 0, 210, 297, "F");
    pdf.setTextColor(156, 232, 219);
    pdf.setFontSize(10);
    pdf.text("ISRO / GEOQUERY", 18, 20);
    pdf.setTextColor(245, 251, 248);
    pdf.setFontSize(22);
    pdf.text("Analysis result", 18, 36);
    pdf.setFontSize(11);
    pdf.setTextColor(210, 230, 226);
    const lines = pdf.splitTextToSize(result.answer, 174);
    pdf.text(lines, 18, 58);
    pdf.setTextColor(240, 163, 107);
    pdf.text(`Confidence: ${Math.round(result.confidence * 100)}%`, 18, 82);
    pdf.setTextColor(210, 230, 226);
    pdf.text(`Regions returned: ${result.regions?.length ?? 0}`, 18, 90);
    if (query.trim()) {
      pdf.setTextColor(156, 232, 219);
      pdf.text("Query", 18, 108);
      pdf.setTextColor(210, 230, 226);
      pdf.text(pdf.splitTextToSize(query.trim(), 174), 18, 118);
    }
    pdf.save("geoquery-analysis.pdf");
  }

  async function shareAnalysis() {
    if (!result || createShare.isPending) return;
    setShareError("");
    try {
      const payload = { ...result, query: query.trim() };
      const { token } = await createShare.mutateAsync(payload);
      const url = `${window.location.origin}/share/${token}`;
      setShareLink(url);
      await navigator.clipboard?.writeText(url);
    } catch (shareFailure) {
      setShareError(shareFailure instanceof Error ? shareFailure.message : "Could not create a share link.");
    }
  }

  return <main className="relative min-h-screen overflow-hidden bg-[#061b24] text-white">
    <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_12%_8%,rgba(36,156,155,.28),transparent_34%),radial-gradient(circle_at_92%_16%,rgba(190,82,45,.3),transparent_32%),linear-gradient(135deg,#061b24_0%,#0c3440_48%,#371c20_100%)]" />
    <div className="pointer-events-none fixed inset-0 z-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:56px_56px]" />
    <div className="pointer-events-none fixed inset-0 z-[1] opacity-40 mix-blend-screen blur-[2px]" aria-hidden="true"><MoltenMetal color1="#5227FF" color2="#FF9FFC" color3="#FFFFFF" speed={0.35} scale={4} detail={3} glow={1.6} coreSize={0.1} swirl={1} fold={-0.2} blackPoint={0.05} brightness={1.3} colorMode="molten" grain grainIntensity={0.05} mouseInteraction mouseStrength={0.3} opacity={0.8} /></div>
    <div className="relative z-10 mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-12">
      <header className="flex items-center justify-between border-b border-white/10 pb-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-200"><Radar size={20} /></div><div><p className="text-sm font-bold tracking-[0.22em] text-white">VLM / GEOQUERY</p><p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/55">Research visualization workspace</p></div></div><div className="flex items-center gap-2"><Badge className="border border-orange-200/20 bg-orange-200/10 text-orange-100">LIVE DEMO MODE</Badge>{onBack ? <Button type="button" variant="outline" onClick={onBack} className="border-white/15 bg-white/[.04] text-xs text-white/70 hover:bg-white/[.1]">Back to mission brief</Button> : null}</div></header>
      <section className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">Analysis mode</p><p className="mt-1 text-xs text-white/45">Switch context without leaving the workspace.</p></div><div className="inline-flex rounded-full border border-white/15 bg-black/20 p-1" role="group" aria-label="Analysis mode"><button type="button" aria-pressed={mode === "text"} onClick={() => switchMode("text")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${mode === "text" ? "bg-cyan-200 text-slate-950" : "text-white/60 hover:text-white"}`}><TextCursorInput className="mr-1.5 inline" size={14} />Text Query</button><button type="button" aria-pressed={mode === "vision"} onClick={() => switchMode("vision")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${mode === "vision" ? "bg-orange-500 text-white" : "text-white/60 hover:text-white"}`}><ImageIcon className="mr-1.5 inline" size={14} />Vision Query</button></div></section>
      <section className="grid gap-10 pb-12 pt-14 lg:grid-cols-[.78fr_1.22fr] lg:items-end"><div><p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-orange-200"><Sparkles size={14} /> Image intelligence, made visible</p><h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-0.055em] sm:text-7xl">Ask a map.<br /><span className="text-cyan-200">See the answer.</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-white/65">Upload an image, ask a geospatial question, and inspect the VLM’s answer with confidence and region-level evidence.</p></div><div className="flex gap-3 lg:justify-end"><div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur"><p className="text-2xl font-bold text-cyan-200">02</p><p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Query modes</p></div><div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur"><p className="text-2xl font-bold text-orange-200">0 to 1</p><p className="text-[10px] uppercase tracking-[0.2em] text-white/45">BBox scale</p></div></div></section>
      {mode === "vision" ? <section aria-label="Sample Earth observation imagery" className="mb-6 border-y border-white/10 py-5"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200"><GalleryHorizontalEnd size={14} /> Sample gallery</p><p className="mt-1 text-xs text-white/45">Load a prepared Earth observation scene into Vision Query.</p></div><span className="text-[10px] uppercase tracking-[0.16em] text-white/30">Quick start</span></div><div className="grid gap-4 sm:grid-cols-2">{sampleGallery.map((sample) => { const item = gallery[sample.id]; return <button key={sample.id} type="button" onClick={() => void selectGallery(sample.id)} disabled={!item} className="group flex gap-4 rounded-2xl border border-white/10 bg-black/15 p-3 text-left transition hover:border-cyan-200/40 hover:bg-cyan-200/[.06] disabled:cursor-wait disabled:opacity-55">{item ? <img src={item.imageUrl} alt={sample.title} className="h-20 w-28 shrink-0 rounded-xl object-cover" /> : <div className="grid h-20 w-28 shrink-0 place-items-center rounded-xl bg-white/[.05]"><Loader2 className="animate-spin text-cyan-200" size={18} /></div>}<span className="min-w-0"><span className="block text-sm font-bold text-white">{sample.title}</span><span className="mt-1 block text-xs leading-5 text-white/45">{sample.description}</span></span></button>; })}</div></section> : null}
      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="border-white/10 bg-[#071820]/70 p-5 shadow-2xl backdrop-blur-xl sm:p-7"><div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">01 / Input</p><h2 className="mt-2 text-2xl font-bold">{mode === "text" ? "Ask a question" : "Load an image"}</h2></div><FileImage className="text-orange-200" size={22} /></div>{mode === "vision" ? <><button type="button" aria-label="Image upload drop zone" className={`group relative flex min-h-56 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-cyan-100/25 bg-cyan-100/[.03] p-6 text-center transition hover:border-cyan-200/65 hover:bg-cyan-100/[.07] ${isDragging ? "border-cyan-200/90 bg-cyan-200/[.12] ring-2 ring-cyan-200/30" : ""}`} onClick={() => fileInput.current?.click()} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>{preview ? <img src={preview} alt="Selected preview" className="absolute inset-0 h-full w-full object-cover opacity-55" /> : null}<div className="relative grid place-items-center"><div className={`mb-3 grid h-12 w-12 place-items-center rounded-full bg-cyan-200/10 text-cyan-200 transition ${isDragging ? "scale-110 bg-cyan-200/20" : ""}`}><UploadCloud size={22} /></div><p className="font-semibold">{isDragging ? "Release to load this image" : "Drop an image here"}</p><p className="mt-1 text-sm text-white/45">{isDragging ? "We’ll preview it before submission" : "or click to browse your files"}</p></div></button><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => acceptFile(event.target.files?.[0])} /><p className="mt-3 truncate text-xs text-white/45">{fileLabel}</p></> : <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-cyan-100/15 bg-cyan-100/[.03] p-6 text-center"><div><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-cyan-200/10 text-cyan-200"><TextCursorInput size={22} /></div><p className="font-semibold">Text context ready</p><p className="mt-1 text-sm leading-6 text-white/45">Ask a question about the prepared Earth observation scene, then run the text query.</p></div></div>}<div className="mt-7"><label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/55">Ask the VLM</label><Textarea value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-28 resize-none border-white/10 bg-black/20 text-white placeholder:text-white/30" placeholder="What do you want to know about this image?" />{hasActed ? <div className="mt-4"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Suggested Analysis</p><span className="text-[10px] uppercase tracking-[0.16em] text-white/35">Choose a starting point</span></div><AnimatedList items={prompts} onItemSelect={(item) => setQuery(item)} showGradients enableArrowNavigation displayScrollbar /></div> : <p className="mt-3 text-xs leading-5 text-white/35">{mode === "vision" ? "Upload an image to unlock suggested analysis prompts." : "Run a text query to unlock suggested analysis prompts."}</p>}<Button disabled={!canSubmit} onClick={submit} className="mt-5 h-12 w-full bg-orange-500 font-bold text-white shadow-lg shadow-orange-950/30 hover:bg-orange-400 disabled:opacity-40">{analyze.isPending ? <><Loader2 className="mr-2 animate-spin" size={16} />Analyzing image…</> : <>Run {mode === "text" ? "text" : "vision"} query <ArrowUpRight className="ml-2" size={17} /></>}</Button></div></Card>
        <Card className="border-white/10 bg-[#071820]/70 p-5 shadow-2xl backdrop-blur-xl sm:p-7"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-200">02 / Evidence</p><h2 className="mt-2 text-2xl font-bold">Results workspace</h2></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => runDemo("change")} className="border-orange-200/30 bg-orange-200/[.06] text-xs text-orange-100 hover:bg-orange-200/15">Change Detection Example</Button><Button variant="outline" onClick={() => runDemo("sar")} className="border-cyan-200/30 bg-cyan-200/[.06] text-xs text-cyan-100 hover:bg-cyan-200/15">SAR Fusion Example</Button><Button type="button" variant="outline" onClick={clearResults} disabled={!hasSessionState || analyze.isPending} className="border-white/15 bg-white/[.04] text-xs text-white/70 hover:bg-white/[.1] disabled:opacity-35"><X className="mr-1.5" size={14} />Clear Results</Button></div></div>{analyze.isPending ? <div className="space-y-4"><div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-cyan-200/15 bg-white/[.04]"><div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgba(156,232,219,.04),rgba(156,232,219,.14),rgba(156,232,219,.04))]" /><div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:44px_44px]" /><div className="relative flex h-full flex-col items-center justify-center text-center"><Loader2 className="mb-3 animate-spin text-cyan-200" size={24} /><p className="text-sm font-semibold text-white">{processingMessages[processingMessage]}</p><p className="mt-2 text-xs text-white/40">The model is processing the secure image reference</p></div></div><div className="h-5 w-3/4 animate-pulse rounded bg-white/10" /><div className="h-4 w-1/2 animate-pulse rounded bg-white/10" /></div> : error ? <div className="grid min-h-[390px] place-items-center rounded-2xl border border-red-200/20 bg-red-300/[.05] p-8 text-center"><div><AlertCircle className="mx-auto mb-4 text-orange-200" size={30} /><h3 className="text-lg font-bold">We couldn’t finish that analysis</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/55">{error}</p><Button onClick={submit} variant="outline" className="mt-5 border-white/15 bg-white/5 text-white"><RefreshCw className="mr-2" size={15} />Retry analysis</Button></div></div> : result ? <div className="space-y-5"><OverlayImage result={result} /><div className="flex flex-wrap items-center gap-3"><Badge className="border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">{result.mode || (result.source.includes("6") ? "Prepared example" : result.source)}</Badge><Badge className="border border-orange-200/20 bg-orange-200/10 text-orange-100"><Check className="mr-1" size={13} />{Math.round(result.confidence * 100)}% confidence</Badge><span className="text-xs text-white/40">{result.regions?.length ?? 0} regions returned</span></div><div className="rounded-2xl border border-white/10 bg-black/20 p-5"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Model answer</p><div className="prose prose-invert prose-sm max-w-none text-white/80"><Streamdown>{result.answer}</Streamdown></div></div><div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4"><Button type="button" variant="outline" onClick={downloadPdf} className="border-white/15 bg-white/[.04] text-xs text-white/75 hover:bg-white/[.1]"><Download className="mr-1.5" size={14} />Download PDF</Button><Button type="button" variant="outline" onClick={shareAnalysis} disabled={createShare.isPending} className="border-cyan-200/25 bg-cyan-200/[.04] text-xs text-cyan-100 hover:bg-cyan-200/[.1]"><Link2 className="mr-1.5" size={14} />{createShare.isPending ? "Creating link…" : "Share analysis"}</Button></div>{shareLink ? <div className="flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-200/[.06] p-3 text-xs text-cyan-100"><Copy size={14} /><span className="min-w-0 flex-1 truncate">{shareLink}</span><button type="button" onClick={() => navigator.clipboard?.writeText(shareLink)} className="shrink-0 text-white/70 hover:text-white">Copy</button></div> : null}{shareError ? <p className="text-xs text-orange-200">{shareError}</p> : null}</div> : <div className="grid min-h-[390px] place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(36,156,155,.08),rgba(190,82,45,.08))] p-8 text-center"><div><MapPin className="mx-auto mb-4 text-cyan-200/70" size={32} /><h3 className="text-lg font-bold">Your evidence will appear here</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45">Upload an image or run a query to see the evidence workspace come alive.</p></div></div>}{hasActed ? <div className="mt-5 rounded-2xl border border-cyan-200/20 bg-cyan-200/[.05] p-4 shadow-lg shadow-cyan-950/10"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Evidence legend</p><p className="mt-1 text-xs text-white/45">Read region evidence at a glance.</p></div><span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Hover to inspect</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="flex items-center gap-3"><span className="h-3 w-3 shrink-0 rounded-sm border-2 border-cyan-300 bg-cyan-300/15" /><div><p className="text-xs font-semibold text-white">Region label</p><p className="text-[11px] text-white/45">Names the detected area.</p></div></div><div className="flex items-center gap-3"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-orange-200/30 bg-orange-200/10 text-[10px] font-bold text-orange-100">%</span><div><p className="text-xs font-semibold text-white">Confidence score</p><p className="text-[11px] text-white/45">Hover a box to reveal it.</p></div></div></div></div> : null}</Card>
      </section>
      <footer className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between"><span>Normalized region coordinates are scaled against the displayed image instead of raw pixels.</span><span className="text-cyan-200/60">Built for a reliable live walkthrough.</span></footer>
    </div>
  </main>;
}
