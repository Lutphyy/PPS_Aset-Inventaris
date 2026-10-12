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
                'code' => 'TI-LAPTOP-001',
                'name' => 'Laptop Dell Latitude 5420',
                'category' => 'Elektronik',
                'description' => 'Laptop untuk praktikum pemrograman',
                'unit_id' => $unitTI->id,
                'location_id' => $locLabKomTI->id,
                'purchase_year' => 2023,
                'purchase_price' => 15000000,
                'rental_price_per_day' => 100000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'TI-PROYEKTOR-001',
                'name' => 'Proyektor Epson EB-X41',
                'category' => 'Elektronik',
                'description' => 'Proyektor untuk presentasi lab',
                'unit_id' => $unitTI->id,
                'location_id' => $locLabKomTI->id,
                'purchase_year' => 2022,
                'purchase_price' => 5000000,
                'rental_price_per_day' => 50000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'TI-SWITCH-001',
                'name' => 'Cisco Switch 24 Port',
                'category' => 'Elektronik',
                'description' => 'Switch untuk praktikum jaringan',
                'unit_id' => $unitTI->id,
                'location_id' => $locLabJarTI->id,
                'purchase_year' => 2023,
                'purchase_price' => 8000000,
                'rental_price_per_day' => 75000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            // --- Unit SI ---
            [
                'code' => 'SI-PC-001',
                'name' => 'PC All-in-One Lenovo',
                'category' => 'Elektronik',
                'description' => 'PC untuk lab SI',
                'unit_id' => $unitSI->id,
                'location_id' => $locLabSI->id,
                'purchase_year' => 2023,
                'purchase_price' => 12000000,
                'rental_price_per_day' => 80000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            // --- Unit Kimia ---
            [
                'code' => 'KIM-MIKROSKOP-001',
                'name' => 'Mikroskop Olympus CX23',
                'category' => 'Peralatan Laboratorium',
                'description' => 'Mikroskop untuk pengamatan sampel kimia',
                'unit_id' => $unitKimia->id,
                'location_id' => $locLabKimia->id,
                'purchase_year' => 2022,
                'purchase_price' => 25000000,
                'rental_price_per_day' => 150000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'KIM-TIMBANGAN-001',
                'name' => 'Timbangan Analitik Mettler',
                'category' => 'Peralatan Laboratorium',
                'description' => 'Timbangan presisi untuk lab kimia',
                'unit_id' => $unitKimia->id,
                'location_id' => $locLabKimiaOrganik->id,
                'purchase_year' => 2021,
                'purchase_price' => 18000000,
                'rental_price_per_day' => 120000,
                'status' => 'TERSEDIA',
                'condition' => 'CUKUP',
            ],
            // --- Unit Sipil ---
            [
                'code' => 'TSIP-THEODOLITE-001',
                'name' => 'Theodolite Topcon DT-209',
                'category' => 'Peralatan Laboratorium',
                'description' => 'Alat ukur tanah untuk praktikum sipil',
                'unit_id' => $unitSipil->id,
                'location_id' => $locLabSipil->id,
                'purchase_year' => 2022,
                'purchase_price' => 35000000,
                'rental_price_per_day' => 200000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'TSIP-HAMMER-001',
                'name' => 'Schmidt Hammer',
                'category' => 'Peralatan Laboratorium',
                'description' => 'Alat uji kekerasan beton',
                'unit_id' => $unitSipil->id,
                'location_id' => $locLabSipil->id,
                'purchase_year' => 2021,
                'purchase_price' => 12000000,
                'rental_price_per_day' => 80000,
                'status' => 'DALAM_PERBAIKAN',
                'condition' => 'RUSAK_RINGAN',
                'notes' => 'Sedang dalam perbaikan komponen pengujian',
            ],
            // --- Unit Elektro ---
            [
                'code' => 'TE-OSCILLO-001',
                'name' => 'Oscilloscope Rigol DS1054Z',
                'category' => 'Elektronik',
                'description' => 'Oscilloscope 4 channel untuk lab elektronika',
                'unit_id' => $unitElektro->id,
                'location_id' => $locLabElektro->id,
                'purchase_year' => 2023,
                'purchase_price' => 7000000,
                'rental_price_per_day' => 60000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
        ];

        foreach ($assets as $assetData) {
            $asset = Asset::create(array_merge($assetData, [
                'created_by_id' => $superAdmin->id,
            ]));

            // Create initial condition history
            ConditionHistory::create([
                'asset_id' => $asset->id,
                'condition' => $asset->condition,
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
