import { useEffect, useRef, useState, type FormEvent } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";

interface ScanCodeModalProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  title?: string;
  description?: string;
}

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

export function ScanCodeModal({
  open,
  onClose,
  onDetected,
  title = "Pindai Barcode / QR Code",
  description = "Arahkan kamera ke QR code atau barcode produk, atau ketik kode secara manual.",
}: ScanCodeModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      setManualCode("");
      setCameraError(null);
      setCameraActive(false);
      return;
    }

    let cancelled = false;
    let rafId = 0;

    const stopStream = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    };

    const startCamera = async () => {
      if (!window.isSecureContext) {
        setCameraError(
          "Kamera di iPhone/HP hanya bisa aktif lewat HTTPS (bukan HTTP IP lokal). Gunakan input kode di bawah.",
        );
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Browser tidak mendukung akses kamera. Gunakan input kode di bawah.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraActive(true);

        if (window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({
            formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
          });

          const scanNative = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              if (videoRef.current.readyState >= 2) {
                const results = await detector.detect(videoRef.current);
                const raw = results.find((r) => r.rawValue)?.rawValue;
                if (raw) {
                  stopStream();
                  onDetected(raw.trim());
                  return;
                }
              }
            } catch {
              // Ignore single-frame detection errors
            }
            rafId = requestAnimationFrame(() => void scanNative());
          };

          rafId = requestAnimationFrame(() => void scanNative());
        } else {
          // Fallback for iPhone / iOS Safari (supports QR code via jsQR)
          if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
          }
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });

          const scanJsQr = () => {
            if (cancelled || !videoRef.current || !ctx) return;
            const video = videoRef.current;
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
              if (decoded?.data) {
                stopStream();
                onDetected(decoded.data.trim());
                return;
              }
            }
            rafId = requestAnimationFrame(scanJsQr);
          };

          rafId = requestAnimationFrame(scanJsQr);
        }
      } catch {
        if (!cancelled) {
          setCameraError(
            "Kamera tidak tersedia atau izin ditolak. Ketik atau pindai kode di kolom bawah.",
          );
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, onDetected]);

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    onDetected(trimmed);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} widthClass="w-[460px]">
      <p className="text-[11px] text-[#6B7280]">{description}</p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#111827]">
        <div className={cameraActive ? "relative aspect-[4/3] w-full" : "hidden"}>
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-40 w-40 rounded-2xl border-2 border-[#DC2626] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        </div>
        {!cameraActive && (
          <div className="grid aspect-[16/9] place-items-center p-6 text-center text-white/75">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/10">
                <Icon name="barcode" size={22} />
              </div>
              <p className="mt-3 text-[11px]">{cameraError ?? "Menghubungkan kamera..."}</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
        <Input
          label="Kode Barcode / QR"
          placeholder="Contoh: 8991001000011"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          rightElement={<Icon name="barcode" size={16} className="text-[#6B7280]" />}
        />

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" primary disabled={!manualCode.trim()}>
            Gunakan Kode
          </Button>
        </div>
      </form>
    </Modal>
  );
}
