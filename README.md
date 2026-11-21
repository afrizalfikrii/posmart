# POS Mart POS Dashboard

Aplikasi kasir (Point of Sale) berbasis web untuk UMKM Indonesia (warung kelontong & kedai kopi), dibangun dengan React, TypeScript, Vite, dan Tailwind CSS v4.

## Cara Menjalankan Proyek

```bash
# 1. Pasang dependensi
pnpm install

# 2. Jalankan server pengembangan
pnpm dev

# 3. Build produksi
pnpm build

# 4. Cek tipe TypeScript & format kode
pnpm exec tsc --noEmit
pnpm exec oxfmt --check src
```

## Akun Demo Login

| Peran | Email | PIN | Hak Akses |
| --- | --- | --- | --- |
| **Admin** | `admin@posymart.id` | `123456` | Semua halaman (Kasir, Dasbor, Produk, Riwayat, Laporan, Pengaturan) |
| **Kasir** | `kasir@posymart.id` | `123456` | Kasir, Riwayat, Produk (hanya baca) |

## Struktur Folder

```text
src/
├── assets/         # Aset gambar (sprite produk UMKM)
├── components/     # Komponen UI reusable (Button, Input, Modal, Drawer, Toast, dll.)
├── data/           # Data mock awal (products, categories, transactions, users, settings)
├── layouts/        # Layout bersama (AppLayout dengan Sidebar responsif)
├── pages/          # Halaman aplikasi (Login, Kasir, Dasbor, Produk, Riwayat, Laporan, Pengaturan, 404)
├── services/       # Layer akses data async (saat ini localStorage + simulasi latensi)
├── store/          # State global Zustand (auth, cart, products, transactions, settings, toast)
├── types/          # Definisi tipe TypeScript
└── utils/          # Utilitas (formatRupiah, formatDate, generateInvoiceNumber, analytics)
```

## Integrasi Backend (`/src/services`)

Seluruh komponen dan store hanya mengakses data melalui service layer di `src/services/`. Saat backend API siap, cukup ganti implementasi di file-file berikut tanpa mengubah komponen UI:

1. `src/services/authService.ts`
   - `login(credentials: { identifier: string; pin: string; rememberMe?: boolean }): Promise<AuthSession>`
   - `logout(): Promise<void>`
   - `getCurrentSession(): AuthSession | null`

2. `src/services/productService.ts`
   - `getProducts(): Promise<Product[]>`
   - `getProductById(id: string): Promise<Product | undefined>`
   - `getCategories(): Promise<Category[]>`
   - `createProduct(input: Omit<Product, 'id'>): Promise<Product>`
   - `updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product>`
   - `deleteProduct(id: string): Promise<void>`
   - `deleteProducts(ids: string[]): Promise<void>`
   - `decrementStock(items: { productId: string; qty: number }[]): Promise<Product[]>`
   - `incrementStock(items: { productId: string; qty: number }[]): Promise<Product[]>`

3. `src/services/transactionService.ts`
   - `getTransactions(): Promise<Transaction[]>`
   - `createTransaction(input: Omit<Transaction, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<Transaction>`
   - `updateTransactionStatus(id: string, status: TransactionStatus): Promise<Transaction>`

4. `src/services/settingsService.ts`
   - `getSettings(): Promise<StoreSettings>`
   - `saveSettings(settings: StoreSettings): Promise<StoreSettings>`
