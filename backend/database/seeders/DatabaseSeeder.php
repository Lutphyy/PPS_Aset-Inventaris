<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Asset;
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
        // Create Users
        $superAdmin = User::create([
            'email' => 'admin@pps.ac.id',
            'password' => Hash::make('admin123'),
            'name' => 'Super Admin',
            'phone' => '081234567890',
            'role' => 'SUPER_ADMIN',
            'unit' => 'IT',
            'is_active' => true,
            'is_guest' => false,
        ]);

        $adminUnit = User::create([
            'email' => 'admin.unit@pps.ac.id',
            'password' => Hash::make('admin123'),
            'name' => 'Admin Unit Teknik',
            'phone' => '081234567891',
            'role' => 'ADMIN_UNIT',
            'unit' => 'Teknik',
            'is_active' => true,
            'is_guest' => false,
        ]);

        $operator = User::create([
            'email' => 'operator@pps.ac.id',
            'password' => Hash::make('operator123'),
            'name' => 'Operator',
            'phone' => '081234567892',
            'role' => 'OPERATOR',
            'unit' => 'Umum',
            'is_active' => true,
            'is_guest' => false,
        ]);

        $borrower = User::create([
            'email' => 'peminjam@pps.ac.id',
            'password' => Hash::make('peminjam123'),
            'name' => 'Budi Santoso',
            'phone' => '081234567893',
            'role' => 'BORROWER',
            'unit' => 'Mahasiswa',
            'is_active' => true,
            'is_guest' => false,
        ]);

        $viewer = User::create([
            'email' => 'viewer@pps.ac.id',
            'password' => Hash::make('viewer123'),
            'name' => 'Viewer',
            'phone' => '081234567894',
            'role' => 'VIEWER',
            'unit' => 'Akademik',
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

        // Create Assets
        $assets = [
            [
                'code' => 'LAPTOP-001',
                'name' => 'Laptop Dell Latitude 5420',
                'category' => 'Elektronik',
                'description' => 'Laptop untuk pekerjaan office dengan spesifikasi tinggi',
                'unit' => 'IT',
                'location' => 'Gedung A',
                'floor' => '2',
                'purchase_year' => 2023,
                'purchase_price' => 15000000,
                'rental_price_per_day' => 100000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'PROYEKTOR-001',
                'name' => 'Proyektor Epson EB-X41',
                'category' => 'Elektronik',
                'description' => 'Proyektor untuk presentasi dan pembelajaran',
                'unit' => 'Akademik',
                'location' => 'Gedung B',
                'floor' => '1',
                'purchase_year' => 2022,
                'purchase_price' => 5000000,
                'rental_price_per_day' => 50000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'KAMERA-001',
                'name' => 'Kamera DSLR Canon EOS 90D',
                'category' => 'Elektronik',
                'description' => 'Kamera untuk dokumentasi acara kampus',
                'unit' => 'Media',
                'location' => 'Gedung C',
                'floor' => '3',
                'purchase_year' => 2023,
                'purchase_price' => 20000000,
                'rental_price_per_day' => 150000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'MEJA-001',
                'name' => 'Meja Rapat Kayu Jati',
                'category' => 'Furniture',
                'description' => 'Meja rapat untuk 10 orang',
                'unit' => 'Umum',
                'location' => 'Gedung A',
                'floor' => '1',
                'purchase_year' => 2021,
                'purchase_price' => 8000000,
                'rental_price_per_day' => 30000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'AC-001',
                'name' => 'AC Split Daikin 1.5 PK',
                'category' => 'Elektronik',
                'description' => 'AC untuk ruang kelas',
                'unit' => 'Teknik',
                'location' => 'Gedung B',
                'floor' => '2',
                'purchase_year' => 2022,
                'purchase_price' => 4500000,
                'rental_price_per_day' => 40000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'PRINTER-001',
                'name' => 'Printer HP LaserJet Pro M404dn',
                'category' => 'Elektronik',
                'description' => 'Printer laser hitam putih',
                'unit' => 'Administrasi',
                'location' => 'Gedung A',
                'floor' => '1',
                'purchase_year' => 2023,
                'purchase_price' => 6000000,
                'rental_price_per_day' => 25000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'KURSI-001',
                'name' => 'Kursi Kantor Ergonomis',
                'category' => 'Furniture',
                'description' => 'Kursi kantor dengan sandaran tinggi',
                'unit' => 'Umum',
                'location' => 'Gedung C',
                'floor' => '2',
                'purchase_year' => 2022,
                'purchase_price' => 2500000,
                'rental_price_per_day' => 15000,
                'status' => 'TERSEDIA',
                'condition' => 'BAIK',
            ],
            [
                'code' => 'SPEAKER-001',
                'name' => 'Speaker Sound System Yamaha',
                'category' => 'Elektronik',
                'description' => 'Speaker untuk acara besar',
                'unit' => 'Kemahasiswaan',
                'location' => 'Gedung D',
                'floor' => '1',
                'purchase_year' => 2021,
                'purchase_price' => 12000000,
                'rental_price_per_day' => 80000,
                'status' => 'DALAM_PERBAIKAN',
                'condition' => 'RUSAK_RINGAN',
                'notes' => 'Sedang dalam perbaikan komponen audio',
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
        $this->command->info('=== LOGIN CREDENTIALS ===');
        $this->command->info('Super Admin: admin@pps.ac.id / admin123');
        $this->command->info('Admin Unit: admin.unit@pps.ac.id / admin123');
        $this->command->info('Operator: operator@pps.ac.id / operator123');
        $this->command->info('Borrower: peminjam@pps.ac.id / peminjam123');
        $this->command->info('Viewer: viewer@pps.ac.id / viewer123');
        $this->command->info('Guest: guest@example.com / guest123');
        $this->command->info('=========================');
    }
}
