<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetTransferRequest;
use App\Models\AssetTransfer;
use App\Models\StatusHistory;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AssetRequestController extends Controller
{
    /**
     * List all asset requests (filtered by role)
     * Admin Unit: sees all pending requests
     * Operator: sees only their own requests
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = AssetTransferRequest::with([
            'asset', 'requester', 'fromUnit', 'toUnit',
            'adminReviewer', 'targetReviewer'
        ]);

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('admin_status', $request->status);
        }

        // Filter by type
        if ($request->has('type') && $request->type) {
            $query->where('request_type', $request->type);
        }

        // Role-based filtering
        if ($user->isOperator()) {
            // Operator only sees their own requests
            $query->where('requested_by', $user->id);
        }

        $limit = $request->get('limit', 25);
        $requests = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $requests->items(),
            'pagination' => [
                'total' => $requests->total(),
                'page' => $requests->currentPage(),
                'limit' => $requests->perPage(),
                'totalPages' => $requests->lastPage()
            ]
        ]);
    }

    /**
     * Operator requests to claim asset from Gudang
     * Creates a CLAIM request that needs Admin Unit approval
     */
    public function requestClaim(Request $request, $assetId)
    {
        $asset = Asset::find($assetId);

        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        if ($asset->status !== 'GUDANG') {
            return response()->json(['success' => false, 'message' => 'Aset ini tidak ada di gudang'], 400);
        }

        $user = auth()->user();

        if (!$user->unit_id) {
            return response()->json(['success' => false, 'message' => 'Anda belum terdaftar di unit manapun'], 400);
        }

        // Check if there's already a pending request for this asset
        $existingRequest = AssetTransferRequest::where('asset_id', $assetId)
            ->where('admin_status', 'PENDING')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Sudah ada permintaan yang sedang menunggu persetujuan untuk aset ini'
            ], 400);
        }

        $assetRequest = AssetTransferRequest::create([
            'asset_id' => $assetId,
            'requested_by' => $user->id,
            'from_unit_id' => $user->unit_id, // The unit that wants to claim
            'to_unit_id' => null, // No destination for claim (it goes to requester's unit)
            'request_type' => 'CLAIM',
            'reason' => $request->reason ?? 'Permintaan klaim aset dari gudang',
            'admin_status' => 'PENDING',
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'REQUEST_CLAIM_ASSET',
            'entity' => 'AssetTransferRequest',
            'entity_id' => $assetRequest->id,
            'description' => "{$user->name} mengajukan permintaan klaim aset {$asset->nama_barang}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan klaim berhasil diajukan. Menunggu persetujuan Admin Unit.',
            'data' => $assetRequest->load(['asset', 'requester', 'fromUnit'])
        ], 201);
    }

    /**
     * Operator requests to transfer asset to another unit
     * Creates a TRANSFER request that needs Admin Unit approval
     */
    public function requestTransfer(Request $request, $assetId)
    {
        $validator = Validator::make($request->all(), [
            'to_unit_id' => 'required|exists:units,id',
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $asset = Asset::find($assetId);

        if (!$asset) {
            return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
        }

        if ($asset->status !== 'TERSEDIA') {
            return response()->json(['success' => false, 'message' => 'Aset harus berstatus TERSEDIA untuk dipindahkan'], 400);
        }

        $user = auth()->user();

        if ($asset->unit_id == $request->to_unit_id) {
            return response()->json(['success' => false, 'message' => 'Unit tujuan sama dengan unit asal'], 400);
        }

        // Check if there's already a pending request for this asset
        $existingRequest = AssetTransferRequest::where('asset_id', $assetId)
            ->where('admin_status', 'PENDING')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Sudah ada permintaan yang sedang menunggu persetujuan untuk aset ini'
            ], 400);
        }

        $assetRequest = AssetTransferRequest::create([
            'asset_id' => $assetId,
            'requested_by' => $user->id,
            'from_unit_id' => $asset->unit_id,
            'to_unit_id' => $request->to_unit_id,
            'request_type' => 'TRANSFER',
            'reason' => $request->reason,
            'admin_status' => 'PENDING',
        ]);

        // Set asset status to PROSES_TRANSFER
        $asset->update([
            'status' => 'PROSES_TRANSFER',
            'updated_by_id' => $user->id,
        ]);

        StatusHistory::create([
            'asset_id' => $asset->id,
            'status' => 'PROSES_TRANSFER',
            'notes' => "Menunggu persetujuan transfer oleh admin",
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'REQUEST_TRANSFER_ASSET',
            'entity' => 'AssetTransferRequest',
            'entity_id' => $assetRequest->id,
            'description' => "{$user->name} mengajukan permintaan transfer aset {$asset->nama_barang}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan transfer berhasil diajukan. Menunggu persetujuan Admin Unit.',
            'data' => $assetRequest->load(['asset', 'requester', 'fromUnit', 'toUnit'])
        ], 201);
    }

    /**
     * Admin Unit approves a request (claim or transfer)
     */
    public function approve(Request $request, $id)
    {
        $assetRequest = AssetTransferRequest::with(['asset', 'requester', 'fromUnit', 'toUnit'])->find($id);

        if (!$assetRequest) {
            return response()->json(['success' => false, 'message' => 'Permintaan tidak ditemukan'], 404);
        }

        if ($assetRequest->admin_status !== 'PENDING') {
            return response()->json(['success' => false, 'message' => 'Permintaan ini sudah diproses'], 400);
        }

        $user = auth()->user();
        $asset = $assetRequest->asset;

        // Update request status
        $assetRequest->update([
            'admin_status' => 'APPROVED',
            'admin_reviewed_by' => $user->id,
            'admin_reviewed_at' => now(),
            'admin_notes' => $request->notes ?? null,
        ]);

        // Execute the action based on request type
        if ($assetRequest->request_type === 'CLAIM') {
            // Move asset from Gudang to requester's unit
            $asset->update([
                'unit_id' => $assetRequest->from_unit_id,
                'status' => 'TERSEDIA',
                'claimed_by_id' => $assetRequest->requested_by,
                'claimed_at' => now(),
                'updated_by_id' => $user->id,
            ]);

            StatusHistory::create([
                'asset_id' => $asset->id,
                'status' => 'TERSEDIA',
                'notes' => "Klaim disetujui oleh admin {$user->name}. Diklaim oleh {$assetRequest->requester->name}",
                'changed_by' => $user->id,
                'changed_at' => now(),
            ]);

            $actionDesc = "menyetujui klaim aset {$asset->nama_barang} oleh {$assetRequest->requester->name}";

        } else {
            // TRANSFER: Move asset to destination unit
            $fromUnitId = $asset->unit_id;

            AssetTransfer::create([
                'asset_id' => $asset->id,
                'from_unit_id' => $fromUnitId,
                'to_unit_id' => $assetRequest->to_unit_id,
                'from_location_id' => $asset->location_id,
                'to_location_id' => null,
                'reason' => $assetRequest->reason,
                'transferred_by' => $user->id,
                'transferred_at' => now(),
            ]);

            $asset->update([
                'unit_id' => $assetRequest->to_unit_id,
                'location_id' => null,
                'status' => 'TERSEDIA',
                'updated_by_id' => $user->id,
            ]);

            StatusHistory::create([
                'asset_id' => $asset->id,
                'status' => 'TERSEDIA',
                'notes' => "Transfer disetujui oleh admin {$user->name}. Dipindahkan ke unit baru",
                'changed_by' => $user->id,
                'changed_at' => now(),
            ]);

            $actionDesc = "menyetujui transfer aset {$asset->nama_barang}";
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'APPROVE_ASSET_REQUEST',
            'entity' => 'AssetTransferRequest',
            'entity_id' => $assetRequest->id,
            'description' => "{$user->name} {$actionDesc}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan berhasil disetujui',
            'data' => $assetRequest->fresh()->load(['asset', 'requester', 'fromUnit', 'toUnit', 'adminReviewer'])
        ]);
    }

    /**
     * Admin Unit rejects a request
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'required|string|min:3',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $assetRequest = AssetTransferRequest::with(['asset', 'requester'])->find($id);

        if (!$assetRequest) {
            return response()->json(['success' => false, 'message' => 'Permintaan tidak ditemukan'], 404);
        }

        if ($assetRequest->admin_status !== 'PENDING') {
            return response()->json(['success' => false, 'message' => 'Permintaan ini sudah diproses'], 400);
        }

        $user = auth()->user();
        $asset = $assetRequest->asset;

        // Update request status
        $assetRequest->update([
            'admin_status' => 'REJECTED',
            'admin_reviewed_by' => $user->id,
            'admin_reviewed_at' => now(),
            'admin_notes' => $request->notes,
        ]);

        // If it was a transfer request, revert asset status
        if ($assetRequest->request_type === 'TRANSFER' && $asset->status === 'PROSES_TRANSFER') {
            $asset->update([
                'status' => 'TERSEDIA',
                'updated_by_id' => $user->id,
            ]);

            StatusHistory::create([
                'asset_id' => $asset->id,
                'status' => 'TERSEDIA',
                'notes' => "Permintaan transfer ditolak oleh admin {$user->name}: {$request->notes}",
                'changed_by' => $user->id,
                'changed_at' => now(),
            ]);
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'REJECT_ASSET_REQUEST',
            'entity' => 'AssetTransferRequest',
            'entity_id' => $assetRequest->id,
            'description' => "{$user->name} menolak permintaan {$assetRequest->request_type} aset {$asset->nama_barang}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan berhasil ditolak',
            'data' => $assetRequest->fresh()->load(['asset', 'requester', 'fromUnit', 'toUnit', 'adminReviewer'])
        ]);
    }

    /**
     * Get count of pending requests (for badge)
     */
    public function pendingCount()
    {
        $count = AssetTransferRequest::where('admin_status', 'PENDING')->count();

        return response()->json([
            'success' => true,
            'count' => $count
        ]);
    }
}
