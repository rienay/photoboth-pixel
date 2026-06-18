import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import yodhaLogo from "@/assets/yodha-logo.png";
import ruangguruLogo from "@/assets/ruangguru.png";
import gachaAsset from "@/assets/GACHA MACHINE.png";
import flowerAsset from "@/assets/FLOWER.png";
import templateFrameAsset from "@/assets/frame-benar.png";
import frame2Asset from "@/assets/frame2.png";
import frame3x1Asset1 from "@/assets/farme-3x1.png";
import frame3x1Asset2 from "@/assets/farme2-3x1.png";
import frame3x1Asset3 from "@/assets/1.png";
import frame3x1Asset4 from "@/assets/2.png";
import frame3x1Asset5 from "@/assets/3.png";
import frame3x2Asset2 from "@/assets/frame/2.png";
import frame3x2Asset3 from "@/assets/frame/3.png";
import frame3x2Asset4 from "@/assets/frame/4.png";
import frame3x2Asset5 from "@/assets/frame/5.png";
import frame3x2Asset6 from "@/assets/frame/6.png";
import frame3x2Asset7 from "@/assets/frame/7.png";
import frame3x2Asset8 from "@/assets/frame/8.png";
import frame3x2Asset9 from "@/assets/frame/9.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yodha-Photobooth" },
      { name: "description", content: "Photobooth web bergaya retro 8-bit pastel. Pilih bingkai lucu, jepret tiga foto, dan dapatkan strip foto piksel siap dibagikan." },
      { property: "og:title", content: "Yodha-Photobooth" },
      { property: "og:description", content: "Photobooth pixel-art pastel: pilih frame, jepret, simpan strip foto lucu." },
    ],
  }),
  component: Photobooth,
});

type Screen = "home" | "frame" | "shoot" | "result";
type FrameId = "cafe" | "gameboy" | "bedroom" | "ruangguru" | "template";
type LayoutId = "3x1" | "3x2" | "2x1" | "1x1";

const FRAMES: { id: FrameId; name: string; emoji: string; bg: string; subtitle: string }[] = [
  { id: "template", name: "PHOTOBOOTH RESMI", emoji: "🎓", bg: "#0D3B59", subtitle: "Frame Ruangguru Official" },
  { id: "ruangguru", name: "RUANG GURU", emoji: "🏫", bg: "#D5ECF8", subtitle: "Tema Pixel Belajar" },
  { id: "cafe", name: "Cozy Cafe", emoji: "☕", bg: "var(--color-blush)", subtitle: "Sudut kafe pixel" },
  { id: "gameboy", name: "GameBoy", emoji: "🎮", bg: "var(--color-sage)", subtitle: "Layar konsol mini" },
  { id: "bedroom", name: "Retro Room", emoji: "🛏️", bg: "var(--color-powder)", subtitle: "Kamar tidur cozy" },
];

const LAYOUTS: { id: LayoutId; name: string; rows: number; cols: number; totalPhotos: number; desc: string; emoji: string }[] = [
  { id: "3x1", name: "3x1 Strip", rows: 3, cols: 1, totalPhotos: 3, desc: "Bentuk strip vertikal klasik (3 foto)", emoji: "🎞️" },
  { id: "3x2", name: "3x2 Grid", rows: 3, cols: 2, totalPhotos: 6, desc: "Format grid dua kolom (6 foto)", emoji: "🖼️" },
  { id: "2x1", name: "2x1 Strip", rows: 2, cols: 1, totalPhotos: 2, desc: "Format strip vertikal pendek (2 foto)", emoji: "📸" },
  { id: "1x1", name: "1x1 Photo", rows: 1, cols: 1, totalPhotos: 1, desc: "Foto polaroid kotak tunggal (1 foto)", emoji: "📷" },
];

function Photobooth() {
  const [screen, setScreen] = useState<Screen>("home");
  const [layout, setLayout] = useState<LayoutId>("3x1");
  const [variant, setVariant] = useState<string>("default");
  
  // Frame is automatically derived from layout: 1x1 uses the official twibbon, others use ruangguru strip
  const frame: FrameId = layout === "1x1" ? "template" : "ruangguru";
  const [photos, setPhotos] = useState<string[]>([]);
  const [strip, setStrip] = useState<string | null>(null);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 sm:px-8 py-6 sm:py-10">
      <Header />
      <div className="w-full max-w-4xl flex-1 flex items-center justify-center py-4 sm:py-8">
        {screen === "home" && <HomeScreen onStart={() => setScreen("frame")} />}
        {screen === "frame" && (
          <FrameScreen
            selectedLayout={layout}
            setSelectedLayout={setLayout}
            variant={variant}
            setVariant={setVariant}
            onBack={() => setScreen("home")}
            onNext={() => { setPhotos([]); setStrip(null); setScreen("shoot"); }}
          />
        )}
        {screen === "shoot" && (
          <ShootScreen
            frame={frame}
            layout={layout}
            variant={variant}
            photos={photos}
            setPhotos={setPhotos}
            onDone={(stripDataUrl) => { setStrip(stripDataUrl); setScreen("result"); }}
            onBack={() => setScreen("frame")}
          />
        )}
        {screen === "result" && strip && (
          <ResultScreen
            photos={photos}
            frame={frame}
            layout={layout}
            variant={variant}
            strip={strip}
            setStrip={setStrip}
            onRetake={() => { setPhotos([]); setStrip(null); setScreen("shoot"); }}
            onHome={() => setScreen("home")}
          />
        )}
      </div>
      <Footer />
    </main>
  );
}

/* ───────────────────────── Header / Footer ───────────────────────── */

function Header() {
  return (
    <header className="w-full max-w-5xl flex items-center justify-between gap-4 mb-2">
      <div className="flex items-center gap-3">
        <PixelLogo />
        <div>
          <h1 className="text-sm sm:text-base">Yodha-Photobooth</h1>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem" }}>
            ♡ photobooth lucu ♡
          </p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 pixel-box px-3 py-2 text-xs">
        <span className="inline-block w-3 h-3 bg-destructive heart-blink" style={{ clipPath: "polygon(20% 0,40% 0,50% 20%,60% 0,80% 0,100% 30%,100% 50%,50% 100%,0 50%,0 30%)" }} />
        <span className="pixel">INSERT COIN</span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-6 text-xs pixel text-muted-foreground">
      © 19XX · PRESS START
    </footer>
  );
}

