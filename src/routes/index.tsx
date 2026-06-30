import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminScreen, Template } from "@/components/AdminScreen";
import { TemplateDB, CustomTemplate } from "@/lib/db";
import yodhaLogo from "@/assets/yodha-logo.png";
import ruangguruLogo from "@/assets/ruangguru.png";
import gachaAsset from "@/assets/GACHA MACHINE.png";
import flowerAsset from "@/assets/FLOWER.png";
import templateFrameAsset from "@/assets/frame1x1.png";
import frame1x1Asset1 from "@/assets/frame1x1/1.png";
import frame1x1Asset2 from "@/assets/frame1x1/2.png";
import frame1x1Asset3 from "@/assets/frame1x1/3.png";
import frame1x1Asset4 from "@/assets/frame1x1/4.png";
import frame1x1Asset5 from "@/assets/frame1x1/5.png";
import frame1x1Asset6 from "@/assets/frame1x1/6.png";
import frame1x1Asset7 from "@/assets/frame1x1/frame2-1x1.png";
import frame1x1Asset8 from "@/assets/frame-rg/1.png";
import frame1x1Asset9 from "@/assets/frame-rg/2.png";
import frame2x1Asset1 from "@/assets/frame2x1/1.png";
import frame2x1Asset2 from "@/assets/frame2x1/2.png";
import frame2x1Asset3 from "@/assets/frame2x1/3.png";
import frame2x1Asset4 from "@/assets/frame2x1/4.png";
import frame2x1Asset5 from "@/assets/frame2x1/5.png";
import frame2x1Asset6 from "@/assets/frame2x1/6.png";
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
      { name: "description", content: "Photobooth pixel seru! Pilih bingkai lucu, jepret tiga foto, dan dapatkan strip foto siap cetak." },
      { property: "og:title", content: "Yodha-Photobooth" },
      { property: "og:description", content: "Photobooth pixel: pilih frame, jepret, simpan strip foto." },
      // Meta tags to enable standalone fullscreen mode on iOS/iPadOS and Android when added to home screen
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
  }),
  component: Photobooth,
});

type Screen = "home" | "frame" | "shoot" | "result" | "admin";
type FrameId = "cafe" | "gameboy" | "bedroom" | "ruangguru" | "template";
type LayoutId = "3x1" | "3x2" | "2x1" | "1x1";

// Physical print sizes (cm) per layout
const PRINT_SIZES: Record<LayoutId, { w: number; h: number; sheets: number; label: string }> = {
  "3x1": { w: 5,  h: 15, sheets: 2, label: "5×15 cm · 2 strip (1 lembar 4R)" },
  "3x2": { w: 10, h: 15, sheets: 1, label: "10×15 cm · 1 lembar" },
  "2x1": { w: 5,  h: 10, sheets: 2, label: "5×10 cm · 2 strip (1 lembar 4R)" },
  "1x1": { w: 10, h: 10, sheets: 1, label: "10×10 cm · 1 lembar" },
};

const LAYOUTS: { id: LayoutId; name: string; rows: number; cols: number; totalPhotos: number; desc: string; emoji: string }[] = [
  { id: "3x1", name: "Strip Vertikal", rows: 3, cols: 1, totalPhotos: 3, desc: "3 foto susun ke bawah · Cetak 5×15 cm", emoji: "🎞️" },
  { id: "3x2", name: "Grid 6 Foto",   rows: 3, cols: 2, totalPhotos: 6, desc: "6 foto dua kolom · Cetak 10×15 cm",    emoji: "🖼️" },
  { id: "2x1", name: "Strip Pendek",  rows: 2, cols: 1, totalPhotos: 2, desc: "2 foto susun ke bawah · Cetak 5×10 cm", emoji: "📸" },
  { id: "1x1", name: "Foto Tunggal",  rows: 1, cols: 1, totalPhotos: 1, desc: "1 foto polaroid kotak · Cetak 5×5 cm",  emoji: "📷" },
];

// Auto-reset timeout after result screen (seconds)
const AUTO_RESET_SECONDS = 60;

/* ───────────────────────── Fullscreen Hook ───────────────────────── */
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Auto-fullscreen on first user interaction anywhere on the page
  useEffect(() => {
    const autoFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      // Remove listeners after first interaction
      window.removeEventListener("click", autoFullscreen);
      window.removeEventListener("touchstart", autoFullscreen);
    };
    window.addEventListener("click", autoFullscreen, { passive: true });
    window.addEventListener("touchstart", autoFullscreen, { passive: true });
    return () => {
      window.removeEventListener("click", autoFullscreen);
      window.removeEventListener("touchstart", autoFullscreen);
    };
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => {
      // Browser exits fullscreen when print dialog is opened. We restore it immediately.
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
          .catch(() => {
            // If the browser blocks immediate entry due to user gesture requirements,
            // we attach a one-time click/touch listener to restore it on next interaction.
            const restore = () => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              }
              window.removeEventListener("click", restore);
              window.removeEventListener("touchstart", restore);
            };
            window.addEventListener("click", restore, { passive: true });
            window.addEventListener("touchstart", restore, { passive: true });
          });
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return { isFullscreen, toggle };
}

function getDefaultTemplates(disabledIds: string[]): Template[] {
  return [
    // 1x1
    { id: "1x1_default", name: "Ruangguru 1", layout: "1x1", img: frame1x1Asset8, isCustom: false, enabled: !disabledIds.includes("1x1_default"), presetId: "default" },
    { id: "1x1_frame1", name: "Ruangguru 2", layout: "1x1", img: frame1x1Asset9, isCustom: false, enabled: !disabledIds.includes("1x1_frame1"), presetId: "frame1" },
    { id: "1x1_frame2", name: "Frame 2", layout: "1x1", img: frame1x1Asset7, isCustom: false, enabled: !disabledIds.includes("1x1_frame2"), presetId: "frame2" },
    
    // 3x1
    { id: "3x1_default", name: "Polos", layout: "3x1", img: "", isCustom: false, enabled: !disabledIds.includes("3x1_default"), presetId: "default" },
    { id: "3x1_frame1", name: "Pink", layout: "3x1", img: frame3x1Asset1, isCustom: false, enabled: !disabledIds.includes("3x1_frame1"), presetId: "frame1" },
    { id: "3x1_frame2", name: "Biru", layout: "3x1", img: frame3x1Asset2, isCustom: false, enabled: !disabledIds.includes("3x1_frame2"), presetId: "frame2" },
    { id: "3x1_frame3", name: "Frame 1", layout: "3x1", img: frame3x1Asset3, isCustom: false, enabled: !disabledIds.includes("3x1_frame3"), presetId: "frame3" },
    { id: "3x1_frame4", name: "Frame 2", layout: "3x1", img: frame3x1Asset4, isCustom: false, enabled: !disabledIds.includes("3x1_frame4"), presetId: "frame4" },
    { id: "3x1_frame5", name: "Frame 3", layout: "3x1", img: frame3x1Asset5, isCustom: false, enabled: !disabledIds.includes("3x1_frame5"), presetId: "frame5" },

    // 2x1
    { id: "2x1_default", name: "Polos", layout: "2x1", img: "", isCustom: false, enabled: !disabledIds.includes("2x1_default"), presetId: "default" },
    { id: "2x1_frame1", name: "Frame 1", layout: "2x1", img: frame2x1Asset1, isCustom: false, enabled: !disabledIds.includes("2x1_frame1"), presetId: "frame1" },
    { id: "2x1_frame2", name: "Frame 2", layout: "2x1", img: frame2x1Asset2, isCustom: false, enabled: !disabledIds.includes("2x1_frame2"), presetId: "frame2" },
    { id: "2x1_frame3", name: "Frame 3", layout: "2x1", img: frame2x1Asset3, isCustom: false, enabled: !disabledIds.includes("2x1_frame3"), presetId: "frame3" },
    { id: "2x1_frame4", name: "Frame 4", layout: "2x1", img: frame2x1Asset4, isCustom: false, enabled: !disabledIds.includes("2x1_frame4"), presetId: "frame4" },
    { id: "2x1_frame5", name: "Frame 5", layout: "2x1", img: frame2x1Asset5, isCustom: false, enabled: !disabledIds.includes("2x1_frame5"), presetId: "frame5" },
    { id: "2x1_frame6", name: "Frame 6", layout: "2x1", img: frame2x1Asset6, isCustom: false, enabled: !disabledIds.includes("2x1_frame6"), presetId: "frame6" },

    // 3x2
    { id: "3x2_default", name: "Default", layout: "3x2", img: frame2Asset, isCustom: false, enabled: !disabledIds.includes("3x2_default"), presetId: "default" },
    { id: "3x2_frame2", name: "Frame 2", layout: "3x2", img: frame3x2Asset2, isCustom: false, enabled: !disabledIds.includes("3x2_frame2"), presetId: "frame2" },
    { id: "3x2_frame3", name: "Frame 3", layout: "3x2", img: frame3x2Asset3, isCustom: false, enabled: !disabledIds.includes("3x2_frame3"), presetId: "frame3" },
    { id: "3x2_frame4", name: "Frame 4", layout: "3x2", img: frame3x2Asset4, isCustom: false, enabled: !disabledIds.includes("3x2_frame4"), presetId: "frame4" },
    { id: "3x2_frame5", name: "Frame 5", layout: "3x2", img: frame3x2Asset5, isCustom: false, enabled: !disabledIds.includes("3x2_frame5"), presetId: "frame5" },
    { id: "3x2_frame6", name: "Frame 6", layout: "3x2", img: frame3x2Asset6, isCustom: false, enabled: !disabledIds.includes("3x2_frame6"), presetId: "frame6" },
    { id: "3x2_frame7", name: "Frame 7", layout: "3x2", img: frame3x2Asset7, isCustom: false, enabled: !disabledIds.includes("3x2_frame7"), presetId: "frame7" },
    { id: "3x2_frame8", name: "Frame 8", layout: "3x2", img: frame3x2Asset8, isCustom: false, enabled: !disabledIds.includes("3x2_frame8"), presetId: "frame8" },
    { id: "3x2_frame9", name: "Frame 9", layout: "3x2", img: frame3x2Asset9, isCustom: false, enabled: !disabledIds.includes("3x2_frame9"), presetId: "frame9" },
  ];
}

