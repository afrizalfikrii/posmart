import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: IconName;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  icon = "alert",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} widthClass="w-[380px]" hideCloseButton>
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
        <Icon name={icon} size={20} />
      </div>
      <h3 className="text-[15px] font-bold text-[#111827]">{title}</h3>
      <p className="mt-2 text-[11px] text-[#6B7280]">{description}</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={loading}>
          {loading ? "Memproses..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
