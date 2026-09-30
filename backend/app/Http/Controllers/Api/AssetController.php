<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\ConditionHistory;
use App\Models\StatusHistory;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $query = Asset::with(['createdBy', 'updatedBy']);

        // Filters
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }

        if ($request->has('location')) {
            $query->where('location', 'LIKE', "%{$request->location}%");
        }

        if ($request->has('unit')) {
            $query->where('unit', 'LIKE', "%{$request->unit}%");
        }

        // Pagination
        $page = $request->get('page', 1);
        $limit = $request->get('limit', 10);

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

    public function show($id)
    {
        $asset = Asset::with(['createdBy', 'updatedBy', 'loans.borrower'])->find($id);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Aset tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $asset
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:assets,code',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'unit' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'rental_price_per_day' => 'required|numeric|min:0',
            'photo' => 'nullable|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        // Handle file upload
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/assets'), $filename);
            $photoPath = '/uploads/assets/' . $filename;
        }

        $asset = Asset::create([
            'code' => $request->code,
            'name' => $request->name,
            'category' => $request->category,
            'description' => $request->description,
            'unit' => $request->unit,
            'location' => $request->location,
            'floor' => $request->floor,
            'purchase_year' => $request->purchase_year,
            'purchase_price' => $request->purchase_price,
            'rental_price_per_day' => $request->rental_price_per_day ?? 0,
            'photo' => $photoPath,
            'status' => $request->status ?? 'TERSEDIA',
            'condition' => $request->condition ?? 'BAIK',
            'notes' => $request->notes,
            'created_by_id' => auth()->id(),
        ]);

        // Create initial histories
        ConditionHistory::create([
            'asset_id' => $asset->id,
            'condition' => $asset->condition,
            'notes' => 'Kondisi awal saat dibuat',
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        StatusHistory::create([
            'asset_id' => $asset->id,
            'status' => $asset->status,
            'notes' => 'Status awal saat dibuat',
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'CREATE_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => auth()->user()->name . " menambahkan aset {$asset->name} ({$asset->code})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil ditambahkan',
            'data' => $asset->load('createdBy')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Aset tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'nullable|string|unique:assets,code,' . $id,
            'name' => 'nullable|string|max:255',
            'rental_price_per_day' => 'nullable|numeric|min:0',
            'photo' => 'nullable|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $updateData = $request->only([
            'code', 'name', 'category', 'description', 'unit', 
            'location', 'floor', 'purchase_year', 'purchase_price',
            'rental_price_per_day', 'notes'
        ]);

        // Handle file upload
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/assets'), $filename);
            $updateData['photo'] = '/uploads/assets/' . $filename;
        }

        $updateData['updated_by_id'] = auth()->id();

        $asset->update($updateData);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'UPDATE_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => auth()->user()->name . " mengupdate aset {$asset->name} ({$asset->code})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil diupdate',
            'data' => $asset->load(['createdBy', 'updatedBy'])
        ]);
    }

    public function updateCondition(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'condition' => 'required|in:BAIK,CUKUP,KURANG,RUSAK_RINGAN,RUSAK_BERAT',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Aset tidak ditemukan'
            ], 404);
        }

        $asset->update([
            'condition' => $request->condition,
            'updated_by_id' => auth()->id()
        ]);

        ConditionHistory::create([
            'asset_id' => $asset->id,
            'condition' => $request->condition,
            'notes' => $request->notes,
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'UPDATE_ASSET_CONDITION',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => auth()->user()->name . " mengubah kondisi aset {$asset->name} menjadi {$request->condition}",
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
            'status' => 'required|in:TERSEDIA,DIPINJAM,DALAM_PERBAIKAN,RUSAK,DIHAPUSKAN',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $asset = Asset::find($id);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Aset tidak ditemukan'
            ], 404);
        }

        $asset->update([
            'status' => $request->status,
            'updated_by_id' => auth()->id()
        ]);

        StatusHistory::create([
            'asset_id' => $asset->id,
            'status' => $request->status,
            'notes' => $request->notes,
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'UPDATE_ASSET_STATUS',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => auth()->user()->name . " mengubah status aset {$asset->name} menjadi {$request->status}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status aset berhasil diupdate',
            'data' => $asset
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $asset = Asset::with('loans')->find($id);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Aset tidak ditemukan'
            ], 404);
        }

        // Check if asset has active loans
        $hasActiveLoans = $asset->loans()->whereIn('status', ['AKTIF', 'DISETUJUI'])->exists();

        if ($hasActiveLoans) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus aset yang sedang dipinjam'
            ], 400);
        }

        $assetName = $asset->name;
        $assetCode = $asset->code;

        $asset->delete();

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'DELETE_ASSET',
            'entity' => 'Asset',
            'entity_id' => $id,
            'description' => auth()->user()->name . " menghapus aset {$assetName} ({$assetCode})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil dihapus'
        ]);
    }

    public function history($id)
    {
        $conditionHistories = ConditionHistory::where('asset_id', $id)
            ->orderBy('changed_at', 'desc')
            ->get();

        $statusHistories = StatusHistory::where('asset_id', $id)
            ->orderBy('changed_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'conditionHistory' => $conditionHistories,
                'statusHistory' => $statusHistories
            ]
        ]);
    }
}
