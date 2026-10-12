<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetTransfer;
use App\Models\ConditionHistory;
use App\Models\StatusHistory;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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

    public function index(Request $request)
    {
        $query = Asset::with(['createdBy', 'updatedBy', 'unit', 'location']);

        // Apply unit scoping
        $this->applyUnitScope($query, $request);

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

        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
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
        $asset = Asset::with(['createdBy', 'updatedBy', 'unit', 'location', 'loans.borrower', 'transfers.fromUnit', 'transfers.toUnit'])->find($id);

        if (!$asset) {
            return response()->json([
                'success' => false,
                'message' => 'Aset tidak ditemukan'
            ], 404);
        }

        // Check unit access for operator
        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $asset->unit_id !== $user->unit_id) {
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

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:assets,code',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'unit_id' => 'required|exists:units,id',
            'location_id' => 'required|exists:locations,id',
            'rental_price_per_day' => 'required|numeric|min:0',
            'photo' => 'nullable|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        // Operator can only add assets to their own unit
        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $request->unit_id != $user->unit_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda hanya bisa menambahkan aset ke unit Anda sendiri'
            ], 403);
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
            'unit_id' => $request->unit_id,
            'location_id' => $request->location_id,
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
            'data' => $asset->load(['createdBy', 'unit', 'location'])
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

        // Operator can only update assets in their unit
        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $asset->unit_id !== $user->unit_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengubah aset ini'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'nullable|string|unique:assets,code,' . $id,
            'name' => 'nullable|string|max:255',
            'unit_id' => 'nullable|exists:units,id',
            'location_id' => 'nullable|exists:locations,id',
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
            'code', 'name', 'category', 'description', 'unit_id',
            'location_id', 'purchase_year', 'purchase_price',
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
            'data' => $asset->load(['createdBy', 'updatedBy', 'unit', 'location'])
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

        // Operator unit check
        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $asset->unit_id !== $user->unit_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke aset ini'
            ], 403);
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
            'status' => 'required|in:TERSEDIA,DIPINJAM,DALAM_PERBAIKAN,RUSAK,DIPINDAHKAN,DIMUSNAHKAN',
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

        // Operator unit check
        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $asset->unit_id !== $user->unit_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke aset ini'
            ], 403);
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

    /**
     * Transfer an asset from one unit to another
     */
    public function transfer(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'to_unit_id' => 'required|exists:units,id',
            'to_location_id' => 'required|exists:locations,id',
            'reason' => 'required|string',
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

        if ($asset->unit_id == $request->to_unit_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unit tujuan sama dengan unit asal'
            ], 400);
        }

        // Check active loans
        $hasActiveLoans = $asset->loans()->whereIn('status', ['AKTIF', 'DISETUJUI'])->exists();
        if ($hasActiveLoans) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat memindahkan aset yang sedang dipinjam'
            ], 400);
        }

        $fromUnitId = $asset->unit_id;
        $fromLocationId = $asset->location_id;

        // Create transfer record
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

        // Update asset
        $asset->update([
            'unit_id' => $request->to_unit_id,
            'location_id' => $request->to_location_id,
            'status' => 'DIPINDAHKAN',
            'updated_by_id' => auth()->id(),
        ]);

        // Status history
        StatusHistory::create([
            'asset_id' => $asset->id,
            'status' => 'DIPINDAHKAN',
            'notes' => "Dipindahkan: {$request->reason}",
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'TRANSFER_ASSET',
            'entity' => 'Asset',
            'entity_id' => $asset->id,
            'description' => auth()->user()->name . " memindahkan aset {$asset->name} ke unit baru",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil dipindahkan',
            'data' => $asset->load(['unit', 'location'])
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
