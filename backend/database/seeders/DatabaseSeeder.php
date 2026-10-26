<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Asset;
use App\Models\Unit;
use App\Models\Location;
use App\Models\SystemSetting;
use App\Models\ConditionHistory;
use App\Models\StatusHistory;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ========================================
        // Create Units (Program Studi / Prodi)
        // ========================================
        $unitTI = Unit::create([
            'name' => 'Teknik Informatika',
            'code' => 'TI',
            'description' => 'Program Studi Teknik Informatika',
        ]);

        $unitSI = Unit::create([
            'name' => 'Sistem Informasi',
            'code' => 'SI',
            'description' => 'Program Studi Sistem Informasi',
        ]);

        $unitKimia = Unit::create([
            'name' => 'Kimia',
            'code' => 'KIM',
            'description' => 'Program Studi Kimia',
        ]);

        $unitSipil = Unit::create([
            'name' => 'Teknik Sipil',
            'code' => 'TSIP',
            'description' => 'Program Studi Teknik Sipil',
        ]);

        $unitElektro = Unit::create([
            'name' => 'Teknik Elektro',
            'code' => 'TE',
            'description' => 'Program Studi Teknik Elektro',
        ]);

        // ========================================
        // Create Locations per Unit
        // ========================================
        $locLabKomTI = Location::create([
            'name' => 'Lab Komputer 1',
            'unit_id' => $unitTI->id,
            'floor' => '2',
            'description' => 'Laboratorium Komputer utama prodi TI',
        ]);

        $locLabJarTI = Location::create([
            'name' => 'Lab Jaringan',
            'unit_id' => $unitTI->id,
            'floor' => '3',
            'description' => 'Laboratorium Jaringan Komputer',
        ]);

        $locLabSI = Location::create([
            'name' => 'Lab SI',
            'unit_id' => $unitSI->id,
            'floor' => '2',
            'description' => 'Laboratorium Sistem Informasi',
        ]);

        $locLabKimia = Location::create([
            'name' => 'Lab Kimia Dasar',
            'unit_id' => $unitKimia->id,
            'floor' => '1',
            'description' => 'Laboratorium Kimia Dasar',
        ]);

        $locLabKimiaOrganik = Location::create([
            'name' => 'Lab Kimia Organik',
            'unit_id' => $unitKimia->id,
            'floor' => '2',
            'description' => 'Laboratorium Kimia Organik',
        ]);

        $locLabSipil = Location::create([
            'name' => 'Lab Material',
            'unit_id' => $unitSipil->id,
            'floor' => '1',
            'description' => 'Laboratorium Material dan Struktur',
        ]);

        $locLabElektro = Location::create([
            'name' => 'Lab Elektronika',
            'unit_id' => $unitElektro->id,
            'floor' => '1',
            'description' => 'Laboratorium Elektronika Dasar',
        ]);

        // ========================================
        // Create Users
        // ========================================
        $superAdmin = User::create([
            'email' => 'admin@pps.ac.id',
            'password' => Hash::make('admin123'),
            'name' => 'Super Admin (Dekan)',
            'phone' => '081234567890',
            'role' => 'SUPER_ADMIN',
            'unit_id' => null, // SuperAdmin akses semua
            'is_active' => true,
            'is_guest' => false,
        ]);

        $adminUnit = User::create([
            'email' => 'admin.unit@pps.ac.id',
            'password' => Hash::make('admin123'),
            'name' => 'Admin Unit (Staff Dekan)',
            'phone' => '081234567891',
            'role' => 'ADMIN_UNIT',
            'unit_id' => null, // Admin Unit manage semua unit
            'is_active' => true,
            'is_guest' => false,
        ]);

        $operatorTI = User::create([
            'email' => 'operator.ti@pps.ac.id',
            'password' => Hash::make('operator123'),
            'name' => 'Operator Lab TI',
            'phone' => '081234567892',
            'role' => 'OPERATOR',
            'unit_id' => $unitTI->id, // Terikat ke unit TI
            'is_active' => true,
            'is_guest' => false,
        ]);

        $operatorKimia = User::create([
            'email' => 'operator.kimia@pps.ac.id',
            'password' => Hash::make('operator123'),
            'name' => 'Operator Lab Kimia',
            'phone' => '081234567896',
            'role' => 'OPERATOR',
            'unit_id' => $unitKimia->id, // Terikat ke unit Kimia
            'is_active' => true,
            'is_guest' => false,
        ]);

        $operatorSipil = User::create([
            'email' => 'operator.sipil@pps.ac.id',
            'password' => Hash::make('operator123'),
            'name' => 'Operator Lab Sipil',
            'phone' => '081234567897',
            'role' => 'OPERATOR',
            'unit_id' => $unitSipil->id,
            'is_active' => true,
            'is_guest' => false,
        ]);

        $borrower = User::create([
            'email' => 'peminjam@pps.ac.id',
            'password' => Hash::make('peminjam123'),
            'name' => 'Budi Santoso',
            'phone' => '081234567893',
            'role' => 'BORROWER',
            'unit_id' => null,
            'is_active' => true,
            'is_guest' => false,
        ]);

        $viewer = User::create([
            'email' => 'viewer@pps.ac.id',
            'password' => Hash::make('viewer123'),
            'name' => 'Viewer',
            'phone' => '081234567894',
            'role' => 'VIEWER',
            'unit_id' => null,
            'is_active' => true,
            'is_guest' => false,
        ]);

        $guest = User::create([
            'email' => 'guest@example.com',
            'password' => Hash::make('guest123'),
            'name' => 'Guest User',
            'phone' => '081234567895',
            'role' => 'GUEST',
            'is_active' => true,
            'is_guest' => true,
            'identity_number' => '1234567890',
            'address' => 'Jalan Contoh No. 123',
            'verification_status' => 'TERVERIFIKASI',
            'verified_at' => now(),
            'verified_by' => $superAdmin->id,
        ]);

        // ========================================
        // Create Assets (per unit)
        // ========================================
        $assets = [
            // --- Unit TI ---
            [
                'kode_barang' => '3050201003',
                'nup' => '1',
                'nama_barang' => 'Laptop Dell Latitude 5420',
                'jenis_bmn' => 'MESIN PERALATAN KHUSUS TIK',
                'merk' => 'Dell',
                'tipe' => 'Latitude 5420',
                'kondisi' => 'Baik',
                'unit_id' => $unitTI->id,
                'location_id' => $locLabKomTI->id,
                'tanggal_perolehan' => '2023-01-15',
                'nilai_perolehan' => 15000000,
                'status' => 'TERSEDIA',
                'is_borrowable' => true,
                'rental_price' => 100000,
                'rental_unit' => 'per_hari',
            ],
            [
                'kode_barang' => '3050201003',
                'nup' => '2',
                'nama_barang' => 'Proyektor Epson EB-X41',
                'jenis_bmn' => 'MESIN PERALATAN KHUSUS TIK',
                'merk' => 'Epson',
                'tipe' => 'EB-X41',
                'kondisi' => 'Baik',
                'unit_id' => $unitTI->id,
                'location_id' => $locLabKomTI->id,
                'tanggal_perolehan' => '2022-06-10',
                'nilai_perolehan' => 5000000,
                'status' => 'TERSEDIA',
                'is_borrowable' => true,
                'rental_price' => 50000,
                'rental_unit' => 'per_hari',
            ],
            [
                'kode_barang' => '3050201003',
                'nup' => '3',
                'nama_barang' => 'Cisco Switch 24 Port',
                'jenis_bmn' => 'INSTALASI DAN JARINGAN',
                'merk' => 'Cisco',
                'tipe' => 'Catalyst 2960',
                'kondisi' => 'Baik',
                'unit_id' => $unitTI->id,
                'location_id' => $locLabJarTI->id,
                'tanggal_perolehan' => '2023-03-20',
                'nilai_perolehan' => 8000000,
                'status' => 'TERSEDIA',
                'is_borrowable' => false, // Internal only
            ],
            // --- Unit SI ---
            [
                'kode_barang' => '3050201001',
                'nup' => '1',
                'nama_barang' => 'PC All-in-One Lenovo',
                'jenis_bmn' => 'MESIN PERALATAN KHUSUS TIK',
                'merk' => 'Lenovo',
                'tipe' => 'IdeaCentre AIO',
                'kondisi' => 'Baik',
                'unit_id' => $unitSI->id,
                'location_id' => $locLabSI->id,
                'tanggal_perolehan' => '2023-02-01',
                'nilai_perolehan' => 12000000,
                'status' => 'TERSEDIA',
                'is_borrowable' => true,
                'rental_price' => 80000,
                'rental_unit' => 'per_hari',
            ],
            // --- Unit Kimia ---
            [
                'kode_barang' => '3060101001',
                'nup' => '1',
                'nama_barang' => 'Mikroskop Olympus CX23',
                'jenis_bmn' => 'MESIN PERALATAN NON TIK',
                'merk' => 'Olympus',
                'tipe' => 'CX23',
                'kondisi' => 'Baik',
                'unit_id' => $unitKimia->id,
                'location_id' => $locLabKimia->id,
                'tanggal_perolehan' => '2022-08-15',
                'nilai_perolehan' => 25000000,
                'status' => 'TERSEDIA',
                'is_borrowable' => true,
                'rental_price' => 150000,
                'rental_unit' => 'per_hari',
            ],
            [
                'kode_barang' => '3060101002',
                'nup' => '1',
                'nama_barang' => 'Timbangan Analitik Mettler',
                'jenis_bmn' => 'MESIN PERALATAN NON TIK',
                'merk' => 'Mettler Toledo',
                'tipe' => 'ME204',
                'kondisi' => 'Rusak Ringan',
                'unit_id' => $unitKimia->id,
                'location_id' => $locLabKimiaOrganik->id,
                'tanggal_perolehan' => '2021-05-10',
                'nilai_perolehan' => 18000000,
                'status' => 'TERSEDIA',
                'is_borrowable' => true,
                'rental_price' => 120000,
                'rental_unit' => 'per_hari',
            ],
            // --- Unit Sipil ---
            [
                'kode_barang' => '3060102001',
                'nup' => '1',
                'nama_barang' => 'Theodolite Topcon DT-209',
                'jenis_bmn' => 'MESIN PERALATAN NON TIK',
                'merk' => 'Topcon',
                'tipe' => 'DT-209',
                'kondisi' => 'Baik',
                'unit_id' => $unitSipil->id,
                'location_id' => $locLabSipil->id,
                'tanggal_perolehan' => '2022-11-01',
                'nilai_perolehan' => 35000000,
                'status' => 'TERSEDIA',
                'is_borrowable' => true,
                'rental_price' => 200000,
                'rental_unit' => 'per_hari',
            ],
            [
                'kode_barang' => '3060102002',
                'nup' => '1',
                'nama_barang' => 'Schmidt Hammer',
                'jenis_bmn' => 'MESIN PERALATAN NON TIK',
                'merk' => 'Proceq',
                'tipe' => 'Original Schmidt',
                'kondisi' => 'Rusak Ringan',
                'unit_id' => $unitSipil->id,
                'location_id' => $locLabSipil->id,
                'tanggal_perolehan' => '2021-03-15',
                'nilai_perolehan' => 12000000,
                'status' => 'DALAM_PERBAIKAN',
                'is_borrowable' => false,
                'notes' => 'Sedang dalam perbaikan komponen pengujian',
            ],
            // --- Unit Elektro ---
            [
                'kode_barang' => '3060103001',
                'nup' => '1',
                'nama_barang' => 'Oscilloscope Rigol DS1054Z',
                'jenis_bmn' => 'MESIN PERALATAN NON TIK',
                'merk' => 'Rigol',
                'tipe' => 'DS1054Z',
                'kondisi' => 'Baik',
                'unit_id' => $unitElektro->id,
                'location_id' => $locLabElektro->id,
                'tanggal_perolehan' => '2023-07-01',
                'nilai_perolehan' => 7000000,
                'status' => 'TERSEDIA',
                'is_borrowable' => true,
                'rental_price' => 60000,
                'rental_unit' => 'per_hari',
            ],
        ];

        foreach ($assets as $assetData) {
            $asset = Asset::create(array_merge($assetData, [
                'created_by_id' => $superAdmin->id,
            ]));

            // Create initial condition history
            ConditionHistory::create([
                'asset_id' => $asset->id,
                'condition' => $asset->kondisi,
                'notes' => 'Kondisi awal saat dibuat (seeder)',
                'changed_by' => $superAdmin->id,
                'changed_at' => now(),
            ]);

            // Create initial status history
            StatusHistory::create([
                'asset_id' => $asset->id,
                'status' => $asset->status,
                'notes' => 'Status awal saat dibuat (seeder)',
                'changed_by' => $superAdmin->id,
                'changed_at' => now(),
            ]);
        }

        // Create System Settings
        $settings = [
            [
                'key' => 'max_loan_days',
                'value' => '30',
                'description' => 'Maksimal hari peminjaman aset',
            ],
            [
                'key' => 'late_fee_per_day',
                'value' => '50000',
                'description' => 'Denda keterlambatan per hari (Rp)',
            ],
            [
                'key' => 'damage_fee_percentage',
                'value' => '50',
                'description' => 'Persentase denda kerusakan dari harga aset (%)',
            ],
            [
                'key' => 'app_name',
                'value' => 'Sistem Pengelola Aset PPS',
                'description' => 'Nama aplikasi',
            ],
            [
                'key' => 'contact_email',
                'value' => 'info@pps.ac.id',
                'description' => 'Email kontak admin',
            ],
            [
                'key' => 'contact_phone',
                'value' => '021-12345678',
                'description' => 'Nomor telepon kontak',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::create($setting);
        }

        $this->command->info('Database seeded successfully!');
        $this->command->info('');
        $this->command->info('=== UNITS ===');
        $this->command->info('Teknik Informatika (TI), Sistem Informasi (SI), Kimia (KIM), Teknik Sipil (TSIP), Teknik Elektro (TE)');
        $this->command->info('');
        $this->command->info('=== LOGIN CREDENTIALS ===');
        $this->command->info('Super Admin (Dekan): admin@pps.ac.id / admin123');
        $this->command->info('Admin Unit (Staff):  admin.unit@pps.ac.id / admin123');
        $this->command->info('Operator TI:         operator.ti@pps.ac.id / operator123');
        $this->command->info('Operator Kimia:      operator.kimia@pps.ac.id / operator123');
        $this->command->info('Operator Sipil:      operator.sipil@pps.ac.id / operator123');
        $this->command->info('Borrower:            peminjam@pps.ac.id / peminjam123');
        $this->command->info('Viewer:              viewer@pps.ac.id / viewer123');
        $this->command->info('Guest:               guest@example.com / guest123');
        $this->command->info('=========================');
    }
}
