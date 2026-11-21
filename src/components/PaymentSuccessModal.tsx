import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import type { Transaction } from "@/types";
import { formatRupiah } from "@/utils/format";

interface PaymentSuccessModalProps {
  transaction: Transaction | null;
  onNewTransaction: () => void;
  onPrint: () => void;
}

export function PaymentSuccessModal({
  transaction,
  onNewTransaction,
  onPrint,
}: PaymentSuccessModalProps) {
  if (!transaction) return null;

  return (
    <Modal
      open={Boolean(transaction)}
      onClose={onNewTransaction}
      widthClass="w-[480px]"
      hideCloseButton
    >
      <div className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
          <Icon name="check" size={42} />
        </div>
        <h2 className="mt-5 text-[23px] font-bold">Pembayaran Berhasil</h2>
        <p className="mt-2 text-[10px] text-[#6B7280]">
          Transaksi {transaction.invoiceNumber} telah selesai
        </p>

        <p className="mt-5 text-[11px] text-[#6B7280]">Total pembayaran</p>
        <p className="mt-1 text-[28px] font-bold">{formatRupiah(transaction.total)}</p>

        <div className="mx-auto mt-5 grid max-w-[320px] grid-cols-2 gap-3 rounded-xl bg-[#F9FAFB] p-4 text-left text-[10px]">
          <div>
            <p className="text-[#9CA3AF]">Metode</p>
            <b className="mt-1 block">{transaction.paymentMethod}</b>
          </div>
          <div>
            <p className="text-[#9CA3AF]">Kembalian</p>
            <b className="mt-1 block text-[#16A34A]">{formatRupiah(transaction.change)}</b>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11" icon="print" onClick={onPrint}>
            Cetak Struk
          </Button>
          <Button primary className="h-11" onClick={onNewTransaction}>
            Transaksi Baru
          </Button>
        </div>
      </div>
    </Modal>
  );
}
