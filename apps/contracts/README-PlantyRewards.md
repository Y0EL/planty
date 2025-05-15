# Planty Rewards Management

Script untuk pengelolaan cycle dan rewards pada kontrak Planty.

## Masalah Error pada Submisi

Jika Anda mengalami error saat submit receipt dengan pesan seperti berikut:
```
Error registering submission and sending rewards
```

Kemungkinan penyebabnya adalah:
1. Cycle saat ini sudah berakhir (perlu trigger cycle baru)
2. Tidak ada rewards yang dialokasikan untuk cycle saat ini
3. User telah mencapai batas maksimum submisi 

## Cara Memeriksa Status Planty

Untuk memeriksa status kontrak Planty, jalankan:

```bash
npx hardhat run scripts/check-planty-cycle.ts --network vechain_testnet
```

Script ini akan menampilkan:
- Informasi cycle saat ini
- Status rewards yang tersedia
- Total submisi dan batas per user
- Rekomendasi tindakan yang perlu dilakukan

## Cara Mengatur Rewards dan Trigger Cycle Baru

Untuk mengatur rewards dan/atau trigger cycle baru, edit file `scripts/set-planty-rewards.ts` dan sesuaikan:

```typescript
// Amount of rewards to set (in B3TR)
const REWARDS_AMOUNT = "100"; // Jumlah B3TR yang ingin dialokasikan
const TRIGGER_NEW_CYCLE = true; // true untuk trigger cycle baru, false jika hanya set rewards
```

Kemudian jalankan script:

```bash
npx hardhat run scripts/set-planty-rewards.ts --network vechain_testnet
```

## Solusi untuk Masalah Umum

### 1. Error "Planty: Max submissions reached for this cycle"

User telah mencapai batas maksimum submisi untuk cycle saat ini. Tunggu cycle berikutnya atau trigger cycle baru dengan script di atas.

### 2. Error "Planty: Cycle is over"

Cycle saat ini sudah berakhir. Jalankan script di atas dengan `TRIGGER_NEW_CYCLE = true` untuk memulai cycle baru.

### 3. Error "Planty: Not enough rewards left"

Tidak ada cukup rewards tersisa untuk cycle saat ini. Jalankan script dengan jumlah rewards yang sesuai.

### 4. Error "Planty: Insufficient balance on the X2EarnRewardsPool contract" 

Contract X2EarnRewardsPool tidak memiliki saldo B3TR yang cukup. Perlu deposit token terlebih dahulu ke kontrak X2EarnRewardsPool.

## Penting

Setiap kali ada masalah dengan submisi receipt, pertama-tama jalankan script `check-planty-cycle.ts` untuk diagnosis otomatis dan rekomendasi yang sesuai.

Jika perlu mengatur rewards untuk beberapa cycle ke depan, sebaiknya setting rewards untuk cycle berikutnya terlebih dahulu sebelum trigger cycle baru. 