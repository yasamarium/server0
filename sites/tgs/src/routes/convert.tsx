import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { 
  FolderArchive, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Sun, 
  Moon, 
  Upload, 
  Download, 
  Check, 
  X, 
  FileCode, 
  Sparkles,
  Phone,
  HelpCircle,
  Play,
  Pause,
  AlertCircle
} from "lucide-react";
import { ASCLOUD_HOSTING_URL } from "../lib/constants";

export const Route = createFileRoute("/convert")({
  component: ConvertPage,
});

type TabType = "zip" | "image" | "audio" | "video";

export function ConvertPage({ embed = false }: { embed?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeTab, setActiveTab] = useState<TabType>("zip");

  // Global theme sync
  useEffect(() => {
    if (embed) return;
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, [embed]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const content = (
    <section className={`flex-1 flex flex-col w-full gap-6 ${embed ? "py-2" : "px-4 py-8 max-w-2xl md:max-w-6xl mx-auto"}`}>
        {/* Intro */}
        <div className="text-center md:text-left">
          <h2 className="text-[34px] md:text-[44px] font-black tracking-tight leading-[1.1] select-none">
            Client-Side Converts.
            <br />
            <span className="opacity-40">Instant & secure.</span>
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-md">
            Formats are processed directly on your device. Your data never leaves your computer.
          </p>
        </div>

        {/* Responsive Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start w-full">
          {/* Left Column: Tab Selector (PC: vertical list, Phone: horizontal pills) */}
          <div className="md:col-span-1 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full select-none">
            {[
              { id: "zip", label: "ZIP Archive", icon: FolderArchive },
              { id: "image", label: "Image Format", icon: ImageIcon },
              { id: "audio", label: "Audio & WhatsApp", icon: Music },
              { id: "video", label: "Video Extraction", icon: Video }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[16px] border font-bold text-[14px] whitespace-nowrap transition-all ios-tap-active ${
                    isActive 
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Tool Workspace */}
          <div className="md:col-span-4 w-full">
            {activeTab === "zip" && <ZipTool />}
            {activeTab === "image" && <ImageTool />}
            {activeTab === "audio" && <AudioTool />}
            {activeTab === "video" && <VideoTool />}
          </div>
        </div>
      </section>
  );

  if (embed) return content;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between max-w-2xl md:max-w-6xl mx-auto w-full border-b border-border/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity">
            CLOUD
          </Link>
          <Link to="/note" className="text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity">
            NOTES
          </Link>
          <Link to="/convert" className="text-[20px] font-black tracking-tighter select-none">
            CONVERTS
          </Link>
          <Link to="/more" className="text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity">
            MORE
          </Link>
          <Link to="/owner" className="text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity">
            OWNER INFO
          </Link>
          <a 
            href={ASCLOUD_HOSTING_URL} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-[20px] font-black tracking-tighter select-none opacity-80 hover:opacity-100 transition-opacity text-amber-400 flex items-center gap-1"
            title="AS Cloud Hosting Subsite"
          >
            <span>HOSTING</span>
            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
              DEV
            </span>
          </a>
        </div>

        <button 
          onClick={toggleTheme}
          className="size-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-90"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </header>

      {content}
    </main>
  );
}

/* ==========================================================================
   ZIP Archive Packing & Extraction Tool
   ========================================================================== */
function ZipTool() {
  const [mode, setMode] = useState<"pack" | "extract">("pack");
  
  // Pack states
  const [packFiles, setPackFiles] = useState<File[]>([]);
  const [zipName, setZipName] = useState("archive");
  const [packing, setPacking] = useState(false);
  const [packSuccess, setPackSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract states
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<{ name: string; blob: Blob }[]>([]);
  const [extracting, setExtracting] = useState(false);
  const extractInputRef = useRef<HTMLInputElement>(null);

  // PACK functions
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setPackFiles((prev) => [...prev, ...Array.from(files)]);
    setPackSuccess(false);
  };

  const removeFile = (index: number) => {
    setPackFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createZip = async () => {
    if (packFiles.length === 0) return;
    setPacking(true);
    setPackSuccess(false);
    try {
      const zip = new JSZip();
      packFiles.forEach((file) => {
        zip.file(file.name, file);
      });
      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${zipName.trim() || "archive"}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
      setPackSuccess(true);
      setPackFiles([]);
    } catch (e) {
      console.error(e);
    } finally {
      setPacking(false);
    }
  };

  // EXTRACT functions
  const loadZipFile = async (file: File | null) => {
    if (!file) return;
    setZipFile(file);
    setExtracting(true);
    setExtractedFiles([]);
    try {
      const zip = await JSZip.loadAsync(file);
      const fileList: { name: string; blob: Blob }[] = [];
      
      // Extract files
      const promises = Object.keys(zip.files).map(async (filename) => {
        const fileData = zip.files[filename];
        if (!fileData.dir) {
          const blob = await fileData.async("blob");
          fileList.push({ name: filename, blob });
        }
      });
      await Promise.all(promises);
      setExtractedFiles(fileList);
    } catch (e) {
      alert("Failed to read zip archive");
      setZipFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const downloadFile = (name: string, blob: Blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="rounded-[24px] border border-border p-6 ios-glass ios-shadow animate-spring-scale space-y-6">
      {/* Switch Mode */}
      <div className="grid grid-cols-2 gap-1 bg-secondary/40 p-1 rounded-[16px] border border-border/25">
        <button
          onClick={() => setMode("pack")}
          className={`py-3 rounded-[12px] text-[13.5px] font-bold transition-all ${
            mode === "pack" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Pack Files (.zip)
        </button>
        <button
          onClick={() => setMode("extract")}
          className={`py-3 rounded-[12px] text-[13.5px] font-bold transition-all ${
            mode === "extract" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Extract ZIP
        </button>
      </div>

      {mode === "pack" ? (
        <div className="space-y-6">
          {/* Dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer rounded-[20px] border border-dashed border-border hover:border-foreground/45 p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-all"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className="size-12 rounded-[14px] bg-foreground/5 flex items-center justify-center mx-auto mb-3">
              <Upload className="size-5 text-foreground opacity-60 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[15px] font-bold">Select files to pack</p>
            <p className="text-[12px] text-muted-foreground mt-1">Upload multiple files to compile into ZIP</p>
          </div>

          {/* Files List */}
          {packFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Archive Name"
                  value={zipName}
                  onChange={(e) => setZipName(e.target.value)}
                  className="flex-1 bg-secondary/35 text-[14px] font-bold border border-border/30 rounded-[14px] px-4 py-2.5 outline-none focus:border-foreground/50 transition-all"
                />
                <span className="text-[14px] font-bold pr-2">.zip</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border-t border-border/20 pt-3">
                {packFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-[12px] bg-secondary/25 border border-border/20">
                    <span className="text-[13px] font-semibold truncate pr-4">{file.name}</span>
                    <button 
                      onClick={() => removeFile(idx)}
                      className="size-7 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={createZip}
                disabled={packing}
                className="w-full h-12 rounded-[16px] bg-foreground text-background font-bold text-[14px] hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                {packing ? "Packing Archive..." : "Download ZIP Archive"}
              </button>
            </div>
          )}

          {packSuccess && (
            <div className="rounded-[16px] border border-green-600/20 bg-green-600/5 text-green-600 text-[13px] font-bold p-3 flex items-center justify-center gap-2">
              <Check className="size-4" />
              <span>Archive created and downloaded successfully!</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dropzone */}
          <div 
            onClick={() => extractInputRef.current?.click()}
            className="group cursor-pointer rounded-[20px] border border-dashed border-border hover:border-foreground/45 p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-all"
          >
            <input 
              ref={extractInputRef}
              type="file" 
              accept=".zip"
              className="hidden" 
              onChange={(e) => loadZipFile(e.target.files?.[0] ?? null)}
            />
            <div className="size-12 rounded-[14px] bg-foreground/5 flex items-center justify-center mx-auto mb-3">
              <FolderArchive className="size-5 text-foreground opacity-60 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[15px] font-bold">Select ZIP archive</p>
            <p className="text-[12px] text-muted-foreground mt-1">Upload a ZIP file to extract contents</p>
          </div>

          {extracting && <p className="text-center text-[13px] text-muted-foreground">Extracting files...</p>}

          {/* Extracted List */}
          {extractedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[14px] font-bold px-1 select-none text-muted-foreground">Archive Contents ({extractedFiles.length} files)</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {extractedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-[14px] bg-secondary/25 border border-border/20">
                    <span className="text-[13px] font-semibold truncate pr-4">{file.name}</span>
                    <button 
                      onClick={() => downloadFile(file.name, file.blob)}
                      className="h-8 px-3 rounded-full hover:bg-secondary flex items-center gap-1 font-bold text-[12px] transition-all"
                    >
                      <Download className="size-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   Image Format Converter Tool
   ========================================================================== */
function ImageTool() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<"png" | "jpeg" | "webp">("webp");
  const [quality, setQuality] = useState(85);
  const [converting, setConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImage = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setConvertedUrl(null);
  };

  const convertImage = () => {
    if (!imageFile) return;
    setConverting(true);
    setConvertedUrl(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const mime = `image/${targetFormat}`;
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                setConvertedUrl(url);
              }
              setConverting(false);
            },
            mime,
            targetFormat === "png" ? undefined : quality / 100
          );
        } else {
          setConverting(false);
        }
      };
      img.onerror = () => setConverting(false);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  };

  const downloadConverted = () => {
    if (!convertedUrl || !imageFile) return;
    const name = imageFile.name.split(".").slice(0, -1).join(".");
    const link = document.createElement("a");
    link.href = convertedUrl;
    link.download = `${name}.${targetFormat}`;
    link.click();
  };

  return (
    <div className="rounded-[24px] border border-border p-6 ios-glass ios-shadow animate-spring-scale space-y-6">
      {/* Upload */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="group cursor-pointer rounded-[20px] border border-dashed border-border hover:border-foreground/45 p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-all"
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          className="hidden" 
          onChange={(e) => loadImage(e.target.files?.[0] ?? null)}
        />
        <div className="size-12 rounded-[14px] bg-foreground/5 flex items-center justify-center mx-auto mb-3">
          <ImageIcon className="size-5 text-foreground opacity-60 group-hover:scale-110 transition-transform" />
        </div>
        <p className="text-[15px] font-bold">{imageFile ? imageFile.name : "Select image file"}</p>
        <p className="text-[12px] text-muted-foreground mt-1">Supports PNG, JPEG, WEBP, BMP, etc.</p>
      </div>

      {imageFile && (
        <div className="space-y-5 border-t border-border/20 pt-5">
          {/* Formats Selector */}
          <div className="space-y-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/85 px-1">Target Format</span>
            <div className="grid grid-cols-3 gap-1 bg-secondary/40 p-1 rounded-[16px] border border-border/25">
              {(["png", "jpeg", "webp"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    setTargetFormat(fmt);
                    setConvertedUrl(null);
                  }}
                  className={`py-2 rounded-[12px] text-[13px] font-bold transition-all uppercase ${
                    targetFormat === fmt ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (JPG/WEBP only) */}
          {targetFormat !== "png" && (
            <div className="space-y-2">
              <div className="flex justify-between text-[13px] font-bold px-1 select-none">
                <span className="text-muted-foreground">Quality</span>
                <span>{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => {
                  setQuality(parseInt(e.target.value));
                  setConvertedUrl(null);
                }}
                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-foreground"
              />
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={convertImage}
              disabled={converting}
              className="w-full h-12 rounded-[16px] bg-foreground text-background font-bold text-[14px] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              {converting ? "Processing..." : "Convert Image"}
            </button>

            {convertedUrl && (
              <button
                onClick={downloadConverted}
                className="w-full h-12 rounded-[16px] border border-border hover:bg-secondary/45 text-foreground font-bold text-[14px] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Download className="size-4" />
                <span>Download Converted Image</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   Audio & WhatsApp Voice Note (.opus) Converter Tool
   ========================================================================== */
function AudioTool() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [whatsappBlob, setWhatsappBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAudioFile = (file: File | null) => {
    if (!file) return;
    setAudioFile(file);
    setStatus(null);
    setWhatsappBlob(null);
  };

  // Convert to WAV (Standard PCM 16-bit 44.1kHz stereo/mono)
  const convertToWav = async () => {
    if (!audioFile) return;
    setBusy(true);
    setStatus("Decoding audio data...");
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      setStatus("Writing WAV header & PCM data...");
      const wavBuffer = bufferToWav(decodedBuffer);
      const blob = new Blob([wavBuffer], { type: "audio/wav" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const name = audioFile.name.split(".").slice(0, -1).join(".");
      link.download = `${name}.wav`;
      link.click();
      URL.revokeObjectURL(link.href);
      setStatus("Converted to WAV successfully!");
    } catch (e) {
      console.error(e);
      setStatus("Failed to convert audio file");
    } finally {
      setBusy(false);
    }
  };

  // Convert/Record to OGG/Opus for WhatsApp Voice Notes
  const convertForWhatsApp = async () => {
    if (!audioFile) return;
    setBusy(true);
    setStatus("Preparing WhatsApp Voice Note...");
    
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      setStatus("Recording stream to voice note format (Opus)...");
      const duration = decodedBuffer.duration;
      
      // Create a node destination
      const dest = audioCtx.createMediaStreamDestination();
      
      // Determine best container (ogg/opus is ideal; webm/opus is safari/chrome fallback)
      let mimeType = "audio/ogg; codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm; codecs=opus";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
      }
      
      const mediaRecorder = new MediaRecorder(dest.stream, { mimeType });
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const voiceBlob = new Blob(chunks, { type: mimeType });
        setWhatsappBlob(voiceBlob);
        setWhatsappModal(true);
        setStatus("Voice note ready!");
        setBusy(false);
      };

      // Play buffer into the destination node
      const source = audioCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(dest);
      
      mediaRecorder.start();
      source.start(0);
      
      // Visual countdown progress during recording
      let tick = 0;
      const interval = setInterval(() => {
        tick += 0.5;
        if (tick >= duration) {
          clearInterval(interval);
        } else {
          setStatus(`Converting: ${Math.round((tick / duration) * 100)}%`);
        }
      }, 500);

      source.onended = () => {
        clearInterval(interval);
        mediaRecorder.stop();
      };
    } catch (e) {
      console.error(e);
      setStatus("Error transcoding audio to voice note");
      setBusy(false);
    }
  };

  const triggerWhatsAppShare = () => {
    if (!whatsappBlob || !audioFile) return;
    
    const name = audioFile.name.split(".").slice(0, -1).join(".");
    const filename = `${name}.opus`; // Whatsapp voice notes are .opus format
    const voiceFile = new File([whatsappBlob], filename, { type: whatsappBlob.type });

    // Try Web Share API (native share dialog - supports sharing files directly to WhatsApp)
    if (
      navigator.canShare && 
      navigator.canShare({ files: [voiceFile] })
    ) {
      navigator.share({
        files: [voiceFile],
        title: "Voice Note",
        text: "Audio Voice Note"
      }).catch(err => {
        console.log("Share failed, falling back to download...", err);
        fallbackDownloadShare(voiceFile);
      });
    } else {
      fallbackDownloadShare(voiceFile);
    }
  };

  const fallbackDownloadShare = (file: File) => {
    // 1. Download the opus file locally
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(link.href);

    // 2. Open WhatsApp Web or WhatsApp mobile app
    window.open("https://web.whatsapp.com", "_blank");
  };

  // Helper: WAV file encoder from AudioBuffer PCM data
  function bufferToWav(buffer: AudioBuffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // Write WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // File length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);         // Chunk size = 16
    setUint16(1);          // TypePCM = 1
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // Byte rate
    setUint16(numOfChan * 2);                    // Block align
    setUint16(16);                               // Bits per sample
    setUint32(0x61746164);                       // "data" chunk
    setUint32(length - pos - 4);                 // Chunk length

    // Write interleaved channel data
    for (i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // Clamp
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;  // Scale to 16-bit
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return bufferArr;

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }

  return (
    <div className="rounded-[24px] border border-border p-6 ios-glass ios-shadow animate-spring-scale space-y-6">
      {/* Upload */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="group cursor-pointer rounded-[20px] border border-dashed border-border hover:border-foreground/45 p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-all"
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="audio/*"
          className="hidden" 
          onChange={(e) => loadAudioFile(e.target.files?.[0] ?? null)}
        />
        <div className="size-12 rounded-[14px] bg-foreground/5 flex items-center justify-center mx-auto mb-3">
          <Music className="size-5 text-foreground opacity-60 group-hover:scale-110 transition-transform" />
        </div>
        <p className="text-[15px] font-bold">{audioFile ? audioFile.name : "Select audio file"}</p>
        <p className="text-[12px] text-muted-foreground mt-1">Supports MP3, WAV, M4A, OGG, etc.</p>
      </div>

      {audioFile && (
        <div className="space-y-4 border-t border-border/20 pt-5">
          {status && (
            <div className="rounded-[16px] bg-secondary/35 border border-border/20 p-4 text-[13px] font-semibold flex items-center gap-2 select-none">
              <Sparkles className="size-4 animate-pulse" />
              <span>{status}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={convertToWav}
              disabled={busy}
              className="h-12 rounded-[16px] border border-border hover:bg-secondary/45 text-foreground font-bold text-[14px] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 select-none"
            >
              <Download className="size-4.5" />
              <span>Convert to WAV</span>
            </button>
            <button
              onClick={convertForWhatsApp}
              disabled={busy}
              className="h-12 rounded-[16px] bg-foreground text-background font-black text-[14px] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 select-none"
            >
              <Phone className="size-4.5" />
              <span>Send as WhatsApp Voice</span>
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Send Modal */}
      {whatsappModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-[24px] border border-border bg-card p-6 space-y-6 ios-glass ios-shadow animate-spring-scale text-center">
            <div className="mx-auto size-14 rounded-[20px] bg-foreground/5 flex items-center justify-center text-foreground">
              <Phone className="size-6 text-foreground animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-[20px] font-black tracking-tight">WhatsApp Voice Ready</h3>
              <p className="text-[14px] text-muted-foreground max-w-xs mx-auto">
                Your audio has been transcoded into WhatsApp voice note format (.opus).
              </p>
            </div>

            <div className="rounded-[16px] border border-border/40 p-4 bg-secondary/10 flex items-start gap-3 text-left">
              <HelpCircle className="size-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-[12.5px] leading-relaxed text-muted-foreground">
                <p className="font-bold text-foreground mb-1">How to send on WhatsApp:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Click <strong>Send Voice Note</strong>.</li>
                  <li>On mobile: Select WhatsApp contact to send.</li>
                  <li>On desktop: We will download the <strong>.opus</strong> file and open WhatsApp Web. Simply drag and drop the file into your chat to send it!</li>
                </ol>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setWhatsappModal(false)}
                className="h-12 rounded-full border border-border font-bold text-[14px] hover:bg-secondary active:scale-[0.97] transition-all"
              >
                Close
              </button>
              <button
                onClick={triggerWhatsAppShare}
                className="h-12 rounded-full font-bold text-[14px] text-background bg-foreground hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span>Send Voice Note</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   Video Frame Capture & Audio Extractor Tool
   ========================================================================== */
function VideoTool() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const loadVideoFile = (file: File | null) => {
    if (!file) return;
    setVideoFile(file);
    setStatus(null);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Capture Frame
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !videoFile) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const name = videoFile.name.split(".").slice(0, -1).join(".");
          link.download = `${name}_frame_${Math.round(video.currentTime)}s.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    }
  };

  // Extract Audio track to WAV
  const extractAudioTrack = async () => {
    if (!videoFile) return;
    setExtracting(true);
    setStatus("Loading video audio tracks...");
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await videoFile.arrayBuffer();
      
      setStatus("Decoding audio track from video buffer (WAV extraction)...");
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      setStatus("Formatting extracted PCM samples...");
      const wavBuffer = writeWavFile(decodedBuffer);
      const blob = new Blob([wavBuffer], { type: "audio/wav" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const name = videoFile.name.split(".").slice(0, -1).join(".");
      link.download = `${name}_extracted.wav`;
      link.click();
      URL.revokeObjectURL(link.href);
      setStatus("Audio track extracted successfully!");
    } catch (e) {
      console.error(e);
      setStatus("No readable audio track found in this video format");
    } finally {
      setExtracting(false);
    }
  };

  // Helper: WAV file encoder from AudioBuffer PCM data
  function writeWavFile(buffer: AudioBuffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // Write WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // File length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);         // Chunk size = 16
    setUint16(1);          // TypePCM = 1
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // Byte rate
    setUint16(numOfChan * 2);                    // Block align
    setUint16(16);                               // Bits per sample
    setUint32(0x61746164);                       // "data" chunk
    setUint32(length - pos - 4);                 // Chunk length

    for (i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // Clamp
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;  // Scale to 16-bit
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return bufferArr;

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }

  return (
    <div className="rounded-[24px] border border-border p-6 ios-glass ios-shadow animate-spring-scale space-y-6">
      {/* Upload */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="group cursor-pointer rounded-[20px] border border-dashed border-border hover:border-foreground/45 p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-all"
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="video/*"
          className="hidden" 
          onChange={(e) => loadVideoFile(e.target.files?.[0] ?? null)}
        />
        <div className="size-12 rounded-[14px] bg-foreground/5 flex items-center justify-center mx-auto mb-3">
          <Video className="size-5 text-foreground opacity-60 group-hover:scale-110 transition-transform" />
        </div>
        <p className="text-[15px] font-bold">{videoFile ? videoFile.name : "Select video file"}</p>
        <p className="text-[12px] text-muted-foreground mt-1">Supports MP4, WebM, OGG, MOV, etc.</p>
      </div>

      {videoFile && videoUrl && (
        <div className="space-y-5 border-t border-border/20 pt-5">
          {/* Video Preview */}
          <div className="rounded-[18px] overflow-hidden border border-border bg-black/40 aspect-video relative flex items-center justify-center group">
            <video
              ref={videoRef}
              src={videoUrl}
              onClick={togglePlay}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              className="w-full h-full object-contain"
            />
            {/* Play overlay button */}
            {!isPlaying && (
              <button 
                onClick={togglePlay}
                className="absolute size-14 rounded-full bg-background/90 text-foreground flex items-center justify-center shadow-lg active:scale-90 transition-transform duration-200"
              >
                <Play className="size-6 ml-0.5 fill-foreground" />
              </button>
            )}
          </div>

          {/* Time Controls */}
          <div className="flex justify-between items-center text-[13px] font-bold text-muted-foreground px-1 select-none">
            <span>{Math.round(currentTime)}s</span>
            <div className="h-1 flex-1 mx-4 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-foreground"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span>{Math.round(duration)}s</span>
          </div>

          {status && (
            <div className="rounded-[16px] bg-secondary/35 border border-border/20 p-4 text-[13px] font-semibold flex items-center gap-2 select-none">
              <Sparkles className="size-4 animate-pulse" />
              <span>{status}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={captureFrame}
              className="h-12 rounded-[16px] border border-border hover:bg-secondary/45 text-foreground font-bold text-[14px] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 select-none"
            >
              <ImageIcon className="size-4.5" />
              <span>Capture Current Frame</span>
            </button>
            <button
              onClick={extractAudioTrack}
              disabled={extracting}
              className="h-12 rounded-[16px] bg-foreground text-background font-black text-[14px] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 select-none"
            >
              <Music className="size-4.5" />
              <span>{extracting ? "Extracting..." : "Extract Audio Track (WAV)"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
