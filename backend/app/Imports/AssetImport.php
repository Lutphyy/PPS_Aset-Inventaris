<?php

namespace App\Imports;

use App\Models\Asset;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithBatchInserts;

class AssetImport implements ToModel, WithStartRow, WithChunkReading, SkipsEmptyRows, WithBatchInserts
{
    private int $userId;
    private int $importedCount = 0;
    private int $skippedCount = 0;
    private int $rowNumber = 1;
    private array $errors = [];

    /**
     * Mapping: Excel column index => database column name
     * Based on dataset.xlsx header row analysis
     */
    private const COL_MAP = [
        0  => 'no_urut',
        1  => 'jenis_bmn',
        2  => 'kode_satker',
        3  => 'nama_satker',
        4  => 'kode_barang',
        5  => 'nup',
        6  => 'nama_barang',
        7  => 'merk',
        8  => 'tipe',
        9  => 'kondisi',
        10 => 'umur_aset',
        11 => 'intra_ekstra',
        12 => 'henti_guna',
        13 => 'status_sbsn',
        14 => 'status_bmn_idle',
        15 => 'status_kemitraan',
        16 => 'bpybds',
        17 => 'usulan_barang_hilang',
        18 => 'usulan_barang_rb',
        19 => 'usul_hapus',
        20 => 'hibah_dktp',
        21 => 'konsensi_jasa',
        22 => 'properti_investasi',
        23 => 'jenis_dokumen',
        24 => 'no_dokumen',
        25 => 'no_bpkp',
        26 => 'no_polisi',
        27 => 'kepemilikan',
        28 => 'no_sertifikat',
        29 => 'tanggal_buku_pertama',
        30 => 'tanggal_perolehan',
        31 => 'tanggal_penghapusan',
        32 => 'nilai_mutasi',
        33 => 'nilai_perolehan',
        34 => 'nilai_penyusutan',
        35 => 'nilai_buku',
        36 => 'luas_tanah_seluruhnya',
        37 => 'luas_tanah_bangunan',
        38 => 'luas_tanah_sarana_lingkungan',
        39 => 'luas_lahan_kosong',
        40 => 'luas_bangunan',
        41 => 'luas_tapak_bangunan',
        42 => 'luas_pemanfaatan',
        43 => 'jumlah_lantai',
        44 => 'jumlah_foto',
        45 => 'status_penggunaan',
        46 => 'no_psp',
        47 => 'tanggal_psp',
        48 => 'alamat',
        49 => 'rt_rw',
        50 => 'kelurahan_desa',
        51 => 'kecamatan',
        52 => 'kab_kota',
        53 => 'kode_kab_kota',
        54 => 'provinsi',
        55 => 'kode_provinsi',
        56 => 'kode_pos',
        57 => 'sbsk',
        58 => 'optimalisasi',
        59 => 'penghuni',
        60 => 'pengguna_bmn',
        61 => 'kode_kpknl',
        62 => 'uraian_kpknl',
        63 => 'uraian_kanwil_djkn',
        64 => 'nama_kl',
        65 => 'nama_e1',
        66 => 'nama_korwil',
        67 => 'kode_register',
        68 => 'lokasi_ruang',
    ];

    /**
     * Columns that contain numeric (decimal) values
     */
    private const NUMERIC_COLS = [
        'nilai_mutasi', 'nilai_perolehan', 'nilai_penyusutan', 'nilai_buku',
        'luas_tanah_seluruhnya', 'luas_tanah_bangunan', 'luas_tanah_sarana_lingkungan',
        'luas_lahan_kosong', 'luas_bangunan', 'luas_tapak_bangunan', 'luas_pemanfaatan',
    ];

    /**
     * Columns that contain integer values
     */
    private const INTEGER_COLS = [
        'no_urut', 'umur_aset', 'jumlah_lantai', 'jumlah_foto',
    ];

    public function __construct(int $userId)
    {
        $this->userId = $userId;
    }

    /**
     * Start reading data from row 2 (row 1 = header)
     */
    public function startRow(): int
    {
        return 2;
    }

    /**
     * Process in chunks of 500 rows to prevent memory issues
     */
    public function chunkSize(): int
    {
        return 500;
    }

    /**
     * Batch insert 200 rows at a time
     */
    public function batchSize(): int
    {
        return 200;
    }

    /**
     * Process each row from the Excel file
     */
    public function model(array $row)
    {
        $this->rowNumber++;

        // Skip rows with no meaningful data (check nama_barang and kode_barang)
        $namaBarang = $this->clean($row[6] ?? null);
        $kodeBarang = $this->clean($row[4] ?? null);

        if (empty($namaBarang) && empty($kodeBarang)) {
            return null;
        }

        // Check for duplicate by kode_register
        $kodeRegister = $this->clean($row[67] ?? null);
        if ($kodeRegister) {
            $exists = Asset::where('kode_register', $kodeRegister)->exists();
            if ($exists) {
                $this->skippedCount++;
                return null;
            }
        }

        try {
            // Build the asset data from Excel row
            $data = $this->mapRowToAsset($row);

            // Set system defaults for imported assets
            $data['status'] = 'GUDANG';
            $data['is_borrowable'] = false;
            $data['created_by_id'] = $this->userId;

            $this->importedCount++;

            return new Asset($data);
        } catch (\Exception $e) {
            $this->errors[] = [
                'row' => $this->rowNumber,
                'message' => $e->getMessage(),
            ];
            return null;
        }
    }

    /**
     * Map Excel row array to Asset database columns
     */
    private function mapRowToAsset(array $row): array
    {
        $data = [];

        foreach (self::COL_MAP as $index => $column) {
            $rawValue = $row[$index] ?? null;

            if (in_array($column, self::NUMERIC_COLS)) {
                $data[$column] = $this->toNumeric($rawValue);
            } elseif (in_array($column, self::INTEGER_COLS)) {
                $data[$column] = $this->toInteger($rawValue);
            } elseif ($column === 'nup') {
                // NUP bisa integer di Excel, simpan sebagai string
                $data[$column] = $rawValue !== null ? (string) $rawValue : null;
            } else {
                $data[$column] = $this->clean($rawValue);
            }
        }

        // Pastikan nama_barang tidak null
        if (empty($data['nama_barang'])) {
            $data['nama_barang'] = 'Tanpa Nama';
        }

        // Default kondisi jika kosong
        if (empty($data['kondisi'])) {
            $data['kondisi'] = 'Baik';
        }

        return $data;
    }

    /**
     * Clean string value — convert "-" and empty strings to null
     */
    private function clean($value): ?string
    {
        if ($value === null) return null;

        $str = trim((string) $value);

        if ($str === '' || $str === '-') return null;

        return $str;
    }

    /**
     * Convert to numeric (decimal) — handle "-", empty, and string numbers
     */
    private function toNumeric($value): float
    {
        if ($value === null || $value === '' || $value === '-') return 0;

        $num = filter_var($value, FILTER_VALIDATE_FLOAT);

        return $num !== false ? $num : 0;
    }

    /**
     * Convert to integer — handle "-", empty, and string numbers
     */
    private function toInteger($value): int
    {
        if ($value === null || $value === '' || $value === '-') return 0;

        return (int) $value;
    }

    // ===== Statistics Getters =====

    public function getImportedCount(): int
    {
        return $this->importedCount;
    }

    public function getSkippedCount(): int
    {
        return $this->skippedCount;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getRowCount(): int
    {
        return $this->importedCount + $this->skippedCount + count($this->errors);
    }
}