function PixelLogo() {
  return (
    <div className="relative">
      <div className="w-12 h-12 grid grid-cols-6 grid-rows-6 gap-0">
        {/* simple camera pixel sprite */}
        {[
          "......",
          ".XXXX.",
          "XYYYYX",
          "XYZZYX",
          "XYYYYX",
          ".XXXX.",
        ].join("").split("").map((c, i) => {
          const color = c === "X" ? "var(--color-ink)" : c === "Y" ? "var(--color-butter)" : c === "Z" ? "var(--color-blush)" : "transparent";
          return <div key={i} style={{ background: color }} />;
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Home ───────────────────────── */

function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-row items-center justify-between w-full h-full min-h-[60vh] gap-4">
      {/* Left Decoration */}
      <div className="hidden sm:flex flex-1 flex-col items-center justify-center gap-8 opacity-90">
        <div className="scale-75 origin-center">
          <ArcadeMockup />
        </div>
        <img src={flowerAsset} alt="flower" className="w-24 lg:w-32 object-contain" style={{ imageRendering: "pixelated" }} />
      </div>

      {/* Center content (Start Button) */}
      <div className="flex-shrink-0 z-10 mx-2 sm:mx-8">
        <button
          id="start-btn"
          className="pixel-btn hover:scale-105 transition-transform"
          onClick={onStart}
          style={{
            fontSize: "clamp(1.2rem, 3.5vw, 2rem)",
            padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(2.5rem, 6vw, 5rem)",
            letterSpacing: "0.15em",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.15), inset -4px -4px 0 0 rgba(0,0,0,0.1)",
          }}
        >
          ▶ START PHOTO
        </button>
      </div>

      {/* Right Decoration */}
      <div className="hidden sm:flex flex-1 flex-col items-center justify-center gap-8 opacity-90">
        <img src={gachaAsset} alt="gacha" className="w-28 lg:w-40 object-contain" style={{ imageRendering: "pixelated" }} />
        <div className="scale-75 origin-center">
          <ArcadeMockup />
        </div>
      </div>
    </div>
  );
}

function ArcadeMockup() {
  return (
    <div className="pixel-box p-6" style={{ background: "var(--color-lavender)" }}>
      <div className="pixel text-[10px] text-center mb-3">★ YODHA-PHOTOBOOTH ARCADE ★</div>
      <div className="aspect-square w-full pixel-box flex items-center justify-center" style={{ background: "var(--color-card)" }}>
        <div className="text-center">
          <div className="text-6xl">📷</div>
          <div className="pixel text-[10px] mt-3">SAY CHEESE!</div>
          <div className="mt-3 flex justify-center gap-1">
            {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 bg-destructive heart-blink" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4">
        <div className="h-6" style={{ background: "var(--color-butter)", border: "3px solid var(--color-ink)" }} />
        <div className="h-6" style={{ background: "var(--color-sage)", border: "3px solid var(--color-ink)" }} />
        <div className="h-6" style={{ background: "var(--color-powder)", border: "3px solid var(--color-ink)" }} />
        <div className="h-6" style={{ background: "var(--color-blush)", border: "3px solid var(--color-ink)" }} />
      </div>
    </div>
  );
}

type HoleConfig = { w: number; h: number; holes: { left: number; top: number; width: number; height: number }[] };

function getVariantHoleConfig(layout: string, variant: string): HoleConfig | null {
  if (layout === "3x1" && variant !== "default") {
    if (variant === "frame1") {
      const baseW = 600, baseH = 1800;
      const h = [{ x: 78, y: 478, w: 440, h: 275 }, { x: 78, y: 863, w: 440, h: 275 }, { x: 78, y: 1248, w: 440, h: 275 }];
      return { w: baseW, h: baseH, holes: h.map(v => ({ left: v.x/baseW*100, top: v.y/baseH*100, width: v.w/baseW*100, height: v.h/baseH*100 })) };
    } else if (variant === "frame2") {
      const baseW = 724, baseH = 2172;
      const h = [{ x: 49, y: 68, w: 632, h: 530 }, { x: 56, y: 670, w: 627, h: 536 }, { x: 52, y: 1265, w: 625, h: 542 }];
      return { w: baseW, h: baseH, holes: h.map(v => ({ left: v.x/baseW*100, top: v.y/baseH*100, width: v.w/baseW*100, height: v.h/baseH*100 })) };
    } else if (variant === "frame3") {
      const baseW = 724, baseH = 2172;
      const h = [{ x: 63, y: 157, w: 594, h: 414 }, { x: 63, y: 746, w: 594, h: 413 }, { x: 63, y: 1334, w: 594, h: 414 }];
      return { w: baseW, h: baseH, holes: h.map(v => ({ left: v.x/baseW*100, top: v.y/baseH*100, width: v.w/baseW*100, height: v.h/baseH*100 })) };
    } else if (variant === "frame4") {
      const baseW = 724, baseH = 2172;
      const h = [{ x: 56, y: 192, w: 612, h: 541 }, { x: 56, y: 790, w: 612, h: 541 }, { x: 56, y: 1388, w: 612, h: 541 }];
      return { w: baseW, h: baseH, holes: h.map(v => ({ left: v.x/baseW*100, top: v.y/baseH*100, width: v.w/baseW*100, height: v.h/baseH*100 })) };
    } else if (variant === "frame5") {
      const baseW = 724, baseH = 2172;
      const h = [{ x: 89, y: 82, w: 546, h: 545 }, { x: 89, y: 747, w: 546, h: 546 }, { x: 89, y: 1412, w: 546, h: 545 }];
      return { w: baseW, h: baseH, holes: h.map(v => ({ left: v.x/baseW*100, top: v.y/baseH*100, width: v.w/baseW*100, height: v.h/baseH*100 })) };
    }
  } else if (layout === "3x2") {
    const baseW = 1333, baseH = 2000;
    const convert = (hArr: {x:number,y:number,w:number,h:number}[], customH = baseH) => 
      ({ w: baseW, h: customH, holes: hArr.map(v => ({ left: v.x/baseW*100, top: v.y/customH*100, width: v.w/baseW*100, height: v.h/customH*100 })) });
    
    if (variant === "default") {
      return convert([
        { x: 125, y: 552, w: 419, h: 316 }, { x: 781, y: 560, w: 420, h: 316 },
        { x: 125, y: 1019, w: 419, h: 316 }, { x: 781, y: 1028, w: 420, h: 315 },
        { x: 125, y: 1487, w: 419, h: 316 }, { x: 781, y: 1495, w: 420, h: 316 }
      ], 1999);
    } else if (variant === "frame2") {
      return convert([{ x: 31, y: 64, w: 605, h: 546 }, { x: 698, y: 65, w: 606, h: 546 }, { x: 31, y: 641, w: 605, h: 554 }, { x: 698, y: 642, w: 606, h: 553 }, { x: 31, y: 1226, w: 605, h: 573 }, { x: 697, y: 1226, w: 607, h: 573 }]);
    } else if (variant === "frame3") {
      return convert([{ x: 78, y: 60, w: 545, h: 520 }, { x: 707, y: 60, w: 546, h: 520 }, { x: 78, y: 660, w: 545, h: 520 }, { x: 707, y: 660, w: 546, h: 520 }, { x: 78, y: 1259, w: 546, h: 520 }, { x: 707, y: 1259, w: 546, h: 520 }]);
    } else if (variant === "frame4") {
      return convert([{ x: 49, y: 79, w: 569, h: 481 }, { x: 707, y: 139, w: 592, h: 396 }, { x: 49, y: 674, w: 569, h: 481 }, { x: 715, y: 640, w: 572, h: 439 }, { x: 49, y: 1269, w: 569, h: 480 }, { x: 720, y: 1166, w: 544, h: 456 }]);
    } else if (variant === "frame5") {
      return convert([{ x: 89, y: 168, w: 483, h: 399 }, { x: 755, y: 168, w: 484, h: 399 }, { x: 112, y: 726, w: 451, h: 384 }, { x: 779, y: 726, w: 450, h: 384 }, { x: 103, y: 1267, w: 446, h: 401 }, { x: 770, y: 1267, w: 446, h: 401 }]);
    } else if (variant === "frame6") {
      return convert([{ x: 35, y: 126, w: 597, h: 422 }, { x: 701, y: 126, w: 598, h: 422 }, { x: 39, y: 629, w: 588, h: 451 }, { x: 706, y: 629, w: 588, h: 451 }, { x: 53, y: 1159, w: 559, h: 475 }, { x: 720, y: 1159, w: 559, h: 475 }]);
    } else if (variant === "frame7") {
      return convert([{ x: 31, y: 57, w: 599, h: 523 }, { x: 703, y: 57, w: 599, h: 523 }, { x: 28, y: 631, w: 602, h: 522 }, { x: 703, y: 631, w: 602, h: 522 }, { x: 29, y: 1206, w: 600, h: 520 }, { x: 704, y: 1206, w: 601, h: 520 }]);
    } else if (variant === "frame8") {
      return convert([{ x: 108, y: 82, w: 511, h: 512 }, { x: 715, y: 82, w: 510, h: 512 }, { x: 108, y: 676, w: 511, h: 512 }, { x: 714, y: 676, w: 511, h: 512 }, { x: 107, y: 1270, w: 513, h: 513 }, { x: 714, y: 1270, w: 512, h: 514 }]);
    } else if (variant === "frame9") {
      return convert([{ x: 53, y: 53, w: 561, h: 560 }, { x: 720, y: 53, w: 560, h: 560 }, { x: 53, y: 660, w: 561, h: 560 }, { x: 720, y: 660, w: 560, h: 560 }, { x: 53, y: 1267, w: 561, h: 560 }, { x: 720, y: 1267, w: 560, h: 560 }]);
    }
  }
  return null;
}

/* ───────────────────────── Frame select ───────────────────────── */

function FrameScreen({
  selectedLayout, setSelectedLayout, variant, setVariant, onBack, onNext,
}: {
  selectedLayout: LayoutId;
  setSelectedLayout: (l: LayoutId) => void;
  variant: string;
  setVariant: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="w-full space-y-8">
      <div>
        <div className="speech inline-block mb-4">
          <p className="pixel text-xs">PILIH LAYOUT STRIP!</p>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          {LAYOUTS.map((l) => {
            const active = selectedLayout === l.id;
            return (
              <button
                key={l.id}
                onClick={() => { setSelectedLayout(l.id); setVariant("default"); }}
                className="pixel-box p-4 flex flex-col items-center justify-between text-center transition-transform w-full min-h-[200px]"
                style={{
                  background: active ? "var(--color-butter)" : "var(--color-card)",
                  transform: active ? "translate(-2px,-2px)" : undefined,
                  boxShadow: active
                    ? "0 4px 0 0 var(--color-ink),0 -4px 0 0 var(--color-ink),4px 0 0 0 var(--color-ink),-4px 0 0 0 var(--color-ink),6px 6px 0 0 var(--color-ink)"
                    : undefined,
                }}
              >
                {/* Retro pastel paper mockup representing the layout */}
                <LayoutPreview layout={l.id} />

                <div className="w-full mt-1">
                  <div className="flex justify-center items-center gap-1.5 mb-1">
                    <span className="text-base leading-none">{l.emoji}</span>
                    <span className="pixel text-[11px] font-bold leading-none">{l.name}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-normal" style={{ fontFamily: "var(--font-body)" }}>
                    {l.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedLayout === "3x1" && (
        <div className="pixel-box p-4" style={{ background: "var(--color-lavender)" }}>
          <div className="pixel text-[10px] text-center mb-3">PILIH VARIAN FRAME 3x1</div>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              className={`flex flex-col items-center gap-2 transition-all ${variant === "default" ? "scale-110 drop-shadow-lg ring-2 ring-[var(--color-ink)]" : "opacity-70 hover:opacity-100"}`}
              onClick={() => setVariant("default")}
            >
              <div className="w-12 h-36 bg-white border-[3px] border-[var(--color-ink)] flex flex-col justify-around p-1 gap-1">
                <div className="w-full h-full bg-[var(--color-ink)] opacity-10"></div>
                <div className="w-full h-full bg-[var(--color-ink)] opacity-10"></div>
                <div className="w-full h-full bg-[var(--color-ink)] opacity-10"></div>
              </div>
            </button>
            <button 
              className={`flex flex-col items-center gap-2 transition-all ${variant === "frame1" ? "scale-110 drop-shadow-lg ring-2 ring-[var(--color-ink)]" : "opacity-70 hover:opacity-100"}`}
              onClick={() => setVariant("frame1")}
            >
              <img src={frame3x1Asset1} className="w-12 h-36 object-cover bg-white border-[3px] border-[var(--color-ink)]" alt="Pink" />
            </button>
            <button 
              className={`flex flex-col items-center gap-2 transition-all ${variant === "frame2" ? "scale-110 drop-shadow-lg ring-2 ring-[var(--color-ink)]" : "opacity-70 hover:opacity-100"}`}
              onClick={() => setVariant("frame2")}
            >
              <img src={frame3x1Asset2} className="w-12 h-36 object-cover bg-white border-[3px] border-[var(--color-ink)]" alt="Blue" />
            </button>
            <button 
              className={`flex flex-col items-center gap-2 transition-all ${variant === "frame3" ? "scale-110 drop-shadow-lg ring-2 ring-[var(--color-ink)]" : "opacity-70 hover:opacity-100"}`}
              onClick={() => setVariant("frame3")}
            >
              <img src={frame3x1Asset3} className="w-12 h-36 object-cover bg-white border-[3px] border-[var(--color-ink)]" alt="Frame 1" />
            </button>
            <button 
              className={`flex flex-col items-center gap-2 transition-all ${variant === "frame4" ? "scale-110 drop-shadow-lg ring-2 ring-[var(--color-ink)]" : "opacity-70 hover:opacity-100"}`}
              onClick={() => setVariant("frame4")}
            >
              <img src={frame3x1Asset4} className="w-12 h-36 object-cover bg-white border-[3px] border-[var(--color-ink)]" alt="Frame 2" />
            </button>
            <button 
              className={`flex flex-col items-center gap-2 transition-all ${variant === "frame5" ? "scale-110 drop-shadow-lg ring-2 ring-[var(--color-ink)]" : "opacity-70 hover:opacity-100"}`}
              onClick={() => setVariant("frame5")}
            >
              <img src={frame3x1Asset5} className="w-12 h-36 object-cover bg-white border-[3px] border-[var(--color-ink)]" alt="Frame 3" />
            </button>
          </div>
        </div>
      )}

      {selectedLayout === "3x2" && (
        <div className="pixel-box p-4" style={{ background: "var(--color-lavender)" }}>
          <div className="pixel text-[10px] text-center mb-3">PILIH VARIAN FRAME 3x2</div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { id: "default", img: frame2Asset },
              { id: "frame2", img: frame3x2Asset2 },
              { id: "frame3", img: frame3x2Asset3 },
              { id: "frame4", img: frame3x2Asset4 },
              { id: "frame5", img: frame3x2Asset5 },
              { id: "frame6", img: frame3x2Asset6 },
              { id: "frame7", img: frame3x2Asset7 },
              { id: "frame8", img: frame3x2Asset8 },
              { id: "frame9", img: frame3x2Asset9 }
            ].map((v) => (
              <button 
                key={v.id}
                className={`flex flex-col items-center gap-2 transition-all ${variant === v.id ? "scale-110 drop-shadow-lg ring-2 ring-[var(--color-ink)]" : "opacity-70 hover:opacity-100"}`}
                onClick={() => setVariant(v.id)}
              >
                <img src={v.img} className="w-16 h-24 object-cover bg-white border-[3px] border-[var(--color-ink)]" alt={v.id} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button className="pixel-btn-powder" onClick={onBack}>◀ Back</button>
        <button className="pixel-btn-sage" onClick={onNext}>Continue ▶</button>
      </div>
    </div>
  );
}

function FramePreview({ id, layout }: { id: FrameId; layout: LayoutId }) {
  const layoutConfig = LAYOUTS.find((l) => l.id === layout) || LAYOUTS[0];
  const { cols, rows, totalPhotos } = layoutConfig;

  // Constrain width for single-column layouts to prevent vertical overflow of the aspect-ratio based slots
  const slotWidthClass =
    layout === "3x1" ? "w-[40%] mx-auto" :
      layout === "2x1" ? "w-[50%] mx-auto" :
        layout === "1x1" ? "w-[65%] mx-auto" :
          "w-full";

  return (
    <div className="w-full h-full p-3 flex flex-col justify-between relative select-none">
      {/* Mini Title */}
      <div className="text-center">
        {id === "template" && <span className="pixel text-[9px] text-[#F89E1B] font-bold">🎓 RESMI</span>}
        {id === "ruangguru" && <span className="pixel text-[9px] text-[#22385C] font-bold">★ RUANG GURU</span>}
        {id === "cafe" && <span className="pixel text-[9px] text-[#3A2A40] font-bold">☕ CAFE</span>}
        {id === "gameboy" && <span className="pixel text-[9px] text-[#3A2A40] font-bold">▶ GAMEBOY</span>}
        {id === "bedroom" && <span className="pixel text-[9px] text-[#3A2A40] font-bold">♡ ROOM</span>}
      </div>

      {/* Mini Photo Slots Grid */}
      <div className={`grid gap-1 flex-1 items-center justify-center py-2 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {[...Array(totalPhotos)].map((_, i) => (
          <div
            key={i}
            className={`aspect-[4/3] ${slotWidthClass} border-2 border-[#3A2A40] bg-[#FFFFFF] relative flex items-center justify-center`}
          >
            <span className="text-[10px] opacity-25">📷</span>
            {/* Studs in corners */}
            <span className="absolute w-0.5 h-0.5 bg-[#3A2A40] top-0 left-0" />
            <span className="absolute w-0.5 h-0.5 bg-[#3A2A40] top-0 right-0" />
            <span className="absolute w-0.5 h-0.5 bg-[#3A2A40] bottom-0 left-0" />
            <span className="absolute w-0.5 h-0.5 bg-[#3A2A40] bottom-0 right-0" />
          </div>
        ))}
      </div>

      {/* Mini Decor / Buttons at the bottom */}
      <div className="h-6 flex items-center justify-center relative">
        {id === "cafe" && (
          <div className="flex gap-2 text-sm items-center opacity-75">
            <span>🍩</span>
            <span className="pixel text-[7px] text-[#3A2A40] font-bold">COZY</span>
            <span>☕</span>
          </div>
        )}
        {id === "gameboy" && (
          <div className="w-full flex justify-between items-center px-1">
            {/* D-Pad cross */}
            <div className="relative w-3 h-3 flex items-center justify-center">
              <div className="absolute w-3 h-0.5 bg-[#3A2A40]" />
              <div className="absolute w-0.5 h-3 bg-[#3A2A40]" />
            </div>
            {/* Select/Start buttons */}
            <div className="flex gap-0.5">
              <div className="w-1.5 h-0.5 bg-[#3A2A40] rotate-[-28deg]" />
              <div className="w-1.5 h-0.5 bg-[#3A2A40] rotate-[-28deg]" />
            </div>
            {/* A/B buttons */}
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E63946] border border-[#3A2A40]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#E63946] border border-[#3A2A40]" />
            </div>
          </div>
        )}
        {id === "bedroom" && (
          <div className="flex gap-2 text-sm items-center opacity-75">
            <span>🐱</span>
            <span className="pixel text-[7px] text-[#3A2A40] font-bold">SWEET</span>
            <span>🛏️</span>
          </div>
        )}
        {id === "ruangguru" && (
          <div className="flex gap-2 text-sm items-center opacity-75">
            <span>🎒</span>
            <span className="pixel text-[7px] text-[#22385C] font-bold">LEARN</span>
            <span>🎓</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutPreview({ layout }: { layout: LayoutId }) {
  const layoutConfig = LAYOUTS.find((l) => l.id === layout) || LAYOUTS[0];
  const { cols, rows, totalPhotos } = layoutConfig;

  return (
    <div className="w-full flex justify-center mb-2">
      {/* Paper strip wrapper */}
      <div
        className="border-2 border-[#3A2A40] bg-white p-1.5 flex flex-col justify-between"
        style={{
          width: cols === 2 ? "72px" : "48px",
          height: "85px",
          boxShadow: "2px 2px 0 0 rgba(58, 42, 64, 0.15)",
        }}
      >
        {/* Tiny top border/header */}
        <div className="w-full h-0.5 bg-[#3A2A40]/10 mb-1" />

        {/* Mini slots grid */}
        <div className={`grid gap-1 flex-1 items-center justify-center ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {[...Array(totalPhotos)].map((_, i) => (
            <div key={i} className="aspect-[4/3] w-full border border-[#3A2A40] bg-[#F1E9E3] relative">
              {/* corner studs */}
              <span className="absolute w-[1px] h-[1px] bg-[#3A2A40] top-0 left-0" />
              <span className="absolute w-[1px] h-[1px] bg-[#3A2A40] top-0 right-0" />
              <span className="absolute w-[1px] h-[1px] bg-[#3A2A40] bottom-0 left-0" />
              <span className="absolute w-[1px] h-[1px] bg-[#3A2A40] bottom-0 right-0" />
            </div>
          ))}
        </div>

        {/* Tiny footer lines for text */}
        <div className="mt-1 flex flex-col gap-0.5 items-center justify-center opacity-30">
          <div className="w-4/5 h-[1px] bg-[#3A2A40]" />
          <div className="w-3/5 h-[1px] bg-[#3A2A40]" />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Shoot ───────────────────────── */

function ShootScreen({
  frame, layout, variant, photos, setPhotos, onDone, onBack,
}: {
  frame: FrameId;
  layout: LayoutId;
  variant: string;
  photos: string[];
  setPhotos: (p: string[]) => void;
  onDone: (strip: string) => void;
  onBack: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layoutConfig = LAYOUTS.find((l) => l.id === layout) || LAYOUTS[0];
  const total = layoutConfig.totalPhotos;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => { });
        }
      } catch (e) {
        setError("Tidak bisa mengakses kamera. Izinkan akses kamera di browser ya!");
      }
    }
    init();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const takeShot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 960;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // mirror like a selfie
    ctx.translate(w, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.95);
  }, []);

  const runSequence = useCallback(async () => {
    if (shooting) return;
    setShooting(true);
    const captured: string[] = [];
    for (let i = 0; i < total; i++) {
      for (let n = 3; n >= 1; n--) {
        setCountdown(n);
        // eslint-disable-next-line no-await-in-loop
        await wait(700);
      }
      setCountdown(null);
      setFlashing(true);
      const shot = takeShot();
      if (shot) captured.push(shot);
      setPhotos([...captured]);
      // eslint-disable-next-line no-await-in-loop
      await wait(450);
      setFlashing(false);
      // eslint-disable-next-line no-await-in-loop
      await wait(400);
    }
    setShooting(false);
    setProcessing(true);
    await wait(1900);
    let strip: string;
    if (frame === "template") {
      strip = await composeTemplateFrame(captured);
    } else if (layout === "3x2") {
      strip = await compose3x2Frame(captured, variant);
    } else if (layout === "3x1" && variant !== "default") {
      strip = await compose3x1Variant(captured, variant);
    } else {
      strip = await composeStrip(captured, frame, layout);
    }
    setProcessing(false);
    onDone(strip);
  }, [shooting, takeShot, setPhotos, frame, layout, onDone, total]);

  return (
    <div className="w-full grid lg:grid-cols-[1fr_auto] gap-6 items-start">
      <div className="space-y-4">
        <div className="speech inline-block">
          <p className="pixel text-xs">
            {error ? "OOPS!" : processing ? "PROCESSING..." : countdown ? `READY... ${countdown}` : shooting ? "SMILE!" : `${photos.length}/${total} · CLICK SNAP!`}
          </p>
        </div>

        <div className="relative pixel-box p-3" style={{ background: "var(--color-lavender)" }}>
          {/* Corner notches */}
          <Corner pos="tl" /> <Corner pos="tr" /> <Corner pos="bl" /> <Corner pos="br" />

          {/* Live indicator */}
          <div className="absolute top-5 left-5 z-10 flex items-center gap-2 px-2 py-1" style={{ background: "var(--color-card)", border: "3px solid var(--color-ink)" }}>
            <span className="w-3 h-3 bg-destructive heart-blink" style={{ clipPath: "polygon(20% 0,40% 0,50% 20%,60% 0,80% 0,100% 30%,100% 50%,50% 100%,0 50%,0 30%)" }} />
            <span className="pixel text-[9px]">LIVE</span>
          </div>

          <div className={`relative w-full overflow-hidden ${frame === "template" ? "aspect-[1402/1122]" : "aspect-[4/3]"}`} style={{ background: "var(--color-ink)" }}>
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm" style={{ background: "var(--color-card)" }}>
                <div>
                  <div className="text-4xl mb-3">📵</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem" }}>{error}</p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            )}

            {/* frame overlay */}
            {frame === "template" && (
              <img 
                src={templateFrameAsset} 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10" 
                alt="frame overlay" 
              />
            )}

            {/* countdown */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pixel-box px-8 py-6" style={{ background: "var(--color-card)" }}>
                  <div className="pixel text-5xl">{countdown}</div>
                </div>
              </div>
            )}

            {/* flash */}
            {flashing && <div className="absolute inset-0 bg-white flash pointer-events-none" />}

            {/* sparkles on flash */}
            {flashing && (
              <>
                {[...Array(10)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute sparkle pixel"
                    style={{
                      top: `${10 + Math.random() * 80}%`,
                      left: `${10 + Math.random() * 80}%`,
                      color: i % 2 ? "var(--color-butter)" : "white",
                      fontSize: "12px",
                      animationDelay: `${Math.random() * 200}ms`,
                    }}
                  >✦</span>
                ))}
              </>
            )}
          </div>

          {processing && (
            <div className="mt-4">
              <div className="pixel text-[10px] mb-2 flex items-center gap-2">
                <span className="walk inline-block">🐰</span> LOADING...
              </div>
              <div className="w-full h-5 border-4" style={{ borderColor: "var(--color-ink)", background: "var(--color-card)" }}>
                <div className="h-full loading-bar" style={{ background: "var(--color-sage)" }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="pixel-btn-powder" onClick={onBack} disabled={shooting || processing}>◀ Back</button>
          <button className="pixel-btn-blush" onClick={runSequence} disabled={shooting || processing || !!error}>
            ✦ SNAP! ✦
          </button>
        </div>
      </div>

      {/* Preview strip */}
      <aside className={`pixel-box p-4 w-full ${layoutConfig.cols === 2 ? "lg:w-80" : "lg:w-56"}`} style={{ background: "var(--color-card)" }}>
        <div className="pixel text-[10px] text-center mb-3">PREVIEW</div>
        <div className="relative">
          {(() => {
            const variantConfig = getVariantHoleConfig(layout, variant);
            
            if (variantConfig) {
              const overlaySrc = 
                layout === "3x2" ? (
                  variant === "frame2" ? frame3x2Asset2 :
                  variant === "frame3" ? frame3x2Asset3 :
                  variant === "frame4" ? frame3x2Asset4 :
                  variant === "frame5" ? frame3x2Asset5 :
                  variant === "frame6" ? frame3x2Asset6 :
                  variant === "frame7" ? frame3x2Asset7 :
                  variant === "frame8" ? frame3x2Asset8 :
                  variant === "frame9" ? frame3x2Asset9 :
                  frame2Asset
                ) : (
                  variant === "frame1" ? frame3x1Asset1 :
                  variant === "frame2" ? frame3x1Asset2 :
                  variant === "frame3" ? frame3x1Asset3 :
                  variant === "frame4" ? frame3x1Asset4 :
                  frame3x1Asset5
                );
              return (
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${variantConfig.w} / ${variantConfig.h}`, background: "var(--color-card)" }}>
                  <img src={overlaySrc} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20" alt="frame overlay" />
                  {variantConfig.holes.map((h, i) => (
                    <div key={i} className="absolute overflow-hidden flex items-center justify-center bg-[var(--color-ink)] z-10" style={{
                      left: `${h.left}%`, top: `${h.top}%`, width: `${h.width}%`, height: `${h.height}%`
                    }}>
                      {photos[i] ? (
                        <img src={photos[i]} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} alt="shot" />
                      ) : (
                        <span className="pixel text-white opacity-20 text-2xl">{i + 1}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div className={`grid gap-2 ${layoutConfig.cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                {[...Array(total)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] flex items-center justify-center text-2xl overflow-hidden" style={{ background: "var(--color-ink)", border: "3px solid var(--color-ink)" }}>
                    {photos[i] ? (
                      <img src={photos[i]} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} alt="shot" />
                    ) : (
                      <span className="pixel text-white opacity-20">{i + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </aside>
    </div>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute w-3 h-3 bg-foreground";
  const map: Record<string, string> = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" };
  return <span className={`${base} ${map[pos]}`} />;
}

/* ───────────────────────── Result ───────────────────────── */

function ResultScreen({
  photos,
  frame,
  layout,
  variant,
  strip,
  setStrip,
  onRetake,
  onHome,
}: {
  photos: string[];
  frame: FrameId;
  layout: LayoutId;
  variant: string;
  strip: string;
  setStrip: (s: string) => void;
  onRetake: () => void;
  onHome: () => void;
}) {
  const [customText, setCustomText] = useState(() => {
    if (frame === "template") {
      return ""; // No custom text for template frame
    }
    if (frame === "ruangguru") {
      return "★ RUANG GURU ACADEMY · " + new Date().toLocaleDateString() + " ★";
    }
    return "★ YODHA-PHOTOBOOTH · " + new Date().toLocaleDateString() + " ★";
  });
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error" | "demo">("idle");

  // MASUKKAN URL GOOGLE APPS SCRIPT WEB APP ANDA DI SINI UNTUK AKTIFKAN UPLOAD OTOMATIS
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx1-56Eh_UBAC0AbDqJ-7ihB6Ww8oT-MLM25xkBE5fJ5F2h1EOPrf2QPRRzrhOPEKbM/exec";
  const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/17f6wdZ3pCVbHKzhjn8-KA-VtyMFalWTX?usp=drive_link";

  useEffect(() => {
    let active = true;
    async function uploadToDrive() {
      if (!strip) return;
      if (!APPS_SCRIPT_URL) {
        setUploadStatus("demo");
        return;
      }
      setUploadStatus("uploading");
      try {
        const base64Data = strip.split(",")[1];
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors", // Crucial: bypass CORS preflight and opaque redirects
          body: JSON.stringify({
            image: base64Data,
            filename: `yodha-photobooth-${Date.now()}.png`
          }),
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          }
        });
        if (active) setUploadStatus("success");
      } catch (e) {
        console.error(e);
        if (active) setUploadStatus("error");
      }
    }
    uploadToDrive();
    return () => { active = false; };
  }, [strip]);

  const handleTextChange = async (val: string) => {
    setCustomText(val);
    let newStrip;
    if (layout === "3x1" && variant !== "default") {
      newStrip = await compose3x1Variant(photos, variant);
    } else {
      newStrip = await composeStrip(photos, frame, layout, val);
    }
    setStrip(newStrip);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = strip; a.download = `yodha-photobooth-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="w-full grid md:grid-cols-2 gap-8 items-start">
      <div className="flex justify-center">
        <div className="pixel-box p-4 overflow-hidden" style={{ background: "var(--color-blush)" }}>
          <div className="pixel text-[10px] text-center mb-3">★ YOUR STRIP ★</div>
          <div className="overflow-hidden" style={{ background: "var(--color-ink)", padding: "6px" }}>
            <img src={strip} alt="photo strip" className="slot-out block w-56 sm:w-64 max-w-full" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="pixel text-[9px] text-center mt-3">YODHA-PHOTOBOOTH ©</div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Google Drive QR Code (Minimalist Version) */}
        <div className="pixel-box p-4 flex flex-col items-center gap-3 w-full" style={{ background: "var(--color-card)" }}>
          <div className="pixel-box p-2 bg-white border-2 border-[#3A2A40] shadow-[3px_3px_0_0_rgba(0,0,0,0.15)] flex items-center justify-center shrink-0">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(DRIVE_FOLDER_URL)}`} 
              alt="Google Drive QR Code"
              className="w-44 h-44"
            />
          </div>
          <span className="pixel text-[10px] font-bold text-center">SCAN UNTUK DOWNLOAD FOTO</span>
        </div>

        {/* Small Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <button className="pixel-btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={download}>⬇ Download</button>
          <button className="pixel-btn-sage" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={onRetake}>↻ Retake</button>
          <button className="pixel-btn-powder" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={onHome}>⌂ Home</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

function wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

/**
 * composeTemplateFrame — True Twibbon compositing:
 *
 * frame-benar.png has a TRANSPARENT hole in the centre.
 * Step 1: Draw photo scaled to fill the full canvas (cover-crop).
 * Step 2: Draw frame-benar.png on top — transparent hole reveals photo.
 */
async function composeTemplateFrame(photos: string[]): Promise<string> {
  const FRAME_W = 1402;
  const FRAME_H = 1122;

  const canvas = document.createElement("canvas");
  canvas.width  = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // STEP 1: Draw camera photo to fill the entire canvas background (cover-crop)
  if (photos.length > 0) {
    try {
      const img = await loadImg(photos[0]);
      const frameRatio = FRAME_W / FRAME_H;
      const imgRatio   = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > frameRatio) {
        // image wider than canvas → crop sides
        sw = img.height * frameRatio;
        sx = (img.width - sw) / 2;
      } else {
        // image taller than canvas → crop top/bottom
        sh = img.width / frameRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, FRAME_W, FRAME_H);
    } catch (e) {
      ctx.fillStyle = "#0D3B59";
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);
    }
  } else {
    ctx.fillStyle = "#0D3B59";
    ctx.fillRect(0, 0, FRAME_W, FRAME_H);
  }

  // STEP 2: Overlay frame-benar.png on top.
  // frame-benar.png has a transparent hole — photo shows through perfectly (true twibbon).
  try {
    const frameImg = await loadImg(templateFrameAsset);
    ctx.drawImage(frameImg, 0, 0, FRAME_W, FRAME_H);
  } catch (e) {
    console.error("Failed to load template frame overlay", e);
  }

  return canvas.toDataURL("image/png");
}

async function compose3x2Frame(photos: string[], variant: string = "default"): Promise<string> {
  const assetUrl = 
    variant === "frame2" ? frame3x2Asset2 :
    variant === "frame3" ? frame3x2Asset3 :
    variant === "frame4" ? frame3x2Asset4 :
    variant === "frame5" ? frame3x2Asset5 :
    variant === "frame6" ? frame3x2Asset6 :
    variant === "frame7" ? frame3x2Asset7 :
    variant === "frame8" ? frame3x2Asset8 :
    variant === "frame9" ? frame3x2Asset9 :
    frame2Asset;
    
  const frameImg = await loadImg(assetUrl);
  const w = frameImg.width;
  const h = frameImg.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  // Use the exact coordinates of the 6 transparent holes found in frame2.png
  // Base dimensions: 1333x1999
  const rw = w / 1333;
  const rh = h / 2000; // Base is 1333x2000 for the new frames, 1333x1999 for the first one, close enough
  
  let holes = [];
  if (variant === "default") {
    const rH_old = h / 1999;
    holes = [
      { x: 125 * rw, y: 552 * rH_old, w: 419 * rw, h: 316 * rH_old },
      { x: 781 * rw, y: 560 * rH_old, w: 420 * rw, h: 316 * rH_old },
      { x: 125 * rw, y: 1019 * rH_old, w: 419 * rw, h: 316 * rH_old },
      { x: 781 * rw, y: 1028 * rH_old, w: 420 * rw, h: 315 * rH_old },
      { x: 125 * rw, y: 1487 * rH_old, w: 419 * rw, h: 316 * rH_old },
      { x: 781 * rw, y: 1495 * rH_old, w: 420 * rw, h: 316 * rH_old }
    ];
  } else if (variant === "frame2") {
    holes = [
      { x: 31 * rw, y: 64 * rh, w: 605 * rw, h: 546 * rh },
      { x: 698 * rw, y: 65 * rh, w: 606 * rw, h: 546 * rh },
      { x: 31 * rw, y: 641 * rh, w: 605 * rw, h: 554 * rh },
      { x: 698 * rw, y: 642 * rh, w: 606 * rw, h: 553 * rh },
      { x: 31 * rw, y: 1226 * rh, w: 605 * rw, h: 573 * rh },
      { x: 697 * rw, y: 1226 * rh, w: 607 * rw, h: 573 * rh }
    ];
  } else if (variant === "frame3") {
    holes = [
      { x: 78 * rw, y: 60 * rh, w: 545 * rw, h: 520 * rh },
      { x: 707 * rw, y: 60 * rh, w: 546 * rw, h: 520 * rh },
      { x: 78 * rw, y: 660 * rh, w: 545 * rw, h: 520 * rh },
      { x: 707 * rw, y: 660 * rh, w: 546 * rw, h: 520 * rh },
      { x: 78 * rw, y: 1259 * rh, w: 546 * rw, h: 520 * rh },
      { x: 707 * rw, y: 1259 * rh, w: 546 * rw, h: 520 * rh }
    ];
  } else if (variant === "frame4") {
    holes = [
      { x: 49 * rw, y: 79 * rh, w: 569 * rw, h: 481 * rh },
      { x: 707 * rw, y: 139 * rh, w: 592 * rw, h: 396 * rh },
      { x: 49 * rw, y: 674 * rh, w: 569 * rw, h: 481 * rh },
      { x: 715 * rw, y: 640 * rh, w: 572 * rw, h: 439 * rh },
      { x: 49 * rw, y: 1269 * rh, w: 569 * rw, h: 480 * rh },
      { x: 720 * rw, y: 1166 * rh, w: 544 * rw, h: 456 * rh }
    ];
  } else if (variant === "frame5") {
    holes = [
      { x: 89 * rw, y: 168 * rh, w: 483 * rw, h: 399 * rh },
      { x: 755 * rw, y: 168 * rh, w: 484 * rw, h: 399 * rh },
      { x: 112 * rw, y: 726 * rh, w: 451 * rw, h: 384 * rh },
      { x: 779 * rw, y: 726 * rh, w: 450 * rw, h: 384 * rh },
      { x: 103 * rw, y: 1267 * rh, w: 446 * rw, h: 401 * rh },
      { x: 770 * rw, y: 1267 * rh, w: 446 * rw, h: 401 * rh }
    ];
  } else if (variant === "frame6") {
    holes = [
      { x: 35 * rw, y: 126 * rh, w: 597 * rw, h: 422 * rh },
      { x: 701 * rw, y: 126 * rh, w: 598 * rw, h: 422 * rh },
      { x: 39 * rw, y: 629 * rh, w: 588 * rw, h: 451 * rh },
      { x: 706 * rw, y: 629 * rh, w: 588 * rw, h: 451 * rh },
      { x: 53 * rw, y: 1159 * rh, w: 559 * rw, h: 475 * rh },
      { x: 720 * rw, y: 1159 * rh, w: 559 * rw, h: 475 * rh }
    ];
  } else if (variant === "frame7") {
    holes = [
      { x: 31 * rw, y: 57 * rh, w: 599 * rw, h: 523 * rh },
      { x: 703 * rw, y: 57 * rh, w: 599 * rw, h: 523 * rh },
      { x: 28 * rw, y: 631 * rh, w: 602 * rw, h: 522 * rh },
      { x: 703 * rw, y: 631 * rh, w: 602 * rw, h: 522 * rh },
      { x: 29 * rw, y: 1206 * rh, w: 600 * rw, h: 520 * rh },
      { x: 704 * rw, y: 1206 * rh, w: 601 * rw, h: 520 * rh }
    ];
  } else if (variant === "frame8") {
    holes = [
      { x: 108 * rw, y: 82 * rh, w: 511 * rw, h: 512 * rh },
      { x: 715 * rw, y: 82 * rh, w: 510 * rw, h: 512 * rh },
      { x: 108 * rw, y: 676 * rh, w: 511 * rw, h: 512 * rh },
      { x: 714 * rw, y: 676 * rh, w: 511 * rw, h: 512 * rh },
      { x: 107 * rw, y: 1270 * rh, w: 513 * rw, h: 513 * rh },
      { x: 714 * rw, y: 1270 * rh, w: 512 * rw, h: 514 * rh }
    ];
  } else if (variant === "frame9") {
    holes = [
      { x: 53 * rw, y: 53 * rh, w: 561 * rw, h: 560 * rh },
      { x: 720 * rw, y: 53 * rh, w: 560 * rw, h: 560 * rh },
      { x: 53 * rw, y: 660 * rh, w: 561 * rw, h: 560 * rh },
      { x: 720 * rw, y: 660 * rh, w: 560 * rw, h: 560 * rh },
      { x: 53 * rw, y: 1267 * rh, w: 561 * rw, h: 560 * rh },
      { x: 720 * rw, y: 1267 * rh, w: 560 * rw, h: 560 * rh }
    ];
  }

  for (let i = 0; i < 6; i++) {
    if (photos[i] && holes[i]) {
      try {
        const img = await loadImg(photos[i]);
        const hole = holes[i];
        
        const imgRatio = img.width / img.height;
        const cellRatio = hole.w / hole.h;
        
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgRatio > cellRatio) {
          sw = img.height * cellRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / cellRatio;
          sy = (img.height - sh) / 2;
        }
        
        ctx.drawImage(img, sx, sy, sw, sh, hole.x, hole.y, hole.w, hole.h);
      } catch (e) {
        console.error("Failed to load photo for 3x2 frame", e);
      }
    }
  }

  // Draw overlay
  ctx.drawImage(frameImg, 0, 0, w, h);

  return canvas.toDataURL("image/png");
}

async function compose3x1Variant(photos: string[], variant: string): Promise<string> {
  const assetUrl = 
    variant === "frame1" ? frame3x1Asset1 : 
    variant === "frame2" ? frame3x1Asset2 : 
    variant === "frame3" ? frame3x1Asset3 : 
    variant === "frame4" ? frame3x1Asset4 : 
    frame3x1Asset5;
    
  const frameImg = await loadImg(assetUrl);
  const w = frameImg.width;
  const h = frameImg.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  // Layout-specific holes based on analysis script
  const rw = w / (variant === "frame1" ? 600 : 724);
  const rh = h / (variant === "frame1" ? 1800 : 2172);

  let holes = [];
  if (variant === "frame1") {
    holes = [
      { x: 78 * rw, y: 478 * rh, w: 440 * rw, h: 275 * rh },
      { x: 78 * rw, y: 863 * rh, w: 440 * rw, h: 275 * rh },
      { x: 78 * rw, y: 1248 * rh, w: 440 * rw, h: 275 * rh },
    ];
  } else if (variant === "frame2") {
    holes = [
      { x: 49 * rw, y: 68 * rh, w: 632 * rw, h: 530 * rh },
      { x: 56 * rw, y: 670 * rh, w: 627 * rw, h: 536 * rh },
      { x: 52 * rw, y: 1265 * rh, w: 625 * rw, h: 542 * rh },
    ];
  } else if (variant === "frame3") {
    holes = [
      { x: 63 * rw, y: 157 * rh, w: 594 * rw, h: 414 * rh },
      { x: 63 * rw, y: 746 * rh, w: 594 * rw, h: 413 * rh },
      { x: 63 * rw, y: 1334 * rh, w: 594 * rw, h: 414 * rh },
    ];
  } else if (variant === "frame4") {
    holes = [
      { x: 56 * rw, y: 192 * rh, w: 612 * rw, h: 541 * rh },
      { x: 56 * rw, y: 790 * rh, w: 612 * rw, h: 541 * rh },
      { x: 56 * rw, y: 1388 * rh, w: 612 * rw, h: 541 * rh },
    ];
  } else if (variant === "frame5") {
    holes = [
      { x: 89 * rw, y: 82 * rh, w: 546 * rw, h: 545 * rh },
      { x: 89 * rw, y: 747 * rh, w: 546 * rw, h: 546 * rh },
      { x: 89 * rw, y: 1412 * rh, w: 546 * rw, h: 545 * rh },
    ];
  }

  for (let i = 0; i < 3; i++) {
    if (photos[i] && holes[i]) {
      try {
        const img = await loadImg(photos[i]);
        const hole = holes[i];
        
        const imgRatio = img.width / img.height;
        const cellRatio = hole.w / hole.h;
        
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgRatio > cellRatio) {
          sw = img.height * cellRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / cellRatio;
          sy = (img.height - sh) / 2;
        }
        
        ctx.drawImage(img, sx, sy, sw, sh, hole.x, hole.y, hole.w, hole.h);
      } catch (e) {
        console.error("Failed to load photo for 3x1 frame variant", e);
      }
    }
  }

  // Draw overlay
  ctx.drawImage(frameImg, 0, 0, w, h);

  return canvas.toDataURL("image/png");
}

async function composeStrip(
  photos: string[],
  frame: FrameId,
  layout: LayoutId,
  footerText: string = "★ YODHA-PHOTOBOOTH · " + new Date().toLocaleDateString() + " ★"
): Promise<string> {
  const layoutConfig = LAYOUTS.find((l) => l.id === layout) || LAYOUTS[0];
  const { cols, rows } = layoutConfig;

  // Scale factor to make the downloaded output high resolution (HD)
  const SCALE = 3;

  // W is 480 for 1 column, 760 for 2 columns grid (scaled up by SCALE)
  const W = (cols === 2 ? 760 : 480) * SCALE;
  const pad = 20 * SCALE;
  const border = 20 * SCALE;
  const gap = 14 * SCALE;

  // Calculate photo width based on layout columns
  const w = cols === 2 ? (W - (pad + border) * 2 - gap) / 2 : W - (pad + border) * 2;
  // Aspect ratio is 4:3
  const h = w * 3 / 4;

  const headerH = 80 * SCALE;
  const footerH = 140 * SCALE; // Taller footer to accommodate custom text beautifully
  const H = headerH + rows * h + (rows - 1) * gap + footerH + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Enable image smoothing with high quality for smooth HD camera photo renders
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const palette: Record<FrameId, { bg: string; accent: string; title: string }> = {
    template: { bg: "#0D3B59", accent: "#F89E1B", title: "★ RESMI ★" },
    ruangguru: { bg: "#D5ECF8", accent: "#22385C", title: "★ RUANG GURU ★" },
    cafe: { bg: "#F6CFCB", accent: "#3A2A40", title: "☕ COZY CAFE ☕" },
    gameboy: { bg: "#CFE3CB", accent: "#3A2A40", title: "▶ GAMEBOY MODE" },
    bedroom: { bg: "#CFDDF0", accent: "#3A2A40", title: "♡ RETRO ROOM ♡" },
  };
  const p = palette[frame];

  // background
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);

  // outer ink border
  ctx.fillStyle = p.accent;
  ctx.fillRect(0, 0, W, 8 * SCALE);
  ctx.fillRect(0, H - 8 * SCALE, W, 8 * SCALE);
  ctx.fillRect(0, 0, 8 * SCALE, H);
  ctx.fillRect(W - 8 * SCALE, 0, 8 * SCALE, H);

  // header title (centered)
  ctx.fillStyle = p.accent;
  ctx.font = `bold ${Math.round(22 * SCALE)}px 'Press Start 2P', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(p.title, W / 2, pad + headerH / 2);

  // load + draw photos (preserve aspect ratio with cover-crop, no stretching)
  const imgs = await Promise.all(photos.map(loadImg));
  imgs.forEach((img, i) => {
    const colIndex = i % cols;
    const rowIndex = Math.floor(i / cols);

    const x = pad + border + colIndex * (w + gap);
    const y = pad + headerH + rowIndex * (h + gap);

    // photo frame
    ctx.fillStyle = p.accent;
    ctx.fillRect(x - 6 * SCALE, y - 6 * SCALE, w + 12 * SCALE, h + 12 * SCALE);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, w, h);

    // cover-fit: crop source to match slot aspect ratio
    const slotRatio = w / h;
    const imgRatio = img.width / img.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > slotRatio) {
      // image wider than slot → crop sides
      sw = img.height * slotRatio;
      sx = (img.width - sw) / 2;
    } else {
      // image taller than slot → crop top/bottom
      sh = img.width / slotRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);

    // pixel corner studs
    [[x, y], [x + w - 8 * SCALE, y], [x, y + h - 8 * SCALE], [x + w - 8 * SCALE, y + h - 8 * SCALE]].forEach(([cx, cy]) => {
      ctx.fillStyle = p.accent; ctx.fillRect(cx, cy, 8 * SCALE, 8 * SCALE);
    });
  });

  // footer text (slightly higher in the taller footer)
  ctx.fillStyle = p.accent;
  ctx.font = `${Math.round(14 * SCALE)}px 'Press Start 2P', monospace`; // slightly larger font for custom messages
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(footerText, W / 2, H - pad - footerH + 40 * SCALE);

  // draw theme decorations at the bottom of the footer
  const decY = H - pad - 45 * SCALE;
  if (frame === "gameboy") {
    // GameBoy console controls

    // 1. D-Pad on the left
    const dpadX = pad + 50 * SCALE;
    ctx.fillStyle = p.accent;
    // Horizontal crossbar
    ctx.fillRect(dpadX - 18 * SCALE, decY - 6 * SCALE, 36 * SCALE, 12 * SCALE);
    // Vertical crossbar
    ctx.fillRect(dpadX - 6 * SCALE, decY - 18 * SCALE, 12 * SCALE, 36 * SCALE);

    // 2. Start / Select buttons in the center-ish
    const selectX = W / 2 - 35 * SCALE;
    const startX = W / 2 + 15 * SCALE;
    const pillY = decY + 15 * SCALE;

    ctx.save();
    ctx.fillStyle = p.accent;
    ctx.translate(selectX, pillY);
    ctx.rotate(-28 * Math.PI / 180);
    ctx.fillRect(-12 * SCALE, -2.5 * SCALE, 24 * SCALE, 5 * SCALE);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = p.accent;
    ctx.translate(startX, pillY);
    ctx.rotate(-28 * Math.PI / 180);
    ctx.fillRect(-12 * SCALE, -2.5 * SCALE, 24 * SCALE, 5 * SCALE);
    ctx.restore();

    // 3. A/B Action buttons on the right
    const buttonY = decY;
    const btnAX = W - pad - 50 * SCALE;
    const btnBX = W - pad - 90 * SCALE;

    // Button B (left, slightly lower)
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(btnBX, buttonY + 6 * SCALE, 11 * SCALE, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#E63946"; // Red button color
    ctx.beginPath();
    ctx.arc(btnBX, buttonY + 6 * SCALE, 8 * SCALE, 0, Math.PI * 2);
    ctx.fill();

    // Button A (right, slightly higher)
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(btnAX, buttonY - 6 * SCALE, 11 * SCALE, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#E63946"; // Red button color
    ctx.beginPath();
    ctx.arc(btnAX, buttonY - 6 * SCALE, 8 * SCALE, 0, Math.PI * 2);
    ctx.fill();
  } else if (frame === "cafe") {
    // Cafe decorations (Donut and Coffee cup)
    ctx.font = `${Math.round(24 * SCALE)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☕", pad + 50 * SCALE, decY);
    ctx.fillText("🍩", W - pad - 50 * SCALE, decY);
  } else if (frame === "bedroom") {
    // Bedroom decorations (Cute sleeping cat and moon/stars)
    ctx.font = `${Math.round(24 * SCALE)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐱", pad + 50 * SCALE, decY);
    ctx.fillText("🌙", W - pad - 50 * SCALE, decY);
  } else if (frame === "ruangguru") {
    // Ruangguru academy/school themed decorations
    const rgDecY = H - pad - footerH + 90 * SCALE; // custom Y positioning for footer elements
    const stickerH = 65 * SCALE; // significantly larger stickers

    try {
      // Draw Gacha Machine on the left
      const gacha = await loadImg(gachaAsset);
      const gachaW = (gacha.width / gacha.height) * stickerH;
      ctx.drawImage(gacha, pad + 25 * SCALE, rgDecY - stickerH / 2, gachaW, stickerH);
    } catch (e) {
      ctx.font = `${Math.round(28 * SCALE)}px sans-serif`;
      ctx.fillText("🎒", pad + 50 * SCALE, rgDecY);
    }

    try {
      // Draw Flower on the right
      const flower = await loadImg(flowerAsset);
      const flowerW = (flower.width / flower.height) * stickerH;
      ctx.drawImage(flower, W - pad - 25 * SCALE - flowerW, rgDecY - stickerH / 2, flowerW, stickerH);
    } catch (e) {
      ctx.font = `${Math.round(28 * SCALE)}px sans-serif`;
      ctx.fillText("🎓", W - pad - 50 * SCALE, rgDecY);
    }

    // Draw Bimbel / Study slogan banners in the middle space
    try {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 1. Banner "SQUAD JUARA" (Ruangguru Blue)
      ctx.fillStyle = "#008ECF";
      ctx.fillRect(W / 2 - 100 * SCALE, rgDecY - 20 * SCALE, 95 * SCALE, 16 * SCALE);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2.5 * SCALE;
      ctx.strokeRect(W / 2 - 100 * SCALE, rgDecY - 20 * SCALE, 95 * SCALE, 16 * SCALE);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(7.5 * SCALE)}px 'Press Start 2P', monospace`;
      ctx.fillText("SQUAD JUARA", W / 2 - 52.5 * SCALE, rgDecY - 11 * SCALE);

      // 2. Banner "LULUS PTN! 🎓" (Ruangguru Orange)
      ctx.fillStyle = "#F89E1B";
      ctx.fillRect(W / 2 + 5 * SCALE, rgDecY - 20 * SCALE, 95 * SCALE, 16 * SCALE);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2.5 * SCALE;
      ctx.strokeRect(W / 2 + 5 * SCALE, rgDecY - 20 * SCALE, 95 * SCALE, 16 * SCALE);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(7.5 * SCALE)}px 'Press Start 2P', monospace`;
      ctx.fillText("LULUS PTN!🎓", W / 2 + 52.5 * SCALE, rgDecY - 11 * SCALE);

      // 3. Sub-banner "FUTURE LEADERS" (Centered below the two banners)
      ctx.fillStyle = "#22385C";
      ctx.fillRect(W / 2 - 80 * SCALE, rgDecY + 4 * SCALE, 160 * SCALE, 16 * SCALE);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5 * SCALE;
      ctx.strokeRect(W / 2 - 80 * SCALE, rgDecY + 4 * SCALE, 160 * SCALE, 16 * SCALE);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(7 * SCALE)}px 'Press Start 2P', monospace`;
      ctx.fillText("★ FUTURE LEADERS ★", W / 2, rgDecY + 13 * SCALE);
      
      ctx.restore();
    } catch (e) {
      console.error("Failed to draw slogan banners", e);
    }
  }

  // draw small logos in the header
  try {
    if (frame === "ruangguru") {
      // Draw Ruangguru logo on the left (Make it bigger!)
      const rgLogo = await loadImg(ruangguruLogo);
      const rgLogoH = 42 * SCALE; // Significantly larger (was 26)
      const rgLogoW = (rgLogo.width / rgLogo.height) * rgLogoH;
      const rgLogoX = pad + 8 * SCALE;
      const rgLogoY = pad + (headerH - rgLogoH) / 2;
      ctx.drawImage(rgLogo, rgLogoX, rgLogoY, rgLogoW, rgLogoH);

      // Draw Yodha logo on the right
      const ydLogo = await loadImg(yodhaLogo);
      const ydLogoH = 34 * SCALE; // Proportional and larger
      const ydLogoW = (ydLogo.width / ydLogo.height) * ydLogoH;
      const ydLogoX = W - pad - 8 * SCALE - ydLogoW;
      const ydLogoY = pad + (headerH - ydLogoH) / 2;
      ctx.drawImage(ydLogo, ydLogoX, ydLogoY, ydLogoW, ydLogoH);
    } else {
      // Draw Yodha logo on the left
      const ydLogo = await loadImg(yodhaLogo);
      const logoH = 36 * SCALE;
      const logoW = (ydLogo.width / ydLogo.height) * logoH;
      const logoX = pad + 4 * SCALE;
      const logoY = pad + (headerH - logoH) / 2;
      ctx.drawImage(ydLogo, logoX, logoY, logoW, logoH);
    }
  } catch (e) {
    console.error("Failed to load header logos", e);
  }

  return canvas.toDataURL("image/png");
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
