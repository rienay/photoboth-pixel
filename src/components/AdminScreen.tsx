import React, { useState, useRef } from "react";
import { CustomTemplate } from "../lib/db";

export interface Template {
  id: string;
  name: string;
  layout: "3x1" | "3x2" | "2x1" | "1x1" | "2x2" | "4x2";
  img: string;
  isCustom: boolean;
  enabled: boolean;
  presetId: string;
}

interface AdminScreenProps {
  templates: Template[];
  onToggleTemplate: (id: string, enabled: boolean) => void;
  onAddTemplate: (name: string, layout: "3x1" | "3x2" | "2x1" | "1x1" | "2x2" | "4x2", presetId: string, base64Img: string) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onBack: () => void;
}

const LAYOUT_LABELS: Record<string, string> = {
  "3x1": "🎞️ Strip Vertikal (3x1)",
  "3x2": "🖼️ Grid 6 Foto (3x2)",
  "2x2": "🔳 Grid 2x2 (2x2)",
  "2x1": "📸 Strip Pendek (2x1)",
  "1x1": "📷 Foto Tunggal (1x1)",
  "4x2": "🎦 Grid 8 Foto (4x2)",
};

const HOLE_PRESETS: Record<string, { id: string; label: string }[]> = {
  "3x1": [
    { id: "frame1", label: "Pink (Preset 1)" },
    { id: "frame2", label: "Biru (Preset 2)" },
    { id: "frame3", label: "Frame 1 (Preset 3)" },
    { id: "frame4", label: "Frame 2 (Preset 4)" },
    { id: "frame5", label: "Frame 3 (Preset 5)" },
  ],
  "2x1": [
    { id: "frame1", label: "Frame 1 (Preset 1)" },
    { id: "frame2", label: "Frame 2 (Preset 2)" },
    { id: "frame3", label: "Frame 3 (Preset 3)" },
    { id: "frame4", label: "Frame 4 (Preset 4)" },
    { id: "frame5", label: "Frame 5 (Preset 5)" },
    { id: "frame6", label: "Frame 6 (Preset 6)" },
  ],
  "3x2": [
    { id: "default", label: "Default (Preset 1)" },
    { id: "frame2", label: "Frame 2 (Preset 2)" },
    { id: "frame3", label: "Frame 3 (Preset 3)" },
    { id: "frame4", label: "Frame 4 (Preset 4)" },
    { id: "frame5", label: "Frame 5 (Preset 5)" },
    { id: "frame6", label: "Frame 6 (Preset 6)" },
    { id: "frame7", label: "Frame 7 (Preset 7)" },
    { id: "frame8", label: "Frame 8 (Preset 8)" },
    { id: "frame9", label: "Frame 9 (Preset 9)" },
  ],
  "1x1": [
    { id: "default", label: "Default (Full Overlap)" },
  ],
  "2x2": [
    { id: "default", label: "Default (Full Overlap)" },
  ],
  "4x2": [
    { id: "default", label: "Default (Full Overlap)" },
  ],
};

