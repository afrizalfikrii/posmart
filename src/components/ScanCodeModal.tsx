import { useEffect, useRef, useState, type FormEvent } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
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

export function ScanCodeModal({
  open,
  onClose,
  onDetected,
  title = "Pindai Barcode / QR Code",
  description = "Arahkan kamera ke barcode (EAN-13/produk) atau QR code, atau ketik kode secara manual.",
}: ScanCodeModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    if (!open) {
      setManualCode("");
      setCameraError(null);
      setCameraActive(false);
      return;
    }

    let cancelled = false;
    let handled = false;

    const cleanup = () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    };

    const startScanner = async () => {
      if (!window.isSecureContext) {
        setCameraError(
          "Kamera hanya bisa aktif lewat HTTPS (atau localhost). Gunakan input kode di bawah.",
        );
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Browser tidak mendukung akses kamera. Gunakan input kode di bawah.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setCameraActive(true);

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.ITF,
          BarcodeFormat.QR_CODE,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 120,
        });

        const controls = await reader.decodeFromStream(stream, videoRef.current, (result) => {
          if (cancelled || handled) return;
          const text = result?.getText()?.trim();
          if (text) {
            handled = true;
            cleanup();
            onDetectedRef.current(text);
          }
        });

        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      } catch {
        if (!cancelled) {
          setCameraError(
            "Kamera tidak tersedia atau izin ditolak. Ketik atau pindai kode di kolom bawah.",
          );
        }
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [open]);

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
            <div className="h-32 w-56 rounded-2xl border-2 border-[#DC2626] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
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
