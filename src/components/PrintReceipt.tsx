import { createPortal } from "react-dom";
import type { StoreSettings, Transaction } from "@/types";
import { formatDateTime, formatRupiah } from "@/utils/format";

interface PrintReceiptProps {
  transaction: Transaction | null;
  settings: StoreSettings | null;
}

export function PrintReceipt({ transaction, settings }: PrintReceiptProps) {
  if (!transaction) return null;

  const storeName = settings?.storeName ?? "POS Mart";
  const address = settings?.address ?? "Jl. Melati No. 24, Jakarta";
  const phone = settings?.phone ?? "0812 3456 7890";
  const footer = settings?.receiptFooter ?? "Terima kasih telah berbelanja";
  const taxRate = settings?.taxEnabled ? settings.taxRate : 0;
  const paperWidth = settings?.printer.paperSize === "58mm" ? "58mm" : "80mm";

  return createPortal(
    <div className="print-only-receipt" style={{ width: paperWidth }} aria-hidden="true">
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        {settings?.logoUrl && (
          <img
            src={settings.logoUrl}
            alt={storeName}
            style={{
              width: "40px",
              height: "40px",
              objectFit: "contain",
              margin: "0 auto 4px",
            }}
          />
        )}
        <div style={{ fontSize: "15px", fontWeight: "bold" }}>{storeName}</div>
        <div>{address}</div>
        <div>Telp: {phone}</div>
      </div>

      <div
        style={{
          borderTop: "1px dashed #000",
          borderBottom: "1px dashed #000",
          padding: "4px 0",
          marginBottom: "6px",
        }}
      >
        <div>No: {transaction.invoiceNumber}</div>
        <div>Tgl: {formatDateTime(transaction.createdAt)}</div>
        <div>Kasir: {transaction.cashier}</div>
      </div>

      <div style={{ marginBottom: "6px" }}>
        {transaction.items.map((item) => (
          <div key={`${item.productId}-${item.name}`} style={{ marginBottom: "4px" }}>
            <div>{item.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                {item.qty} x {formatRupiah(item.price)}
              </span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px dashed #000",
          paddingTop: "6px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>{formatRupiah(transaction.subtotal)}</span>
        </div>
        {(settings?.showTaxOnReceipt ?? true) && taxRate > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>PPN ({taxRate}%)</span>
            <span>{formatRupiah(transaction.tax)}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "13px",
            marginTop: "4px",
          }}
        >
          <span>Total</span>
          <span>{formatRupiah(transaction.total)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "4px",
          }}
        >
          <span>Metode ({transaction.paymentMethod})</span>
          <span>{formatRupiah(transaction.amountPaid)}</span>
        </div>
        {transaction.change > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Kembalian</span>
            <span>{formatRupiah(transaction.change)}</span>
          </div>
        )}
      </div>

      {transaction.note && (
        <div
          style={{
            borderTop: "1px dashed #000",
            marginTop: "6px",
            paddingTop: "4px",
          }}
        >
          Catatan: {transaction.note}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "10px" }}>{footer}</div>
    </div>,
    document.body,
  );
}
