<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        // BMN Data from Excel
        'kode_register',
        'no_urut',
        'jenis_bmn',
        'kode_satker',
        'nama_satker',
        'kode_barang',
        'nup',
        'nama_barang',
        'merk',
        'tipe',
        'kondisi',
        'umur_aset',
        'intra_ekstra',
        'henti_guna',
        'status_sbsn',
        'status_bmn_idle',
        'status_kemitraan',
        'bpybds',
        'usulan_barang_hilang',
        'usulan_barang_rb',
        'usul_hapus',
        'hibah_dktp',
        'konsensi_jasa',
        'properti_investasi',
        'jenis_dokumen',
        'no_dokumen',
        'no_bpkp',
        'no_polisi',
        'kepemilikan',
        'no_sertifikat',
        'tanggal_buku_pertama',
        'tanggal_perolehan',
        'tanggal_penghapusan',
        'nilai_mutasi',
        'nilai_perolehan',
        'nilai_penyusutan',
        'nilai_buku',
        'luas_tanah_seluruhnya',
        'luas_tanah_bangunan',
        'luas_tanah_sarana_lingkungan',
        'luas_lahan_kosong',
        'luas_bangunan',
        'luas_tapak_bangunan',
        'luas_pemanfaatan',
        'jumlah_lantai',
        'jumlah_foto',
        'status_penggunaan',
        'no_psp',
        'tanggal_psp',
        'alamat',
        'rt_rw',
        'kelurahan_desa',
        'kecamatan',
        'kab_kota',
        'kode_kab_kota',
        'provinsi',
        'kode_provinsi',
        'kode_pos',
        'sbsk',
        'optimalisasi',
        'penghuni',
        'pengguna_bmn',
        'kode_kpknl',
        'uraian_kpknl',
        'uraian_kanwil_djkn',
        'nama_kl',
        'nama_e1',
        'nama_korwil',
        'lokasi_ruang',

        // System columns
        'unit_id',
        'location_id',
        'status',
        'is_borrowable',
        'rental_price',
        'rental_unit',
        'photo',
        'notes',
        'claimed_by_id',
        'claimed_at',
        'created_by_id',
        'updated_by_id',
    ];

    protected $casts = [
        'no_urut' => 'integer',
        'umur_aset' => 'integer',
        'nilai_mutasi' => 'decimal:2',
        'nilai_perolehan' => 'decimal:2',
        'nilai_penyusutan' => 'decimal:2',
        'nilai_buku' => 'decimal:2',
        'luas_tanah_seluruhnya' => 'decimal:2',
        'luas_tanah_bangunan' => 'decimal:2',
        'luas_tanah_sarana_lingkungan' => 'decimal:2',
        'luas_lahan_kosong' => 'decimal:2',
        'luas_bangunan' => 'decimal:2',
        'luas_tapak_bangunan' => 'decimal:2',
        'luas_pemanfaatan' => 'decimal:2',
        'jumlah_lantai' => 'integer',
        'jumlah_foto' => 'integer',
        'rental_price' => 'decimal:2',
        'is_borrowable' => 'boolean',
        'claimed_at' => 'datetime',
    ];

    // ===== Relationships =====

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function claimedBy()
    {
        return $this->belongsTo(User::class, 'claimed_by_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by_id');
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function conditionHistories()
    {
        return $this->hasMany(ConditionHistory::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(StatusHistory::class);
    }

    public function transfers()
    {
        return $this->hasMany(AssetTransfer::class);
    }

    public function transferRequests()
    {
        return $this->hasMany(AssetTransferRequest::class);
    }

    // ===== Scopes =====

    /** Aset di Gudang (belum diklaim unit manapun) */
    public function scopeGudang($query)
    {
        return $query->where('status', 'GUDANG');
    }

    /** Aset yang tersedia (sudah di unit) */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'TERSEDIA');
    }

    /** Aset yang bisa dipinjam */
    public function scopeBorrowable($query)
    {
        return $query->where('is_borrowable', true)->where('status', 'TERSEDIA');
    }

    public function scopeBorrowed($query)
    {
        return $query->where('status', 'DIPINJAM');
    }

    public function scopeByUnit($query, $unitId)
    {
        return $query->where('unit_id', $unitId);
    }

    public function scopeByJenisBmn($query, $jenis)
    {
        return $query->where('jenis_bmn', $jenis);
    }

    public function scopeByKondisi($query, $kondisi)
    {
        return $query->where('kondisi', $kondisi);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // ===== Helpers =====

    /** Apakah aset ini di gudang? */
    public function isInGudang(): bool
    {
        return $this->status === 'GUDANG';
    }

    /** Apakah aset ini sudah diklaim oleh unit? */
    public function isClaimed(): bool
    {
        return $this->unit_id !== null && $this->status !== 'GUDANG';
    }

    /** Format harga sewa dengan satuan */
    public function getRentalDisplayAttribute(): string
    {
        if (!$this->rental_price) return '-';
        $unit = str_replace('per_', '/', $this->rental_unit ?? 'per_hari');
        return 'Rp ' . number_format($this->rental_price, 0, ',', '.') . $unit;
    }
}