export function AdminScreen({
  templates,
  onToggleTemplate,
  onAddTemplate,
  onDeleteTemplate,
  onBack,
}: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<"3x1" | "3x2" | "2x1" | "1x1" | "2x2" | "4x2">("3x1");
  const [newName, setNewName] = useState("");
  const [newLayout, setNewLayout] = useState<"3x1" | "3x2" | "2x1" | "1x1" | "2x2" | "4x2">("3x1");
  const [newPreset, setNewPreset] = useState("frame1");
  const [uploadError, setUploadError] = useState("");
  const [base64Img, setBase64Img] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  React.useEffect(() => {
    // Request permission first to ensure labels are visible, then enumerate
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((deviceList) => {
        const videoDevs = deviceList.filter((d) => d.kind === "videoinput");
        setDevices(videoDevs);
        const stored = localStorage.getItem("yodha_camera_device_id") || "";
        setSelectedDevice(stored);
      })
      .catch(() => {
        navigator.mediaDevices.enumerateDevices().then((deviceList) => {
          const videoDevs = deviceList.filter((d) => d.kind === "videoinput");
          setDevices(videoDevs);
          const stored = localStorage.getItem("yodha_camera_device_id") || "";
          setSelectedDevice(stored);
        });
      });
  }, []);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    if (deviceId) {
      localStorage.setItem("yodha_camera_device_id", deviceId);
    } else {
      localStorage.removeItem("yodha_camera_device_id");
    }
  };

  // Filter templates based on current tab
  const filteredTemplates = templates.filter((t) => t.layout === activeTab);

  // Handle changing layout in upload form to reset appropriate preset
  const handleLayoutChange = (layout: "3x1" | "3x2" | "2x1" | "1x1" | "2x2" | "4x2") => {
    setNewLayout(layout);
    setNewPreset(HOLE_PRESETS[layout][0].id);
  };

  // Convert uploaded file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Berkas harus berupa gambar!");
      return;
    }

    setUploadError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      setBase64Img(event.target?.result as string);
    };
    reader.onerror = () => {
      setUploadError("Gagal membaca file.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setUploadError("Nama template harus diisi!");
      return;
    }
    if (!base64Img) {
      setUploadError("Gambar template (.png) wajib diunggah!");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTemplate(newName.trim(), newLayout, newPreset, base64Img);
      // Reset form
      setNewName("");
      setBase64Img("");
      setUploadError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Switch tab to the layout of newly added template
      setActiveTab(newLayout);
      alert("Template berhasil ditambahkan!");
    } catch (err) {
      console.error(err);
      setUploadError("Gagal menyimpan template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-200">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-4 border-[var(--color-ink)]">
        <div>
          <div className="speech inline-block mb-2">
            <span className="pixel text-xs">🛠️ KONTROL PANEL ADMIN</span>
          </div>
          <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-body)", fontSize: "1.2rem" }}>
            Unggah template baru atau aktifkan/nonaktifkan template bawaan photobooth.
          </p>
        </div>
        <button className="pixel-btn-powder self-start sm:self-center" onClick={onBack}>
          ◀ Batal & Kembali
        </button>
      </div>

      <div className="space-y-8">
        {/* Camera/Webcam Settings */}
        <div className="pixel-box p-6 space-y-4" style={{ background: "var(--color-butter)" }}>
          <div className="pixel text-[11px] font-bold border-b-2 border-[var(--color-ink)] pb-2 mb-2 text-center">
            ⚙️ PENGATURAN KAMERA / WEBCAM
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-body)", fontSize: "1.2rem" }}>
              Pilih kamera atau webcam eksternal yang ingin digunakan untuk photobooth ini. Pilihan akan disimpan otomatis.
            </p>
            <div className="space-y-2">
              <label className="pixel text-[9px] block">PILIH KAMERA AKTIF</label>
              <select
                value={selectedDevice}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="w-full p-2 border-2 border-[var(--color-ink)] bg-white text-sm cursor-pointer"
                style={{ fontFamily: "var(--font-body)", fontSize: "1.2rem" }}
              >
                <option value="">Default (Kamera Utama / Selfie)</option>
                {devices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Kamera ${idx + 1} (${device.deviceId.substring(0, 8)}...)`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Top: Upload Form */}
        <div className="pixel-box p-6 space-y-4" style={{ background: "var(--color-lavender)" }}>
          <div className="pixel text-[11px] font-bold border-b-2 border-[var(--color-ink)] pb-2 mb-2 text-center">
            📤 UNGGAH TEMPLATE BARU
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Form fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="pixel text-[9px] block">NAMA TEMPLATE</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Misal: Frame Event Ultah"
                    className="w-full p-2 border-2 border-[var(--color-ink)] bg-white text-sm"
                    style={{ fontFamily: "var(--font-body)", fontSize: "1.2rem" }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="pixel text-[9px] block">UKURAN LAYOUT</label>
                  <select
                    value={newLayout}
                    onChange={(e) => handleLayoutChange(e.target.value as any)}
                    className="w-full p-2 border-2 border-[var(--color-ink)] bg-white text-sm cursor-pointer"
                    style={{ fontFamily: "var(--font-body)", fontSize: "1.2rem" }}
                  >
                    <option value="3x1">Strip Vertikal (3x1)</option>
                    <option value="3x2">Grid 6 Foto (3x2)</option>
                    <option value="2x2">Grid 2x2 (2x2)</option>
                    <option value="2x1">Strip Pendek (2x1)</option>
                    <option value="1x1">Foto Tunggal (1x1)</option>
                    <option value="4x2">Grid 8 Foto (4x2)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="pixel text-[9px] block">PRESET TATA LETAK LUBANG</label>
                  <select
                    value={newPreset}
                    onChange={(e) => setNewPreset(e.target.value)}
                    className="w-full p-2 border-2 border-[var(--color-ink)] bg-white text-sm cursor-pointer"
                    style={{ fontFamily: "var(--font-body)", fontSize: "1.2rem" }}
                  >
                    {HOLE_PRESETS[newLayout].map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column: File dropzone & Save button */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="pixel text-[9px] block">GAMBAR FRAME (.PNG TRANSPARAN)</label>
                  <input
                    type="file"
                    accept=".png,image/png"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                    id="frame-file-input"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--color-ink)] p-4 text-center cursor-pointer bg-white hover:bg-slate-50 transition-colors flex-1 flex flex-col justify-center items-center"
                    style={{ minHeight: "120px" }}
                  >
                    {base64Img ? (
                      <div className="space-y-2">
                        <img
                          src={base64Img}
                          alt="Pratinjau unggahan"
                          className="max-h-24 mx-auto object-contain bg-[repeating-conic-gradient(#ccc_0_25%,#fff_0_50%)] bg-[length:12px_12px]"
                        />
                        <span className="text-[10px] text-muted-foreground block" style={{ fontFamily: "var(--font-body)" }}>
                          Klik untuk ganti gambar
                        </span>
                      </div>
                    ) : (
                      <div className="py-2 space-y-1">
                        <span className="text-2xl block">🖼️</span>
                        <span className="pixel text-[8px] block">PILIH FILE PNG</span>
                        <span className="text-xs text-muted-foreground block" style={{ fontFamily: "var(--font-body)" }}>
                          Gunakan latar belakang transparan untuk lubang foto
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <div className="p-2 border-2 border-red-500 bg-red-50 text-red-700 text-xs pixel text-[8px]">
                    ⚠️ {uploadError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !newName || !base64Img}
                  className="w-full pixel-btn-sage"
                >
                  {isSubmitting ? "MENYIMPAN..." : "💾 SIMPAN TEMPLATE"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Bottom: Manage Templates List */}
        <div className="space-y-6">
          {/* Tab Headers */}
          <div className="flex flex-wrap gap-2 border-b-4 border-[var(--color-ink)] pb-1">
            {(["3x1", "3x2", "2x2", "2x1", "1x1", "4x2"] as const).map((l) => {
              const active = activeTab === l;
              return (
                <button
                  key={l}
                  onClick={() => setActiveTab(l)}
                  className={`pixel text-[9px] px-3 py-2 border-2 border-b-0 border-[var(--color-ink)] transition-colors ${
                    active
                      ? "bg-[var(--color-butter)] font-bold translate-y-[4px]"
                      : "bg-white hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
          <div className="speech inline-block w-full">
            <span className="pixel text-[10px] font-bold block mb-2">
              Daftar Frame untuk {LAYOUT_LABELS[activeTab]}
            </span>
          </div>

          {/* Cards list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full pixel-box p-8 text-center" style={{ background: "white" }}>
                <span className="text-2xl block mb-2">🤷‍♂️</span>
                <span className="pixel text-[9px] block">Tidak ada template untuk layout ini.</span>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="pixel-box p-4 flex flex-col justify-between space-y-4"
                  style={{
                    background: template.enabled ? "white" : "#e2e8f0",
                    opacity: template.enabled ? 1 : 0.75,
                  }}
                >
                  <div className="flex gap-4">
                    {/* Frame Preview */}
                    <div className="w-16 h-24 border-2 border-[var(--color-ink)] bg-white flex items-center justify-center shrink-0 overflow-hidden">
                      {template.img ? (
                        <img
                          src={template.img}
                          alt={template.name}
                          className="w-full h-full object-contain bg-[repeating-conic-gradient(#ccc_0_25%,#fff_0_50%)] bg-[length:8px_8px]"
                        />
                      ) : (
                        <div className="text-center p-1 text-[8px] pixel opacity-40">
                          {template.name === "Polos" ? "🎞️ POLOS" : "NO IMG"}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="pixel text-[9px] font-bold truncate block">{template.name}</span>
                        {template.isCustom ? (
                          <span className="pixel text-[6px] bg-[var(--color-sage)] text-white px-1 py-0.5 rounded">
                            KUSTOM
                          </span>
                        ) : (
                          <span className="pixel text-[6px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded">
                            BAWAAN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1" style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem" }}>
                        Preset: {template.presetId}
                      </p>
                      <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem" }}>
                        Status: <span className={template.enabled ? "text-green-600 font-bold" : "text-red-500"}>
                          {template.enabled ? "AKTIF" : "NON-AKTIF"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t-2 border-slate-100 pt-3">
                    {/* Toggle button */}
                    <button
                      onClick={() => onToggleTemplate(template.id, !template.enabled)}
                      className={`pixel text-[8px] px-3 py-1.5 border-2 border-[var(--color-ink)] cursor-pointer text-white font-bold transition-all hover:brightness-105 active:scale-95 ${
                        template.enabled ? "bg-green-600 shadow-[2px_2px_0_0_#14532d]" : "bg-red-500 shadow-[2px_2px_0_0_#7f1d1d]"
                      }`}
                    >
                      {template.enabled ? "🟢 AKTIF (ON)" : "🔴 MATI (OFF)"}
                    </button>

                    {/* Delete button (only for custom) */}
                    {template.isCustom ? (
                      <button
                        onClick={() => {
                          if (confirm(`Hapus template kustom "${template.name}"?`)) {
                            onDeleteTemplate(template.id);
                          }
                        }}
                        className="pixel text-[8px] px-2 py-1.5 border-2 border-red-700 bg-red-100 text-red-700 font-bold cursor-pointer hover:bg-red-200 active:scale-95 shadow-[2px_2px_0_0_#7f1d1d]"
                      >
                        🗑️ HAPUS
                      </button>
                    ) : (
                      // Bawaan templates cannot be deleted, only turned off
                      template.name === "Polos" && template.layout !== "3x2" ? null : (
                        <span className="text-[10px] text-muted-foreground italic" style={{ fontFamily: "var(--font-body)" }}>
                          Sistem
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
