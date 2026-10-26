<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetTransfer;
use App\Models\ConditionHistory;
use App\Models\StatusHistory;
use App\Models\ActivityLog;
use App\Imports\AssetImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;

class AssetController extends Controller
{
    /**
     * Get the unit scope for the current user.
     * SuperAdmin/Admin Unit see all, Operator sees only their unit.
     */
    private function applyUnitScope($query, $request)
    {
        $user = auth()->user();

        if ($user->isOperator() && $user->unit_id) {
            // Operator only sees assets in their own unit
            $query->where('unit_id', $user->unit_id);
        } elseif ($request->has('unit_id') && $request->unit_id) {
            // Optional filter by unit_id (for admins or borrowers selecting a unit)
            $query->where('unit_id', $request->unit_id);
        }

        return $query;
    }

    /**
     * List assets (filtered by role scope)
     * Admin Unit: sees all (gudang + all units)
     * Operator: sees their unit's assets only
     * Borrower: sees only borrowable assets
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Asset::with(['createdBy', 'updatedBy', 'unit', 'location', 'claimedBy']);

        // Role-based filtering
        if ($user->isOperator() && $user->unit_id) {
            // Operator: only their unit
            $query->where('unit_id', $user->unit_id);
        } elseif (in_array($user->role, ['BORROWER', 'GUEST'])) {
            // Borrowers only see borrowable assets
            $query->where('is_borrowable', true)->where('status', 'TERSEDIA');
        } else {
            // Admin: optional unit filter, exclude gudang by default unless asked
            if ($request->has('unit_id') && $request->unit_id) {
                $query->where('unit_id', $request->unit_id);
            }
            if ($request->has('include_gudang') && $request->include_gudang === 'true') {
                // Include gudang assets
            } else if (!$request->has('unit_id')) {
                // By default exclude gudang for admin (they use /gudang endpoint)
                $query->where('status', '!=', 'GUDANG');
            }
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama_barang', 'LIKE', "%{$search}%")
                  ->orWhere('kode_barang', 'LIKE', "%{$search}%")
                  ->orWhere('kode_register', 'LIKE', "%{$search}%")
                  ->orWhere('merk', 'LIKE', "%{$search}%");
            });
        }

        // Filters
        if ($request->has('jenis_bmn') && $request->jenis_bmn) {
            $query->where('jenis_bmn', $request->jenis_bmn);
        }
        if ($request->has('kondisi') && $request->kondisi) {
            $query->where('kondisi', $request->kondisi);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('is_borrowable')) {
            $query->where('is_borrowable', $request->is_borrowable === 'true');
        }
        if ($request->has('location_id') && $request->location_id) {
            $query->where('location_id', $request->location_id);
        }

        // Pagination
        $limit = $request->get('limit', 25);
        $assets = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $assets->items(),
            'pagination' => [
                'total' => $assets->total(),
                'page' => $assets->currentPage(),
                'limit' => $assets->perPage(),
                'totalPages' => $assets->lastPage()
            ]
        ]);
    }

    /**
     * Show single asset with full details
     */
    public function show($id)
    {
        $asset = Asset::with([
            'createdBy', 'updatedBy', 'unit', 'location', 'claimedBy',
            'loans.borrower', 'transfers.fromUnit', 'transfers.toUnit'
        ])->find($id);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Aset tidak ditemukan'
            ], 404);
        }

        // Check unit access for operator
        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $asset->unit_id !== $user->unit_id && $asset->status !== 'GUDANG') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke aset ini'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $asset
        ]);
    }

    /**
     * Create a new asset manually (goes to Gudang by default)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_barang' => 'required|string|max:255',
            'kode_barang' => 'nullable|string|max:255',
            'kode_register' => 'nullable|string|unique:assets,kode_register',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $user = auth()->user();

        // Build asset data from request
        $data = $request->only([
            'kode_register', 'no_urut', 'jenis_bmn', 'kode_satker', 'nama_satker',
            'kode_barang', 'nup', 'nama_barang', 'merk', 'tipe', 'kondisi',
            'umur_aset', 'intra_ekstra', 'henti_guna', 'status_sbsn', 'status_bmn_idle',
            'status_kemitraan', 'bpybds', 'usulan_barang_hilang', 'usulan_barang_rb',
            'usul_hapus', 'hibah_dktp', 'konsensi_jasa', 'properti_investasi',
            'jenis_dokumen', 'no_dokumen', 'no_bpkp', 'no_polisi', 'kepemilikan',
            'no_sertifikat', 'tanggal_buku_pertama', 'tanggal_perolehan', 'tanggal_penghapusan',
            'nilai_mutasi', 'nilai_perolehan', 'nilai_penyusutan', 'nilai_buku',
            'luas_tanah_seluruhnya', 'luas_tanah_bangunan', 'luas_tanah_sarana_lingkungan',
            'luas_lahan_kosong', 'luas_bangunan', 'luas_tapak_bangunan', 'luas_pemanfaatan',
            'jumlah_lantai', 'jumlah_foto', 'status_penggunaan', 'no_psp', 'tanggal_psp',
            'alamat', 'rt_rw', 'kelurahan_desa', 'kecamatan', 'kab_kota',
            'kode_kab_kota', 'provinsi', 'kode_provinsi', 'kode_pos',
            'sbsk', 'optimalisasi', 'penghuni', 'pengguna_bmn',
            'kode_kpknl', 'uraian_kpknl', 'uraian_kanwil_djkn',
            'nama_kl', 'nama_e1', 'nama_korwil', 'lokasi_ruang',
            'unit_id', 'location_id', 'notes',
        ]);

        // If admin adds with unit_id, set status TERSEDIA, otherwise GUDANG
        $data['status'] = !empty($data['unit_id']) ? 'TERSEDIA' : 'GUDANG';
        $data['is_borrowable'] = false;
        $data['kondisi'] = $data['kondisi'] ?? 'Baik';
        $data['created_by_id'] = $user->id;

        $asset = Asset::create($data);

        // Create initial condition history
        ConditionHistory::create([
            'asset_id' => $asset->id,
            'condition' => $asset->kondisi,
            'notes' => 'Kondisi awal saat dibuat',
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        // Status history
        StatusHistory::create([
            'asset_id' => $asset->id,
            'status' => $asset->status,
            'notes' => 'Status awal saat dibuat',
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'CREATE_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => "{$user->name} menambahkan aset {$asset->nama_barang}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil ditambahkan',
            'data' => $asset->load(['createdBy', 'unit', 'location'])
        ], 201);
    }

    /**
     * Update an existing asset
     */
    public function update(Request $request, $id)
    {
        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Aset tidak ditemukan'
            ], 404);
        }

        // Operator can only update assets in their unit
        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $asset->unit_id !== $user->unit_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengubah aset ini'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'kode_register' => 'nullable|string|unique:assets,kode_register,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $updateData = $request->only([
            'kode_register', 'no_urut', 'jenis_bmn', 'kode_satker', 'nama_satker',
            'kode_barang', 'nup', 'nama_barang', 'merk', 'tipe', 'kondisi',
            'umur_aset', 'intra_ekstra', 'henti_guna', 'status_sbsn', 'status_bmn_idle',
            'status_kemitraan', 'bpybds', 'usulan_barang_hilang', 'usulan_barang_rb',
            'usul_hapus', 'hibah_dktp', 'konsensi_jasa', 'properti_investasi',
            'jenis_dokumen', 'no_dokumen', 'no_bpkp', 'no_polisi', 'kepemilikan',
            'no_sertifikat', 'tanggal_buku_pertama', 'tanggal_perolehan', 'tanggal_penghapusan',
            'nilai_mutasi', 'nilai_perolehan', 'nilai_penyusutan', 'nilai_buku',
            'luas_tanah_seluruhnya', 'luas_tanah_bangunan', 'luas_tanah_sarana_lingkungan',
            'luas_lahan_kosong', 'luas_bangunan', 'luas_tapak_bangunan', 'luas_pemanfaatan',
            'jumlah_lantai', 'jumlah_foto', 'status_penggunaan', 'no_psp', 'tanggal_psp',
            'alamat', 'rt_rw', 'kelurahan_desa', 'kecamatan', 'kab_kota',
            'kode_kab_kota', 'provinsi', 'kode_provinsi', 'kode_pos',
            'sbsk', 'optimalisasi', 'penghuni', 'pengguna_bmn',
            'kode_kpknl', 'uraian_kpknl', 'uraian_kanwil_djkn',
            'nama_kl', 'nama_e1', 'nama_korwil', 'lokasi_ruang',
            'unit_id', 'location_id', 'notes',
        ]);

        // Handle file upload
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/assets'), $filename);
            $updateData['photo'] = '/uploads/assets/' . $filename;
        }

        $updateData['updated_by_id'] = $user->id;
        $asset->update($updateData);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'UPDATE_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => "{$user->name} mengupdate aset {$asset->nama_barang}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil diupdate',
            'data' => $asset->load(['createdBy', 'updatedBy', 'unit', 'location'])
        ]);
    }

    // ===================================================================
    //  IMPORT EXCEL (Prioritas utama dosen!)
    // ===================================================================

    /**
     * Import assets from Excel file
     * All imported assets go to GUDANG with is_borrowable = false
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:20480', // max 20MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $import = new AssetImport(auth()->id());

            Excel::import($import, $request->file('file'));

            ActivityLog::create([
                'user_id' => auth()->id(),
                'action' => 'IMPORT_ASSETS',
                'entity' => 'Asset',
                'entity_id' => null,
                'description' => auth()->user()->name . " mengimport {$import->getImportedCount()} aset dari Excel",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Import berhasil! {$import->getImportedCount()} aset diimport.",
                'data' => [
                    'total_processed' => $import->getRowCount(),
                    'imported' => $import->getImportedCount(),
                    'skipped' => $import->getSkippedCount(),
                    'errors' => $import->getErrors(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal import: ' . $e->getMessage()
            ], 500);
        }
    }

    // ===================================================================
    //  GUDANG — List aset yang belum diklaim
    // ===================================================================

    /**
     * List assets in Gudang (unit_id = null, status = GUDANG)
     * Accessible by Admin Unit + Operator
     */
    public function gudang(Request $request)
    {
        $query = Asset::gudang()->with(['createdBy']);

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama_barang', 'LIKE', "%{$search}%")
                  ->orWhere('kode_barang', 'LIKE', "%{$search}%")
                  ->orWhere('merk', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('jenis_bmn') && $request->jenis_bmn) {
            $query->where('jenis_bmn', $request->jenis_bmn);
        }

        if ($request->has('kondisi') && $request->kondisi) {
            $query->where('kondisi', $request->kondisi);
        }

        $limit = $request->get('limit', 25);
        $assets = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $assets->items(),
            'pagination' => [
                'total' => $assets->total(),
                'page' => $assets->currentPage(),
                'limit' => $assets->perPage(),
                'totalPages' => $assets->lastPage()
            ]
        ]);
    }

    // ===================================================================
    //  KLAIM — Operator klaim aset dari gudang ke unit-nya
    // ===================================================================

    /**
     * Operator claims an asset from Gudang to their unit
     * First come first served — no approval needed
     */
    public function claim(Request $request, $id)
    {
        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        if ($asset->status !== 'GUDANG') {
            return response()->json(['success' => false, 'message' => 'Aset ini sudah diklaim atau tidak ada di gudang'], 400);
        }

        $user = auth()->user();

        if (!$user->unit_id) {
            return response()->json(['success' => false, 'message' => 'Anda belum terdaftar di unit manapun'], 400);
        }

        // Claim the asset
        $asset->update([
            'unit_id' => $user->unit_id,
            'status' => 'TERSEDIA',
            'claimed_by_id' => $user->id,
            'claimed_at' => now(),
            'updated_by_id' => $user->id,
        ]);

        StatusHistory::create([
            'asset_id' => $asset->id,
            'status' => 'TERSEDIA',
            'notes' => "Diklaim oleh {$user->name} ke unit {$user->unit->name}",
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'CLAIM_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => "{$user->name} mengklaim aset {$asset->nama_barang} ke unit {$user->unit->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Aset berhasil diklaim ke unit {$user->unit->name}",
            'data' => $asset->load(['unit', 'claimedBy'])
        ]);
    }

    // ===================================================================
    //  ADMIN ASSIGN — Admin langsung assign aset ke unit
    // ===================================================================

    /**
     * Admin Unit assigns an asset from Gudang to a specific unit
     */
    public function assignToUnit(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'unit_id' => 'required|exists:units,id',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        if ($asset->status !== 'GUDANG') {
            return response()->json(['success' => false, 'message' => 'Aset ini tidak di gudang'], 400);
        }

        $user = auth()->user();

        $asset->update([
            'unit_id' => $request->unit_id,
            'location_id' => $request->location_id,
            'status' => 'TERSEDIA',
            'updated_by_id' => $user->id,
        ]);

        StatusHistory::create([
            'asset_id' => $asset->id,
            'status' => 'TERSEDIA',
            'notes' => "Ditugaskan ke unit oleh admin {$user->name}",
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'ASSIGN_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => "{$user->name} menugaskan aset {$asset->nama_barang} ke unit",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil ditugaskan ke unit',
            'data' => $asset->load(['unit', 'location'])
        ]);
    }

    // ===================================================================
    //  BORROWABLE — Admin set apakah aset bisa dipinjam
    // ===================================================================

    /**
     * Toggle is_borrowable flag (Admin Unit only)
     */
    public function toggleBorrowable(Request $request, $id)
    {
        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        if ($asset->status === 'GUDANG') {
            return response()->json(['success' => false, 'message' => 'Aset di gudang tidak bisa diatur peminjamannya'], 400);
        }

        $asset->update([
            'is_borrowable' => !$asset->is_borrowable,
            'updated_by_id' => auth()->id(),
        ]);

        $status = $asset->is_borrowable ? 'bisa dipinjam' : 'tidak bisa dipinjam';

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'TOGGLE_BORROWABLE',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => auth()->user()->name . " mengubah status peminjaman aset {$asset->nama_barang} menjadi {$status}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Aset sekarang {$status}",
            'data' => $asset
        ]);
    }

    // ===================================================================
    //  RENTAL PRICE — Operator set harga sewa
    // ===================================================================

    /**
     * Set rental price and unit (Operator only, only for borrowable assets in their unit)
     */
    public function setRentalPrice(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'rental_price' => 'required|numeric|min:0',
            'rental_unit' => 'required|in:per_jam,per_hari,per_minggu,per_bulan',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $asset = Asset::find($id);
        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        $user = auth()->user();

        // Operator can only set price for their unit's assets
        if ($user->isOperator() && $asset->unit_id !== $user->unit_id) {
            return response()->json(['success' => false, 'message' => 'Bukan aset unit Anda'], 403);
        }

        $asset->update([
            'rental_price' => $request->rental_price,
            'rental_unit' => $request->rental_unit,
            'updated_by_id' => $user->id,
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'SET_RENTAL_PRICE',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => "{$user->name} mengatur harga sewa aset {$asset->nama_barang}: Rp " . number_format($request->rental_price) . " {$request->rental_unit}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Harga sewa berhasil diatur',
            'data' => $asset
        ]);
    }

    // ===================================================================
    //  CONDITION & STATUS UPDATES
    // ===================================================================

    public function updateCondition(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'kondisi' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $asset = Asset::find($id);
        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $asset->unit_id !== $user->unit_id) {
            return response()->json(['success' => false, 'message' => 'Anda tidak memiliki akses ke aset ini'], 403);
        }

        $asset->update([
            'kondisi' => $request->kondisi,
            'updated_by_id' => $user->id,
        ]);

        ConditionHistory::create([
            'asset_id' => $asset->id,
            'condition' => $request->kondisi,
            'notes' => $request->notes,
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'UPDATE_ASSET_CONDITION',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => "{$user->name} mengubah kondisi aset {$asset->nama_barang} menjadi {$request->kondisi}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kondisi aset berhasil diupdate',
            'data' => $asset
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $asset = Asset::find($id);
        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $asset->unit_id !== $user->unit_id) {
            return response()->json(['success' => false, 'message' => 'Anda tidak memiliki akses ke aset ini'], 403);
        }

        $asset->update([
            'status' => $request->status,
            'updated_by_id' => $user->id,
        ]);

        StatusHistory::create([
            'asset_id' => $asset->id,
            'status' => $request->status,
            'notes' => $request->notes,
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'UPDATE_ASSET_STATUS',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => "{$user->name} mengubah status aset {$asset->nama_barang} menjadi {$request->status}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status aset berhasil diupdate',
            'data' => $asset
        ]);
    }

    // ===================================================================
    //  TRANSFER (Legacy — keep for backward compat, will be enhanced)
    // ===================================================================

    public function transfer(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'to_unit_id' => 'required|exists:units,id',
            'to_location_id' => 'nullable|exists:locations,id',
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $asset = Asset::find($id);
        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        if ($asset->unit_id == $request->to_unit_id) {
            return response()->json(['success' => false, 'message' => 'Unit tujuan sama dengan unit asal'], 400);
        }

        $hasActiveLoans = $asset->loans()->whereIn('status', ['AKTIF', 'DISETUJUI'])->exists();
        if ($hasActiveLoans) {
            return response()->json(['success' => false, 'message' => 'Tidak dapat memindahkan aset yang sedang dipinjam'], 400);
        }

        $fromUnitId = $asset->unit_id;
        $fromLocationId = $asset->location_id;

        AssetTransfer::create([
            'asset_id' => $asset->id,
            'from_unit_id' => $fromUnitId,
            'to_unit_id' => $request->to_unit_id,
            'from_location_id' => $fromLocationId,
            'to_location_id' => $request->to_location_id,
            'reason' => $request->reason,
            'transferred_by' => auth()->id(),
            'transferred_at' => now(),
        ]);

        $asset->update([
            'unit_id' => $request->to_unit_id,
            'location_id' => $request->to_location_id,
            'status' => 'TERSEDIA',
            'updated_by_id' => auth()->id(),
        ]);

        StatusHistory::create([
            'asset_id' => $asset->id,
            'status' => 'TERSEDIA',
            'notes' => "Dipindahkan: {$request->reason}",
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'TRANSFER_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => auth()->user()->name . " memindahkan aset {$asset->nama_barang} ke unit baru",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil dipindahkan',
            'data' => $asset->load(['unit', 'location'])
        ]);
    }

    // ===================================================================
    //  DELETE
    // ===================================================================

    public function destroy(Request $request, $id)
    {
        $asset = Asset::with('loans')->find($id);

        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        $hasActiveLoans = $asset->loans()->whereIn('status', ['AKTIF', 'DISETUJUI'])->exists();
        if ($hasActiveLoans) {
            return response()->json(['success' => false, 'message' => 'Tidak dapat menghapus aset yang sedang dipinjam'], 400);
        }

        $assetName = $asset->nama_barang;
        $asset->delete();

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'DELETE_ASSET',
            'entity' => 'Asset',
            'entity_id' => $id,
            'description' => auth()->user()->name . " menghapus aset {$assetName}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil dihapus'
        ]);
    }

    // ===================================================================
    //  HISTORY
    // ===================================================================

    public function history($id)
    {
        $conditionHistories = ConditionHistory::where('asset_id', $id)
            ->orderBy('changed_at', 'desc')
            ->get();

        $statusHistories = StatusHistory::where('asset_id', $id)
            ->orderBy('changed_at', 'desc')
            ->get();

        $transfers = AssetTransfer::with(['fromUnit', 'toUnit', 'fromLocation', 'toLocation', 'transferredByUser'])
            ->where('asset_id', $id)
            ->orderBy('transferred_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'conditionHistory' => $conditionHistories,
                'statusHistory' => $statusHistories,
                'transfers' => $transfers,
            ]
        ]);
    }
}
