<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agreement;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class AgreementController extends Controller
{
    public function index(Request $request)
    {
        $query = Agreement::with(['loan.asset', 'loan.borrower', 'user']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $page = $request->get('page', 1);
        $limit = $request->get('limit', 10);

        $agreements = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $agreements->items(),
            'pagination' => [
                'total' => $agreements->total(),
                'page' => $agreements->currentPage(),
                'limit' => $agreements->perPage(),
                'totalPages' => $agreements->lastPage()
            ]
        ]);
    }

    public function show($id)
    {
        $agreement = Agreement::with(['loan.asset', 'loan.borrower'])->find($id);

        if (!$agreement) {
            return response()->json([
                'success' => false,
                'message' => 'Agreement tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $agreement
        ]);
    }

    public function markAsViolated(Request $request, $id)
    {
        $agreement = Agreement::find($id);

        if (!$agreement) {
            return response()->json([
                'success' => false,
                'message' => 'Agreement tidak ditemukan'
            ], 404);
        }

        $agreement->update([
            'status' => 'DILANGGAR',
            'violation_notes' => $request->violation_notes,
            'marked_violation_at' => now(),
            'marked_by' => auth()->id(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'MARK_AGREEMENT_VIOLATED',
            'entity' => 'Agreement',
            'entity_id' => $agreement->id,
            'description' => auth()->user()->name . " menandai agreement sebagai dilanggar",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Agreement berhasil ditandai sebagai dilanggar',
            'data' => $agreement
        ]);
    }
}
