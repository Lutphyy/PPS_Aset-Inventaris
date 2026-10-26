<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();

            // ===== BMN Data from Excel (69 kolom) =====

            // Identifikasi Utama
            $table->string('kode_register')->nullable()->unique();  // Col 68 - Unique ID per aset
            $table->integer('no_urut')->nullable();                 // Col 1
            $table->string('jenis_bmn')->nullable();                // Col 2
            $table->string('kode_satker')->nullable();              // Col 3
            $table->string('nama_satker')->nullable();              // Col 4
            $table->string('kode_barang')->nullable();              // Col 5
            $table->string('nup')->nullable();                      // Col 6
            $table->string('nama_barang');                           // Col 7 - Nama utama aset

            // Detail Barang
            $table->string('merk')->nullable();                     // Col 8
            $table->string('tipe')->nullable();                     // Col 9
            $table->string('kondisi')->default('Baik');             // Col 10 - Baik/Rusak Ringan/Rusak Berat
            $table->integer('umur_aset')->nullable();               // Col 11
            $table->string('intra_ekstra')->nullable();             // Col 12 - Intra/Ekstra
            $table->string('henti_guna')->nullable();               // Col 13 - Ya/Tidak

            // Status Flags BMN
            $table->string('status_sbsn')->nullable();              // Col 14
            $table->string('status_bmn_idle')->nullable();          // Col 15
            $table->string('status_kemitraan')->nullable();         // Col 16
            $table->string('bpybds')->nullable();                   // Col 17
            $table->string('usulan_barang_hilang')->nullable();     // Col 18
            $table->string('usulan_barang_rb')->nullable();         // Col 19
            $table->string('usul_hapus')->nullable();               // Col 20
            $table->string('hibah_dktp')->nullable();               // Col 21
            $table->string('konsensi_jasa')->nullable();            // Col 22
            $table->string('properti_investasi')->nullable();       // Col 23

            // Dokumen
            $table->string('jenis_dokumen')->nullable();            // Col 24
            $table->string('no_dokumen')->nullable();               // Col 25
            $table->string('no_bpkp')->nullable();                  // Col 26
            $table->string('no_polisi')->nullable();                // Col 27
            $table->string('kepemilikan')->nullable();              // Col 28
            $table->string('no_sertifikat')->nullable();            // Col 29

            // Tanggal
            $table->string('tanggal_buku_pertama')->nullable();     // Col 30
            $table->string('tanggal_perolehan')->nullable();        // Col 31
            $table->string('tanggal_penghapusan')->nullable();      // Col 32

            // Nilai Keuangan
            $table->decimal('nilai_mutasi', 15, 2)->default(0);         // Col 33
            $table->decimal('nilai_perolehan', 15, 2)->default(0);      // Col 34
            $table->decimal('nilai_penyusutan', 15, 2)->default(0);     // Col 35
            $table->decimal('nilai_buku', 15, 2)->default(0);           // Col 36

            // Luas Tanah & Bangunan
            $table->decimal('luas_tanah_seluruhnya', 15, 2)->default(0);          // Col 37
            $table->decimal('luas_tanah_bangunan', 15, 2)->default(0);            // Col 38
            $table->decimal('luas_tanah_sarana_lingkungan', 15, 2)->default(0);   // Col 39
            $table->decimal('luas_lahan_kosong', 15, 2)->default(0);              // Col 40
            $table->decimal('luas_bangunan', 15, 2)->default(0);                  // Col 41
            $table->decimal('luas_tapak_bangunan', 15, 2)->default(0);            // Col 42
            $table->decimal('luas_pemanfaatan', 15, 2)->default(0);               // Col 43
            $table->integer('jumlah_lantai')->default(0);                          // Col 44

            // Foto & Penggunaan
            $table->integer('jumlah_foto')->default(0);             // Col 45
            $table->string('status_penggunaan')->nullable();        // Col 46
            $table->string('no_psp')->nullable();                   // Col 47
            $table->string('tanggal_psp')->nullable();              // Col 48

            // Alamat
            $table->text('alamat')->nullable();                     // Col 49
            $table->string('rt_rw')->nullable();                    // Col 50
            $table->string('kelurahan_desa')->nullable();           // Col 51
            $table->string('kecamatan')->nullable();                // Col 52
            $table->string('kab_kota')->nullable();                 // Col 53
            $table->string('kode_kab_kota')->nullable();            // Col 54
            $table->string('provinsi')->nullable();                 // Col 55
            $table->string('kode_provinsi')->nullable();            // Col 56
            $table->string('kode_pos')->nullable();                 // Col 57

            // Info Lainnya
            $table->string('sbsk')->nullable();                     // Col 58
            $table->string('optimalisasi')->nullable();             // Col 59
            $table->string('penghuni')->nullable();                 // Col 60
            $table->string('pengguna_bmn')->nullable();             // Col 61
            $table->string('kode_kpknl')->nullable();               // Col 62
            $table->string('uraian_kpknl')->nullable();             // Col 63
            $table->string('uraian_kanwil_djkn')->nullable();       // Col 64
            $table->string('nama_kl')->nullable();                  // Col 65
            $table->string('nama_e1')->nullable();                  // Col 66
            $table->string('nama_korwil')->nullable();              // Col 67
            $table->string('lokasi_ruang')->nullable();             // Col 69

            // ===== System / Feature Columns =====

            // Unit & Lokasi (nullable = di Gudang)
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();

            // Status sistem aset
            $table->string('status')->default('GUDANG');
            // Values: GUDANG, TERSEDIA, DIPINJAM, PROSES_TRANSFER, DALAM_PERBAIKAN, RUSAK, DIMUSNAHKAN

            // Peminjaman
            $table->boolean('is_borrowable')->default(false);
            $table->decimal('rental_price', 12, 2)->nullable();
            $table->string('rental_unit')->default('per_hari');
            // Values: per_jam, per_hari, per_minggu, per_bulan

            // File & Catatan
            $table->string('photo')->nullable();
            $table->text('notes')->nullable();

            // Tracking
            $table->foreignId('claimed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('claimed_at')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