/* ───────────────────────── Main Component ───────────────────────── */
function Photobooth() {
  const [screen, setScreen] = useState<Screen>("home");
  const [layout, setLayout] = useState<LayoutId>("3x1");
  const [variant, setVariant] = useState<string>("default");
  const frame: FrameId = layout === "1x1" ? "template" : "ruangguru";
  const [photos, setPhotos] = useState<string[]>([]);
  const [strip, setStrip] = useState<string | null>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [templates, setTemplates] = useState<Template[]>([]);

  // Function to reload all templates (defaults + custom from DB)
  const reloadTemplates = useCallback(async () => {
    const disabledIds = JSON.parse(localStorage.getItem("yodha_disabled_templates") || "[]");
    const defaults = getDefaultTemplates(disabledIds);

    try {
      const db = new TemplateDB();
      const customTemplates = await db.getAllTemplates();
      setTemplates([...defaults, ...customTemplates]);
    } catch (e) {
      console.error(e);
      setTemplates(defaults);
    }
  }, []);

  // Load templates on mount
  useEffect(() => {
    reloadTemplates();
  }, [reloadTemplates]);

  // Handle toggling on/off
  const handleToggleTemplate = useCallback(async (id: string, enabled: boolean) => {
    const target = templates.find(t => t.id === id);
    if (!target) return;

    if (target.isCustom) {
      try {
        const db = new TemplateDB();
        await db.saveTemplate({
          ...(target as any),
          enabled
        });
        await reloadTemplates();
      } catch (e) {
        console.error(e);
      }
    } else {
      const disabledIds = JSON.parse(localStorage.getItem("yodha_disabled_templates") || "[]");
      let newDisabled: string[];
      if (enabled) {
        newDisabled = disabledIds.filter((dId: string) => dId !== id);
      } else {
        newDisabled = [...disabledIds, id];
      }
      localStorage.setItem("yodha_disabled_templates", JSON.stringify(newDisabled));
      await reloadTemplates();
    }
  }, [templates, reloadTemplates]);

  // Handle adding custom template
  const handleAddTemplate = useCallback(async (name: string, layout: LayoutId, presetId: string, base64Img: string) => {
    try {
      const db = new TemplateDB();
      const newTemplate: CustomTemplate = {
        id: `custom_${layout}_${Date.now()}`,
        name,
        layout,
        presetId,
        img: base64Img,
        isCustom: true,
        enabled: true,
      };
      await db.saveTemplate(newTemplate);
      await reloadTemplates();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, [reloadTemplates]);

  // Handle deleting custom template
  const handleDeleteTemplate = useCallback(async (id: string) => {
    try {
      const db = new TemplateDB();
      await db.deleteTemplate(id);
      await reloadTemplates();
    } catch (e) {
      console.error(e);
    }
  }, [reloadTemplates]);

  const ensureFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 sm:px-8 py-6 sm:py-10">
      <Header
        onLogoClick={() => {
          if (screen === "admin") {
            setScreen("home");
          } else if (screen !== "shoot") {
            setScreen("admin");
          }
        }}
        isAdmin={screen === "admin"}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        showFullscreenBtn={screen !== "shoot"}
      />
      <div className="w-full max-w-4xl flex-1 flex items-center justify-center py-4 sm:py-8">
        {screen === "home" && (
          <HomeScreen
            onStart={() => {
              ensureFullscreen();
              setScreen("frame");
            }}
          />
        )}
        {screen === "frame" && (
          <FrameScreen
            selectedLayout={layout}
            setSelectedLayout={setLayout}
            variant={variant}
            setVariant={setVariant}
            onBack={() => setScreen("home")}
            onNext={() => {
              ensureFullscreen();
              setPhotos([]);
              setStrip(null);
              setScreen("shoot");
            }}
            templates={templates}
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
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            templates={templates}
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
            onHome={() => { setPhotos([]); setStrip(null); setScreen("home"); }}
          />
        )}
        {screen === "admin" && (
          <AdminScreen
            templates={templates}
            onToggleTemplate={handleToggleTemplate}
            onAddTemplate={handleAddTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onBack={() => setScreen("home")}
          />
        )}
      </div>
      <Footer />
    </main>
  );
}

/* ───────────────────────── Header / Footer ───────────────────────── */

function Header({
  onLogoClick,
  isAdmin,
  isFullscreen,
  onToggleFullscreen,
  showFullscreenBtn,
}: {
  onLogoClick?: () => void;
  isAdmin?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  showFullscreenBtn?: boolean;
}) {
  return (
    <header className="w-full max-w-5xl flex items-center justify-between gap-4 mb-2">
      <div className="flex items-center gap-3">
        <button
          onClick={onLogoClick}
          className="focus:outline-none cursor-pointer hover:scale-105 active:scale-95 transition-transform relative group"
          title="Menu Admin"
        >
          <PixelLogo />
          {!isAdmin && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base">Yodha-Photobooth</h1>
            {isAdmin && (
              <span className="pixel text-[8px] bg-[var(--color-blush)] text-[var(--color-ink)] border border-[var(--color-ink)] px-1 py-0.5 rounded uppercase">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem" }}>
            ♡ jepret, simpan, kenang ♡
          </p>
        </div>
      </div>
      {showFullscreenBtn && onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Keluar Layar Penuh (F11)" : "Layar Penuh (F11)"}
          className="pixel-btn-powder flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          style={{ fontSize: "0.65rem", padding: "8px 12px" }}
        >
          <span>{isFullscreen ? "⊠" : " ⊡"}</span>
          <span className="hidden sm:inline">{isFullscreen ? "KELUAR PENUH" : "LAYAR PENUH"}</span>
        </button>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-6 text-xs pixel text-muted-foreground">
      © Yodha-Photobooth
    </footer>
  );
}

function PixelLogo() {
  return (
    <div className="relative">
      <div className="w-12 h-12 grid grid-cols-6 grid-rows-6 gap-0">
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
    <div className="flex flex-col items-center justify-center w-full min-h-[50vh] gap-4">
      {/* Center content (Start Button) */}
      <div className="z-10 flex flex-col items-center gap-4">
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
          📸 MULAI FOTO
        </button>
        <div className="pixel text-[10px] text-muted-foreground animate-pulse">
          ▼ Tekan untuk memulai ▼
        </div>
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
  } else if (layout === "2x1") {
    const convert = (hArr: {x:number,y:number,w:number,h:number}[], baseW: number, baseH: number) =>
      ({ w: baseW, h: baseH, holes: hArr.map(v => ({ left: v.x/baseW*100, top: v.y/baseH*100, width: v.w/baseW*100, height: v.h/baseH*100 })) });

    if (variant === "frame1") {
      return convert([{ x: 137, y: 578, w: 451, h: 491 }, { x: 137, y: 1374, w: 451, h: 357 }], 728, 2000);
    } else if (variant === "frame2") {
      return convert([{ x: 110, y: 83, w: 1256, h: 1014 }, { x: 110, y: 1199, w: 1256, h: 1014 }], 1440, 2622);
    } else if (variant === "frame3") {
      return convert([{ x: 103, y: 68, w: 1254, h: 1013 }, { x: 113, y: 1199, w: 1244, h: 951 }], 1440, 2622);
    } else if (variant === "frame4") {
      return convert([{ x: 95, y: 512, w: 538, h: 651 }, { x: 95, y: 1294, w: 538, h: 358 }], 728, 2000);
    } else if (variant === "frame5") {
      return convert([{ x: 139, y: 563, w: 450, h: 490 }, { x: 139, y: 1363, w: 450, h: 355 }], 728, 2000);
    } else if (variant === "frame6") {
      return convert([{ x: 136, y: 599, w: 456, h: 497 }, { x: 136, y: 1400, w: 456, h: 362 }], 728, 2000);
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
  selectedLayout, setSelectedLayout, variant, setVariant, onBack, onNext, templates,
}: {
  selectedLayout: LayoutId;
  setSelectedLayout: (l: LayoutId) => void;
  variant: string;
  setVariant: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
  templates: Template[];
}) {
  const printInfo = PRINT_SIZES[selectedLayout];
  const enabledTemplates = templates.filter((t) => t.layout === selectedLayout && t.enabled);

  return (
    <div className="w-full space-y-8">
      <div>
        <div className="speech inline-block mb-4">
          <p className="pixel text-xs">PILIH UKURAN FOTO!</p>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          {LAYOUTS.map((l) => {
            const active = selectedLayout === l.id;
            return (
              <button
                key={l.id}
                onClick={() => {
                  setSelectedLayout(l.id);
                  const enabledTs = templates.filter((t) => t.layout === l.id && t.enabled);
                  if (enabledTs.length > 0) {
                    const firstT = enabledTs[0];
                    setVariant(firstT.isCustom ? firstT.id : firstT.id.replace(l.id + "_", ""));
                  } else {
                    setVariant("default");
                  }
                }}
                className="pixel-box p-4 flex flex-col items-center justify-between text-center transition-transform w-full min-h-[160px]"
                style={{
                  background: active ? "var(--color-butter)" : "var(--color-card)",
                  transform: active ? "translate(-2px,-2px)" : undefined,
                  boxShadow: active
                    ? "0 4px 0 0 var(--color-ink),0 -4px 0 0 var(--color-ink),4px 0 0 0 var(--color-ink),-4px 0 0 0 var(--color-ink),6px 6px 0 0 var(--color-ink)"
                    : undefined,
                }}
              >
                <LayoutPreview layout={l.id} />
                <div className="w-full mt-1">
                  <div className="flex justify-center items-center gap-1.5 mb-1">
                    <span className="pixel text-[11px] font-bold leading-none">{l.name}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pixel-box p-4" style={{ background: "var(--color-lavender)" }}>
        <div className="pixel text-[10px] text-center mb-3">PILIH DESAIN FRAME</div>
        <div className="flex flex-wrap justify-center gap-4">
          {enabledTemplates.length === 0 ? (
            <div className="text-center p-6 bg-red-100 border-2 border-red-500 text-red-700 text-xs pixel text-[9px] w-full">
              ⚠️ SEMUA TEMPLATE DINONAKTIFKAN DI MENU ADMIN. SILAKAN AKTIFKAN MINIMAL SATU TEMPLATE.
            </div>
          ) : (
            enabledTemplates.map((t) => {
              const templateVal = t.isCustom ? t.id : t.id.replace(selectedLayout + "_", "");
              const active = variant === templateVal;

              // Dimensions for previews
              const widthClass = selectedLayout === "3x2" ? "w-16" : selectedLayout === "1x1" ? "w-16" : "w-12";
              const heightClass = selectedLayout === "3x2" ? "h-24" : selectedLayout === "1x1" ? "h-20" : selectedLayout === "2x1" ? "h-24" : "h-36";

              return (
                <button
                  key={t.id}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    active ? "scale-110 drop-shadow-lg ring-2 ring-[var(--color-ink)]" : "opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setVariant(templateVal)}
                >
                  {t.img ? (
                    <img
                      src={t.img}
                      className={`${widthClass} ${heightClass} object-cover bg-white border-[3px] border-[var(--color-ink)]`}
                      alt={t.name}
                    />
                  ) : (
                    // Render default Polos schematic drawing dynamically
                    <div className={`${widthClass} ${heightClass} bg-white border-[3px] border-[var(--color-ink)] flex flex-col justify-around p-1 gap-1`}>
                      <div className="w-full h-full bg-[var(--color-ink)] opacity-10"></div>
                      <div className="w-full h-full bg-[var(--color-ink)] opacity-10"></div>
                      {selectedLayout === "3x1" && (
                        <div className="w-full h-full bg-[var(--color-ink)] opacity-10"></div>
                      )}
                    </div>
                  )}
                  <span className="pixel text-[8px]">{t.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button className="pixel-btn-powder" onClick={onBack}>◀ Kembali</button>
        <button className="pixel-btn-sage" onClick={onNext} disabled={enabledTemplates.length === 0}>Lanjut ▶</button>
      </div>
    </div>
  );
}

function LayoutPreview({ layout }: { layout: LayoutId }) {
  const layoutConfig = LAYOUTS.find((l) => l.id === layout) || LAYOUTS[0];
  const { cols, totalPhotos } = layoutConfig;

  return (
    <div className="w-full flex justify-center mb-2">
      <div
        className="border-2 border-[#3A2A40] bg-white p-1.5 flex flex-col justify-between"
        style={{
          width: cols === 2 ? "72px" : "48px",
          height: "85px",
          boxShadow: "2px 2px 0 0 rgba(58, 42, 64, 0.15)",
        }}
      >
        <div className="w-full h-0.5 bg-[#3A2A40]/10 mb-1" />
        <div className={`grid gap-1 flex-1 items-center justify-center ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {[...Array(totalPhotos)].map((_, i) => (
            <div key={i} className="aspect-[4/3] w-full border border-[#3A2A40] bg-[#F1E9E3] relative">
              <span className="absolute w-[1px] h-[1px] bg-[#3A2A40] top-0 left-0" />
              <span className="absolute w-[1px] h-[1px] bg-[#3A2A40] top-0 right-0" />
              <span className="absolute w-[1px] h-[1px] bg-[#3A2A40] bottom-0 left-0" />
              <span className="absolute w-[1px] h-[1px] bg-[#3A2A40] bottom-0 right-0" />
            </div>
          ))}
        </div>
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
  frame, layout, variant, photos, setPhotos, onDone, onBack, isFullscreen, onToggleFullscreen, templates,
}: {
  frame: FrameId;
  layout: LayoutId;
  variant: string;
  photos: string[];
  setPhotos: (p: string[]) => void;
  onDone: (strip: string) => void;
  onBack: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  templates: Template[];
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

  const activeTemplate = templates.find(t => t.id === (layout + "_" + variant) || t.id === variant);
  const effectivePreset = activeTemplate?.presetId || variant;
  const variantConfig = getVariantHoleConfig(layout, effectivePreset);
  const overlaySrc = activeTemplate?.isCustom ? activeTemplate.img : (
    layout === "2x1"
      ? (effectivePreset === "frame1" ? frame2x1Asset1 : effectivePreset === "frame2" ? frame2x1Asset2 : effectivePreset === "frame3" ? frame2x1Asset3 : effectivePreset === "frame4" ? frame2x1Asset4 : effectivePreset === "frame5" ? frame2x1Asset5 : frame2x1Asset6)
      : layout === "3x2"
      ? (effectivePreset === "frame2" ? frame3x2Asset2 : effectivePreset === "frame3" ? frame3x2Asset3 : effectivePreset === "frame4" ? frame3x2Asset4 : effectivePreset === "frame5" ? frame3x2Asset5 : effectivePreset === "frame6" ? frame3x2Asset6 : effectivePreset === "frame7" ? frame3x2Asset7 : effectivePreset === "frame8" ? frame3x2Asset8 : effectivePreset === "frame9" ? frame3x2Asset9 : frame2Asset)
      : (effectivePreset === "frame1" ? frame3x1Asset1 : effectivePreset === "frame2" ? frame3x1Asset2 : effectivePreset === "frame3" ? frame3x1Asset3 : effectivePreset === "frame4" ? frame3x1Asset4 : frame3x1Asset5)
  );

  const [detectedHoles, setDetectedHoles] = useState<{ left: number; top: number; width: number; height: number }[]>([]);
  const [overlayDimensions, setOverlayDimensions] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let active = true;
    async function loadAndDetect() {
      if (!overlaySrc) return;
      try {
        const img = await loadImg(overlaySrc);
        if (!active) return;
        const holes = detectHolesFromImage(img);
        if (holes.length > 0) {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          const pctHoles = holes.map(hole => ({
            left: (hole.x / w) * 100,
            top: (hole.y / h) * 100,
            width: (hole.w / w) * 100,
            height: (hole.h / h) * 100
          }));
          setDetectedHoles(pctHoles);
          setOverlayDimensions({ w, h });
        } else {
          setDetectedHoles([]);
          setOverlayDimensions(null);
        }
      } catch (e) {
        console.error("Failed to detect overlay holes for preview:", e);
        setDetectedHoles([]);
        setOverlayDimensions(null);
      }
    }
    loadAndDetect();
    return () => {
      active = false;
    };
  }, [overlaySrc]);

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
        setError("Kamera tidak bisa diakses. Izinkan akses kamera di pengaturan browser, lalu muat ulang halaman.");
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
        await wait(700);
      }
      setCountdown(null);
      setFlashing(true);
      const shot = takeShot();
      if (shot) captured.push(shot);
      setPhotos([...captured]);
      await wait(450);
      setFlashing(false);
      await wait(400);
    }
    setShooting(false);
    setProcessing(true);
    await wait(1900);
    const activeTemplate = templates.find(t => t.id === (layout + "_" + variant) || t.id === variant);
    const customImg = activeTemplate?.isCustom ? activeTemplate.img : undefined;
    const presetId = activeTemplate?.presetId || variant;

    let strip: string;
    if (frame === "template") {
      strip = await composeTemplateFrame(captured, variant, customImg, presetId);
    } else if (layout === "3x2") {
      strip = await compose3x2Frame(captured, variant, customImg, presetId);
    } else if (layout === "3x1" && variant !== "default") {
      strip = await compose3x1Variant(captured, variant, customImg, presetId);
    } else if (layout === "2x1" && variant !== "default") {
      strip = await compose2x1Variant(captured, variant, customImg, presetId);
    } else {
      strip = await composeStrip(captured, frame, layout);
    }
    setProcessing(false);
    onDone(strip);
  }, [shooting, takeShot, setPhotos, frame, layout, onDone, total, variant, templates]);

  const statusText = () => {
    if (error) return "OOPS!";
    if (processing) return "Sedang Memproses...";
    if (countdown) return `Bersiap... ${countdown}`;
    if (shooting) return "SENYUM! 😄";
    return `${photos.length}/${total} foto · Tekan Jepret!`;
  };

  // Template info migrated to top of component to support dynamic hole detection hooks


  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: "#000" }}>
      {/* ── Video background fills entire screen ── */}
      {!error && (
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center" style={{ background: "var(--color-card)" }}>
          <div>
            <div className="text-6xl mb-4">📵</div>
            <p className="pixel text-sm mb-2">Kamera Tidak Tersedia</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1.3rem" }}>{error}</p>
          </div>
        </div>
      )}

      {/* Template frame overlay */}
      {frame === "template" && (
        <img
          src={variant === "frame1" ? frame1x1Asset9 : variant === "frame2" ? frame1x1Asset7 : frame1x1Asset8}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
          alt="frame overlay"
        />
      )}

      {/* Flash */}
      {flashing && <div className="absolute inset-0 bg-white flash pointer-events-none z-30" />}
      {flashing && (
        <>
          {[...Array(12)].map((_, i) => (
            <span key={i} className="absolute sparkle pixel z-30" style={{
              top: `${10 + Math.random() * 80}%`, left: `${10 + Math.random() * 80}%`,
              color: i % 2 ? "var(--color-butter)" : "white", fontSize: "18px",
              animationDelay: `${Math.random() * 200}ms`,
            }}>✦</span>
          ))}
        </>
      )}

      {/* Countdown */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="pixel countdown-number" style={{
            fontSize: "clamp(8rem, 25vw, 20rem)", color: "white",
            textShadow: "0 0 60px rgba(0,0,0,0.9), 6px 6px 0 rgba(0,0,0,0.7)", lineHeight: 1,
          }}>{countdown}</div>
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div className="pixel text-white text-base mb-6 flex items-center gap-3">
            <span className="walk inline-block">🐰</span> Memproses Foto...
          </div>
          <div className="w-72 h-6 border-4" style={{ borderColor: "white", background: "rgba(255,255,255,0.15)" }}>
            <div className="h-full loading-bar" style={{ background: "var(--color-sage)" }} />
          </div>
        </div>
      )}

      {/* ── TOP-LEFT: Live + status ── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
            <span className="w-2.5 h-2.5 bg-red-500 heart-blink rounded-full" />
            <span className="pixel text-white text-[9px]">LIVE</span>
          </div>
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh (F11)" : "Layar Penuh (F11)"}
            className="px-3 py-1.5 rounded text-white text-[9px] pixel flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          >
            <span>{isFullscreen ? "⊠" : "⊡"}</span>
            <span>{isFullscreen ? "KELUAR PENUH" : "LAYAR PENUH"}</span>
          </button>
        </div>
        <div className="px-3 py-1.5 rounded w-fit" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
          <span className="pixel text-white text-[9px]">{statusText()}</span>
        </div>
      </div>

      {/* ── TOP-RIGHT: Preview strip ── */}
      <div
        className={`absolute top-4 right-4 z-20 rounded overflow-hidden ${layoutConfig.cols === 2 ? "w-40" : "w-28"}`}
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", padding: "8px" }}
      >
        <div className="pixel text-white text-[9px] text-center mb-2">PRATINJAU</div>
        <div className="relative">
          {detectedHoles.length > 0 ? (
            <div className="relative w-full overflow-hidden" style={{
              aspectRatio: overlayDimensions ? `${overlayDimensions.w} / ${overlayDimensions.h}` : `${variantConfig?.w || 1} / ${variantConfig?.h || 1}`,
              background: "#1a1a2e"
            }}>
              <img src={overlaySrc} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20" alt="" />
              {detectedHoles.map((h, i) => (
                <div key={i} className="absolute overflow-hidden z-10 flex items-center justify-center" style={{
                  left: `${h.left}%`, top: `${h.top}%`, width: `${h.width}%`, height: `${h.height}%`, background: "#2a2a4a"
                }}>
                  {photos[i] ? <img src={photos[i]} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} alt="" /> : <span className="pixel text-white opacity-25 text-xs">{i + 1}</span>}
                </div>
              ))}
            </div>
          ) : variantConfig ? (
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${variantConfig.w} / ${variantConfig.h}`, background: "#1a1a2e" }}>
              <img src={overlaySrc} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20" alt="" />
              {variantConfig.holes.map((h, i) => (
                <div key={i} className="absolute overflow-hidden z-10 flex items-center justify-center" style={{
                  left: `${h.left}%`, top: `${h.top}%`, width: `${h.width}%`, height: `${h.height}%`, background: "#2a2a4a"
                }}>
                  {photos[i] ? <img src={photos[i]} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} alt="" /> : <span className="pixel text-white opacity-25 text-xs">{i + 1}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-1 ${layoutConfig.cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {[...Array(total)].map((_, i) => (
                <div key={i} className="aspect-[4/3] flex items-center justify-center overflow-hidden" style={{ background: "#2a2a4a" }}>
                  {photos[i] ? <img src={photos[i]} className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} alt="" /> : <span className="pixel text-white opacity-25 text-xs">{i + 1}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {[...Array(total)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < photos.length ? "#86efac" : "rgba(255,255,255,0.25)" }} />
          ))}
        </div>
      </div>

      {/* ── BOTTOM: Controls bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }}
      >
        <button
          className="pixel-btn-powder"
          onClick={onBack}
          disabled={shooting || processing}
          style={{ fontSize: "0.7rem", padding: "10px 18px" }}
        >
          ◀ Kembali
        </button>

        {/* Shutter button */}
        <button
          id="shutter-btn"
          onClick={runSequence}
          disabled={shooting || processing || !!error}
          style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: shooting || processing ? "rgba(255,255,255,0.3)" : "white",
            border: "5px solid rgba(255,255,255,0.85)",
            boxShadow: "0 0 0 8px rgba(255,255,255,0.2), 0 6px 24px rgba(0,0,0,0.5)",
            cursor: shooting || processing || !!error ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", transition: "transform 120ms ease",
            opacity: shooting || processing || !!error ? 0.5 : 1,
          }}
          onMouseDown={e => { if (!shooting && !processing) (e.currentTarget as HTMLElement).style.transform = "scale(0.88)"; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        >
          📸
        </button>

        <div className="pixel text-white text-center" style={{ fontSize: "0.65rem" }}>
          <div style={{ fontSize: "1.4rem", fontFamily: "var(--font-body)" }}>{photos.length}/{total}</div>
          <div className="opacity-60 text-[9px]">FOTO</div>
        </div>
      </div>
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
    if (frame === "template") return "";
    if (frame === "ruangguru") return "★ RUANG GURU ACADEMY · " + new Date().toLocaleDateString() + " ★";
    return "★ YODHA-PHOTOBOOTH · " + new Date().toLocaleDateString() + " ★";
  });
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error" | "demo">("idle");
  const [autoResetSec, setAutoResetSec] = useState(AUTO_RESET_SECONDS);
  const uploadedRef = useRef<string | null>(null);

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyrXsFW17ixX0AV-9azLznM-FXKG72NqyfecrJqOccgzXAuC6vlJAlTAtmSOumbHfZ1/exec";
  const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1wzKMyf0hSka8flzkscDy_Ex7naddMfM0?usp=sharing";
  const printInfo = PRINT_SIZES[layout];

  // ── Auto-reset countdown ──────────────────────────────────────────
  useEffect(() => {
    setAutoResetSec(AUTO_RESET_SECONDS);
    const interval = setInterval(() => {
      setAutoResetSec(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onHome]);

  // ── Upload to Drive ───────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    if (!strip || uploadedRef.current === strip) return;

    async function uploadToDrive() {
      if (!APPS_SCRIPT_URL) { setUploadStatus("demo"); return; }
      uploadedRef.current = strip; // Mark as uploaded/uploading to prevent duplicates
      setUploadStatus("uploading");
      try {
        const base64Data = strip.split(",")[1];
        // Menggunakan trik (9999999999999 - Date.now()) agar nama file baru secara alfabetis lebih kecil,
        // sehingga langsung muncul paling atas saat disortir berdasarkan "Nama (A-Z)" di Google Drive.
        const descendingTimestamp = 9999999999999 - Date.now();
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify({ image: base64Data, filename: `yodha-photobooth-${descendingTimestamp}.png` }),
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        if (active) setUploadStatus("success");
      } catch (e) {
        console.error(e);
        uploadedRef.current = null; // Reset on error to allow retry
        if (active) setUploadStatus("error");
      }
    }
    uploadToDrive();
    return () => { active = false; };
  }, [strip]);

  const download = () => {
    const a = document.createElement("a");
    a.href = strip; a.download = `yodha-photobooth-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  // ── Print with correct physical dimensions ────────────────────────
  const printPhoto = () => {
    const { sheets, w, h } = printInfo;
    const sheetWidth = (layout === "3x1" || layout === "2x1") ? w * 2 : w;
    const sheetHeight = h;
    
    // Create an offscreen iframe with standard dimensions
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "800px";
    iframe.style.height = "1200px";
    iframe.style.border = "0";
    iframe.name = "print-frame";
    document.body.appendChild(iframe);

    let pagesContent = "";

    if (layout === "3x1" || layout === "2x1") {
      // Untuk strip 5cm: cetak 2 strip berdampingan di satu lembar
      pagesContent = `
        <div class="page">
          <div class="print-container">
            <img src="${strip}" style="width:50%;height:100%;display:block;object-fit:contain;" />
            <img src="${strip}" style="width:50%;height:100%;display:block;object-fit:contain;" />
          </div>
        </div>
      `;
    } else {
      // Untuk 3x2 (grid) atau 1x1 (foto tunggal): cetak 1 gambar per halaman
      for (let i = 0; i < sheets; i++) {
        pagesContent += `
          <div class="page">
            <div class="print-container">
              <img src="${strip}" style="width:100%;height:100%;display:block;object-fit:contain;" />
            </div>
          </div>
        `;
      }
    }

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    // Listener to remove iframe after printing is done/canceled
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "print-complete") {
        clearTimeout(cleanupTimeout);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        window.removeEventListener("message", handleMessage);
      }
    };
    window.addEventListener("message", handleMessage);

    // Fallback cleanup after 60 seconds
    const cleanupTimeout = setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      window.removeEventListener("message", handleMessage);
    }, 60000);

    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Yodha-Photobooth — Cetak Foto</title>
          <style>
            @page {
              size: auto;
              margin: 0;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: white;
            }
            .page {
              width: 100%;
              height: 100%;
              position: relative;
              page-break-after: always;
              overflow: hidden;
              background: white;
            }
            .page:last-child {
              page-break-after: avoid;
            }
            .print-container {
              position: absolute;
              top: 0;
              right: 0;
              width: ${sheetWidth}cm;
              height: ${sheetHeight}cm;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            img {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          ${pagesContent}
          <script>
            window.onload = function() {
              const imgs = Array.from(document.querySelectorAll('img'));
              if (imgs.length === 0) {
                window.print();
              } else {
                let loadedCount = 0;
                const triggerPrint = () => {
                  loadedCount++;
                  if (loadedCount === imgs.length) {
                    Promise.all(imgs.map(img => {
                      if (img.decode) {
                        return img.decode().catch(function() {});
                      }
                      return Promise.resolve();
                    })).then(function() {
                      setTimeout(function() {
                        window.print();
                      }, 300);
                    });
                  }
                };
                imgs.forEach(img => {
                  if (img.complete) {
                    triggerPrint();
                  } else {
                    img.onload = triggerPrint;
                    img.onerror = triggerPrint;
                  }
                });
              }
            };
            window.onafterprint = function() {
              window.parent.postMessage({ type: 'print-complete' }, '*');
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();
  };

  // Progress bar width
  const progressPct = (autoResetSec / AUTO_RESET_SECONDS) * 100;

  return (
    <div className="w-full space-y-6">
      {/* Auto-reset countdown bar */}
      <div className="pixel-box p-3" style={{ background: "var(--color-lavender)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="pixel text-[9px]">⏱ Kembali ke awal dalam {autoResetSec} detik</span>
          <button
            className="pixel text-[9px] underline cursor-pointer"
            onClick={() => setAutoResetSec(AUTO_RESET_SECONDS)}
          >
            Tunda
          </button>
        </div>
        <div className="w-full h-3 border-2" style={{ borderColor: "var(--color-ink)", background: "var(--color-card)" }}>
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%`, background: "var(--color-sage)" }}
          />
        </div>
      </div>

      <div className="w-full grid md:grid-cols-2 gap-8 items-start">
        {/* Strip preview */}
        <div className="flex justify-center">
          <div className="pixel-box p-4 overflow-hidden" style={{ background: "var(--color-blush)" }}>
            <div className="pixel text-[10px] text-center mb-3">★ FOTO KAMU ★</div>
            <div className="overflow-hidden" style={{ background: "var(--color-ink)", padding: "6px" }}>
              <img src={strip} alt="strip foto" className="slot-out block w-56 sm:w-64 max-w-full" style={{ imageRendering: "pixelated" }} />
            </div>
            <div className="pixel text-[9px] text-center mt-3">YODHA-PHOTOBOOTH ©</div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col items-center justify-center space-y-5">
          {/* Print size info */}
          <div className="pixel-box p-3 w-full flex items-center gap-3" style={{ background: "var(--color-butter)" }}>
            <span className="text-2xl">🖨️</span>
            <div>
              <div className="pixel text-[10px] font-bold">Ukuran Cetak</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem" }}>{printInfo.label}</div>
            </div>
          </div>

          {/* QR Code */}
          <div className="pixel-box p-4 flex flex-col items-center gap-3 w-full" style={{ background: "var(--color-card)" }}>
            <div className="pixel-box p-2 bg-white border-2 border-[#3A2A40] shadow-[3px_3px_0_0_rgba(0,0,0,0.15)] flex items-center justify-center shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(DRIVE_FOLDER_URL)}`}
                alt="QR Code Google Drive"
                className="w-44 h-44"
              />
            </div>
            <span className="pixel text-[10px] font-bold text-center">SCAN QR UNTUK SIMPAN FOTO</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <button
              id="print-btn"
              className="pixel-btn flex items-center gap-2"
              style={{ fontSize: '0.8rem', padding: '0.6rem 1.2rem', background: "var(--color-ink)", color: "var(--color-card)" }}
              onClick={printPhoto}
            >
              🖨️ Cetak Foto
            </button>
            <button className="pixel-btn" style={{ fontSize: '0.8rem', padding: '0.6rem 1.2rem' }} onClick={download}>⬇ Simpan Foto</button>
          </div>
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <button className="pixel-btn-sage" style={{ fontSize: '0.8rem', padding: '0.6rem 1.2rem' }} onClick={onRetake}>↻ Foto Ulang</button>
            <button className="pixel-btn-powder" style={{ fontSize: '0.8rem', padding: '0.6rem 1.2rem' }} onClick={onHome}>⌂ Beranda</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Helpers ───────────────────────── */

function wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function detectHolesFromImage(frameImg: HTMLImageElement): { x: number; y: number; w: number; h: number }[] {
  const canvas = document.createElement("canvas");
  canvas.width = frameImg.naturalWidth || frameImg.width;
  canvas.height = frameImg.naturalHeight || frameImg.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(frameImg, 0, 0);

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const isTransparent = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) {
      isTransparent[i / 4] = 1;
    }
  }

  const visited = new Uint8Array(width * height);
  const holes: { x: number; y: number; w: number; h: number }[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (isTransparent[idx] && !visited[idx]) {
        let minX = x, maxX = x;
        let minY = y, maxY = y;

        const queue: [number, number][] = [[x, y]];
        visited[idx] = 1;

        let head = 0;
        while (head < queue.length) {
          const [cx, cy] = queue[head++];

          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx;
              if (isTransparent[nidx] && !visited[nidx]) {
                visited[nidx] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }

        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        if (w >= width * 0.3 && w < width * 0.98 && h >= height * 0.05) {
          holes.push({ x: minX, y: minY, w, h });
        }
      }
    }
  }

  holes.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 20) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  return holes;
}

async function composeTemplateFrame(photos: string[], variant: string = "default", customImg?: string, presetId?: string): Promise<string> {
  const effectivePreset = presetId || variant;

  const frameImg = await loadImg(
    customImg || (
      effectivePreset === "frame1" ? frame1x1Asset9 :
      effectivePreset === "frame2" ? frame1x1Asset7 :
      frame1x1Asset8
    )
  );

  const FRAME_W = frameImg.width;
  const FRAME_H = frameImg.height;

  const canvas = document.createElement("canvas");
  canvas.width  = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  let holes = detectHolesFromImage(frameImg);
  let hx = 0, hy = 0, hw = FRAME_W, hh = FRAME_H;
  if (holes.length === 1) {
    hx = holes[0].x;
    hy = holes[0].y;
    hw = holes[0].w;
    hh = holes[0].h;
  }

  if (photos.length > 0) {
    try {
      const img = await loadImg(photos[0]);
      const holeRatio = hw / hh;
      const imgRatio   = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > holeRatio) {
        sw = img.height * holeRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / holeRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, hx, hy, hw, hh);
    } catch (e) {
      ctx.fillStyle = "#0D3B59";
      ctx.fillRect(hx, hy, hw, hh);
    }
  } else {
    ctx.fillStyle = "#0D3B59";
    ctx.fillRect(hx, hy, hw, hh);
  }

  try {
    ctx.drawImage(frameImg, 0, 0, FRAME_W, FRAME_H);
  } catch (e) {
    console.error("Gagal memuat frame overlay", e);
  }

  return canvas.toDataURL("image/png");
}

async function compose2x1Variant(photos: string[], variant: string, customImg?: string, presetId?: string): Promise<string> {
  const effectivePreset = presetId || variant;
  const assetUrl = customImg || (
    effectivePreset === "frame1" ? frame2x1Asset1 :
    effectivePreset === "frame2" ? frame2x1Asset2 :
    effectivePreset === "frame3" ? frame2x1Asset3 :
    effectivePreset === "frame4" ? frame2x1Asset4 :
    effectivePreset === "frame5" ? frame2x1Asset5 :
    frame2x1Asset6
  );

  const frameImg = await loadImg(assetUrl);
  const FRAME_W = frameImg.width;
  const FRAME_H = frameImg.height;

  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  let holes = detectHolesFromImage(frameImg);
  if (holes.length !== 2) {
    const config = getVariantHoleConfig("2x1", effectivePreset);
    if (config) {
      holes = config.holes.map(h => ({
        x: (h.left / 100) * FRAME_W,
        y: (h.top / 100) * FRAME_H,
        w: (h.width / 100) * FRAME_W,
        h: (h.height / 100) * FRAME_H,
      }));
    }
  }

  for (let i = 0; i < photos.length; i++) {
    if (!holes[i]) break;
    const hole = holes[i];
    try {
      const img = await loadImg(photos[i]);
      const holeRatio = hole.w / hole.h;
      const imgRatio = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > holeRatio) {
        sw = img.height * holeRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / holeRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, hole.x, hole.y, hole.w, hole.h);
    } catch (e) {
      ctx.fillStyle = "#3A2A40";
      ctx.fillRect(hole.x, hole.y, hole.w, hole.h);
    }
  }

  ctx.drawImage(frameImg, 0, 0, FRAME_W, FRAME_H);

  return canvas.toDataURL("image/png");
}

async function compose3x2Frame(photos: string[], variant: string = "default", customImg?: string, presetId?: string): Promise<string> {
  const effectivePreset = presetId || variant;
  const assetUrl = customImg || (
    effectivePreset === "frame2" ? frame3x2Asset2 :
    effectivePreset === "frame3" ? frame3x2Asset3 :
    effectivePreset === "frame4" ? frame3x2Asset4 :
    effectivePreset === "frame5" ? frame3x2Asset5 :
    effectivePreset === "frame6" ? frame3x2Asset6 :
    effectivePreset === "frame7" ? frame3x2Asset7 :
    effectivePreset === "frame8" ? frame3x2Asset8 :
    effectivePreset === "frame9" ? frame3x2Asset9 :
    frame2Asset
  );

  const frameImg = await loadImg(assetUrl);
  const w = frameImg.width;
  const h = frameImg.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  let holes = detectHolesFromImage(frameImg);

  if (holes.length !== 6) {
    const rw = w / 1333;
    const rh = h / 2000;

    if (effectivePreset === "default") {
      const rH_old = h / 1999;
      holes = [
        { x: 125 * rw, y: 552 * rH_old, w: 419 * rw, h: 316 * rH_old },
        { x: 781 * rw, y: 560 * rH_old, w: 420 * rw, h: 316 * rH_old },
        { x: 125 * rw, y: 1019 * rH_old, w: 419 * rw, h: 316 * rH_old },
        { x: 781 * rw, y: 1028 * rH_old, w: 420 * rw, h: 315 * rH_old },
        { x: 125 * rw, y: 1487 * rH_old, w: 419 * rw, h: 316 * rH_old },
        { x: 781 * rw, y: 1495 * rH_old, w: 420 * rw, h: 316 * rH_old }
      ];
    } else if (effectivePreset === "frame2") {
      holes = [
        { x: 31 * rw, y: 64 * rh, w: 605 * rw, h: 546 * rh },
        { x: 698 * rw, y: 65 * rh, w: 606 * rw, h: 546 * rh },
        { x: 31 * rw, y: 641 * rh, w: 605 * rw, h: 554 * rh },
        { x: 698 * rw, y: 642 * rh, w: 606 * rw, h: 553 * rh },
        { x: 31 * rw, y: 1226 * rh, w: 605 * rw, h: 573 * rh },
        { x: 697 * rw, y: 1226 * rh, w: 607 * rw, h: 573 * rh }
      ];
    } else if (effectivePreset === "frame3") {
      holes = [
        { x: 78 * rw, y: 60 * rh, w: 545 * rw, h: 520 * rh },
        { x: 707 * rw, y: 60 * rh, w: 546 * rw, h: 520 * rh },
        { x: 78 * rw, y: 660 * rh, w: 545 * rw, h: 520 * rh },
        { x: 707 * rw, y: 660 * rh, w: 546 * rw, h: 520 * rh },
        { x: 78 * rw, y: 1259 * rh, w: 546 * rw, h: 520 * rh },
        { x: 707 * rw, y: 1259 * rh, w: 546 * rw, h: 520 * rh }
      ];
    } else if (effectivePreset === "frame4") {
      holes = [
        { x: 49 * rw, y: 79 * rh, w: 569 * rw, h: 481 * rh },
        { x: 707 * rw, y: 139 * rh, w: 592 * rw, h: 396 * rh },
        { x: 49 * rw, y: 674 * rh, w: 569 * rw, h: 481 * rh },
        { x: 715 * rw, y: 640 * rh, w: 572 * rw, h: 439 * rh },
        { x: 49 * rw, y: 1269 * rh, w: 569 * rw, h: 480 * rh },
        { x: 720 * rw, y: 1166 * rh, w: 544 * rw, h: 456 * rh }
      ];
    } else if (effectivePreset === "frame5") {
      holes = [
        { x: 89 * rw, y: 168 * rh, w: 483 * rw, h: 399 * rh },
        { x: 755 * rw, y: 168 * rh, w: 484 * rw, h: 399 * rh },
        { x: 112 * rw, y: 726 * rh, w: 451 * rw, h: 384 * rh },
        { x: 779 * rw, y: 726 * rh, w: 450 * rw, h: 384 * rh },
        { x: 103 * rw, y: 1267 * rh, w: 446 * rw, h: 401 * rh },
        { x: 770 * rw, y: 1267 * rh, w: 446 * rw, h: 401 * rh }
      ];
    } else if (effectivePreset === "frame6") {
      holes = [
        { x: 35 * rw, y: 126 * rh, w: 597 * rw, h: 422 * rh },
        { x: 701 * rw, y: 126 * rh, w: 598 * rw, h: 422 * rh },
        { x: 39 * rw, y: 629 * rh, w: 588 * rw, h: 451 * rh },
        { x: 706 * rw, y: 629 * rh, w: 588 * rh, h: 451 * rh },
        { x: 53 * rw, y: 1159 * rh, w: 559 * rw, h: 475 * rh },
        { x: 720 * rw, y: 1159 * rh, w: 559 * rw, h: 475 * rh }
      ];
    } else if (effectivePreset === "frame7") {
      holes = [
        { x: 31 * rw, y: 57 * rh, w: 599 * rw, h: 523 * rh },
        { x: 703 * rw, y: 57 * rh, w: 599 * rw, h: 523 * rh },
        { x: 28 * rw, y: 631 * rh, w: 602 * rw, h: 522 * rh },
        { x: 703 * rw, y: 631 * rh, w: 602 * rw, h: 522 * rh },
        { x: 29 * rw, y: 1206 * rh, w: 600 * rw, h: 520 * rh },
        { x: 704 * rw, y: 1206 * rh, w: 601 * rw, h: 520 * rh }
      ];
    } else if (effectivePreset === "frame8") {
      holes = [
        { x: 108 * rw, y: 82 * rh, w: 511 * rw, h: 512 * rh },
        { x: 715 * rw, y: 82 * rh, w: 510 * rw, h: 512 * rh },
        { x: 108 * rw, y: 676 * rh, w: 511 * rw, h: 512 * rh },
        { x: 714 * rw, y: 676 * rh, w: 511 * rw, h: 512 * rh },
        { x: 107 * rw, y: 1270 * rh, w: 513 * rw, h: 513 * rh },
        { x: 714 * rw, y: 1270 * rh, w: 512 * rw, h: 514 * rh }
      ];
    } else if (effectivePreset === "frame9") {
      holes = [
        { x: 53 * rw, y: 53 * rh, w: 561 * rw, h: 560 * rh },
        { x: 720 * rw, y: 53 * rh, w: 560 * rw, h: 560 * rh },
        { x: 53 * rw, y: 660 * rh, w: 561 * rw, h: 560 * rh },
        { x: 720 * rw, y: 660 * rh, w: 560 * rw, h: 560 * rh },
        { x: 53 * rw, y: 1267 * rh, w: 561 * rw, h: 560 * rh },
        { x: 720 * rw, y: 1267 * rh, w: 560 * rw, h: 560 * rh }
      ];
    }
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
        console.error("Gagal memuat foto untuk frame 3x2", e);
      }
    }
  }

  ctx.drawImage(frameImg, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}

async function compose3x1Variant(photos: string[], variant: string, customImg?: string, presetId?: string): Promise<string> {
  const effectivePreset = presetId || variant;
  const assetUrl = customImg || (
    effectivePreset === "frame1" ? frame3x1Asset1 :
    effectivePreset === "frame2" ? frame3x1Asset2 :
    effectivePreset === "frame3" ? frame3x1Asset3 :
    effectivePreset === "frame4" ? frame3x1Asset4 :
    frame3x1Asset5
  );

  const frameImg = await loadImg(assetUrl);
  const w = frameImg.width;
  const h = frameImg.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);

  let holes = detectHolesFromImage(frameImg);

  if (holes.length !== 3) {
    const rw = w / (effectivePreset === "frame1" ? 600 : 724);
    const rh = h / (effectivePreset === "frame1" ? 1800 : 2172);

    if (effectivePreset === "frame1") {
      holes = [
        { x: 78 * rw, y: 478 * rh, w: 440 * rw, h: 275 * rh },
        { x: 78 * rw, y: 863 * rh, w: 440 * rw, h: 275 * rh },
        { x: 78 * rw, y: 1248 * rh, w: 440 * rw, h: 275 * rh },
      ];
    } else if (effectivePreset === "frame2") {
      holes = [
        { x: 49 * rw, y: 68 * rh, w: 632 * rw, h: 530 * rh },
        { x: 56 * rw, y: 670 * rh, w: 627 * rw, h: 536 * rh },
        { x: 52 * rw, y: 1265 * rh, w: 625 * rw, h: 542 * rh },
      ];
    } else if (effectivePreset === "frame3") {
      holes = [
        { x: 63 * rw, y: 157 * rh, w: 594 * rw, h: 414 * rh },
        { x: 63 * rw, y: 746 * rh, w: 594 * rw, h: 413 * rh },
        { x: 63 * rw, y: 1334 * rh, w: 594 * rw, h: 414 * rh },
      ];
    } else if (effectivePreset === "frame4") {
      holes = [
        { x: 56 * rw, y: 192 * rh, w: 612 * rw, h: 541 * rh },
        { x: 56 * rw, y: 790 * rh, w: 612 * rw, h: 541 * rh },
        { x: 56 * rw, y: 1388 * rh, w: 612 * rw, h: 541 * rh },
      ];
    } else if (effectivePreset === "frame5") {
      holes = [
        { x: 89 * rw, y: 82 * rh, w: 546 * rw, h: 545 * rh },
        { x: 89 * rw, y: 747 * rh, w: 546 * rw, h: 546 * rh },
        { x: 89 * rw, y: 1412 * rh, w: 546 * rw, h: 545 * rh },
      ];
    }
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
        console.error("Gagal memuat foto untuk frame 3x1", e);
      }
    }
  }

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

  const SCALE = 3;
  const W = (cols === 2 ? 760 : 480) * SCALE;
  const pad = 20 * SCALE;
  const border = 20 * SCALE;
  const gap = 14 * SCALE;

  const w = cols === 2 ? (W - (pad + border) * 2 - gap) / 2 : W - (pad + border) * 2;
  const h = w * 3 / 4;

  const headerH = 80 * SCALE;
  const footerH = 140 * SCALE;
  const H = headerH + rows * h + (rows - 1) * gap + footerH + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const palette: Record<FrameId, { bg: string; accent: string; title: string }> = {
    template:  { bg: "#0D3B59", accent: "#F89E1B", title: "★ RESMI ★" },
    ruangguru: { bg: "#D5ECF8", accent: "#22385C", title: "★ RUANG GURU ★" },
    cafe:      { bg: "#F6CFCB", accent: "#3A2A40", title: "☕ COZY CAFE ☕" },
    gameboy:   { bg: "#CFE3CB", accent: "#3A2A40", title: "▶ GAMEBOY MODE" },
    bedroom:   { bg: "#CFDDF0", accent: "#3A2A40", title: "♡ RETRO ROOM ♡" },
  };
  const p = palette[frame];

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = p.accent;
  ctx.fillRect(0, 0, W, 8 * SCALE);
  ctx.fillRect(0, H - 8 * SCALE, W, 8 * SCALE);
  ctx.fillRect(0, 0, 8 * SCALE, H);
  ctx.fillRect(W - 8 * SCALE, 0, 8 * SCALE, H);

  ctx.fillStyle = p.accent;
  ctx.font = `bold ${Math.round(22 * SCALE)}px 'Press Start 2P', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(p.title, W / 2, pad + headerH / 2);

  const imgs = await Promise.all(photos.map(loadImg));
  imgs.forEach((img, i) => {
    const colIndex = i % cols;
    const rowIndex = Math.floor(i / cols);
    const x = pad + border + colIndex * (w + gap);
    const y = pad + headerH + rowIndex * (h + gap);

    ctx.fillStyle = p.accent;
    ctx.fillRect(x - 6 * SCALE, y - 6 * SCALE, w + 12 * SCALE, h + 12 * SCALE);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, w, h);

    const slotRatio = w / h;
    const imgRatio = img.width / img.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > slotRatio) {
      sw = img.height * slotRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / slotRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);

    [[x, y], [x + w - 8 * SCALE, y], [x, y + h - 8 * SCALE], [x + w - 8 * SCALE, y + h - 8 * SCALE]].forEach(([cx, cy]) => {
      ctx.fillStyle = p.accent; ctx.fillRect(cx, cy, 8 * SCALE, 8 * SCALE);
    });
  });

  ctx.fillStyle = p.accent;
  ctx.font = `${Math.round(14 * SCALE)}px 'Press Start 2P', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(footerText, W / 2, H - pad - footerH + 40 * SCALE);

  const decY = H - pad - 45 * SCALE;
  if (frame === "gameboy") {
    const dpadX = pad + 50 * SCALE;
    ctx.fillStyle = p.accent;
    ctx.fillRect(dpadX - 18 * SCALE, decY - 6 * SCALE, 36 * SCALE, 12 * SCALE);
    ctx.fillRect(dpadX - 6 * SCALE, decY - 18 * SCALE, 12 * SCALE, 36 * SCALE);

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

    const buttonY = decY;
    const btnAX = W - pad - 50 * SCALE;
    const btnBX = W - pad - 90 * SCALE;

    ctx.fillStyle = p.accent;
    ctx.beginPath(); ctx.arc(btnBX, buttonY + 6 * SCALE, 11 * SCALE, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#E63946";
    ctx.beginPath(); ctx.arc(btnBX, buttonY + 6 * SCALE, 8 * SCALE, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = p.accent;
    ctx.beginPath(); ctx.arc(btnAX, buttonY - 6 * SCALE, 11 * SCALE, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#E63946";
    ctx.beginPath(); ctx.arc(btnAX, buttonY - 6 * SCALE, 8 * SCALE, 0, Math.PI * 2); ctx.fill();
  } else if (frame === "cafe") {
    ctx.font = `${Math.round(24 * SCALE)}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("☕", pad + 50 * SCALE, decY);
    ctx.fillText("🍩", W - pad - 50 * SCALE, decY);
  } else if (frame === "bedroom") {
    ctx.font = `${Math.round(24 * SCALE)}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🐱", pad + 50 * SCALE, decY);
    ctx.fillText("🌙", W - pad - 50 * SCALE, decY);
  } else if (frame === "ruangguru") {
    const rgDecY = H - pad - footerH + 90 * SCALE;
    const stickerH = 65 * SCALE;

    try {
      const gacha = await loadImg(gachaAsset);
      const gachaW = (gacha.width / gacha.height) * stickerH;
      ctx.drawImage(gacha, pad + 25 * SCALE, rgDecY - stickerH / 2, gachaW, stickerH);
    } catch (e) {
      ctx.font = `${Math.round(28 * SCALE)}px sans-serif`;
      ctx.fillText("🎒", pad + 50 * SCALE, rgDecY);
    }

    try {
      const flower = await loadImg(flowerAsset);
      const flowerW = (flower.width / flower.height) * stickerH;
      ctx.drawImage(flower, W - pad - 25 * SCALE - flowerW, rgDecY - stickerH / 2, flowerW, stickerH);
    } catch (e) {
      ctx.font = `${Math.round(28 * SCALE)}px sans-serif`;
      ctx.fillText("🎓", W - pad - 50 * SCALE, rgDecY);
    }

    try {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "#008ECF";
      ctx.fillRect(W / 2 - 100 * SCALE, rgDecY - 20 * SCALE, 95 * SCALE, 16 * SCALE);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2.5 * SCALE;
      ctx.strokeRect(W / 2 - 100 * SCALE, rgDecY - 20 * SCALE, 95 * SCALE, 16 * SCALE);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(7.5 * SCALE)}px 'Press Start 2P', monospace`;
      ctx.fillText("SQUAD JUARA", W / 2 - 52.5 * SCALE, rgDecY - 11 * SCALE);

      ctx.fillStyle = "#F89E1B";
      ctx.fillRect(W / 2 + 5 * SCALE, rgDecY - 20 * SCALE, 95 * SCALE, 16 * SCALE);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2.5 * SCALE;
      ctx.strokeRect(W / 2 + 5 * SCALE, rgDecY - 20 * SCALE, 95 * SCALE, 16 * SCALE);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.round(7.5 * SCALE)}px 'Press Start 2P', monospace`;
      ctx.fillText("LULUS PTN!🎓", W / 2 + 52.5 * SCALE, rgDecY - 11 * SCALE);

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
      console.error("Gagal menggambar banner slogan", e);
    }
  }

  try {
    if (frame === "ruangguru") {
      const rgLogo = await loadImg(ruangguruLogo);
      const rgLogoH = 42 * SCALE;
      const rgLogoW = (rgLogo.width / rgLogo.height) * rgLogoH;
      ctx.drawImage(rgLogo, pad + 8 * SCALE, pad + (headerH - rgLogoH) / 2, rgLogoW, rgLogoH);

      const ydLogo = await loadImg(yodhaLogo);
      const ydLogoH = 34 * SCALE;
      const ydLogoW = (ydLogo.width / ydLogo.height) * ydLogoH;
      ctx.drawImage(ydLogo, W - pad - 8 * SCALE - ydLogoW, pad + (headerH - ydLogoH) / 2, ydLogoW, ydLogoH);
    } else {
      const ydLogo = await loadImg(yodhaLogo);
      const logoH = 36 * SCALE;
      const logoW = (ydLogo.width / ydLogo.height) * logoH;
      ctx.drawImage(ydLogo, pad + 4 * SCALE, pad + (headerH - logoH) / 2, logoW, logoH);
    }
  } catch (e) {
    console.error("Gagal memuat logo header", e);
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
