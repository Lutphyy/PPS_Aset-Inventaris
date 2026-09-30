<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('is_guest')) {
            $query->where('is_guest', $request->is_guest);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        $page = $request->get('page', 1);
        $limit = $request->get('limit', 10);

        $users = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'pagination' => [
                'total' => $users->total(),
                'page' => $users->currentPage(),
                'limit' => $users->perPage(),
                'totalPages' => $users->lastPage()
            ]
        ]);
    }

    public function show($id)
    {
        $user = User::with(['loans.asset'])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|in:SUPER_ADMIN,ADMIN_UNIT,OPERATOR,BORROWER,GUEST,VIEWER',
            'unit' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $user->update($request->only(['name', 'phone', 'role', 'unit']));

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'UPDATE_USER',
            'entity' => 'User',
            'entity_id' => $user->id,
            'description' => auth()->user()->name . " mengupdate user {$user->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diupdate',
            'data' => $user
        ]);
    }

    public function verifyGuest(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:TERVERIFIKASI,DITOLAK',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        $user->update([
            'verification_status' => $request->status,
            'verified_at' => now(),
            'verified_by' => auth()->id(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'VERIFY_GUEST',
            'entity' => 'User',
            'entity_id' => $user->id,
            'description' => auth()->user()->name . " " . ($request->status === 'TERVERIFIKASI' ? 'memverifikasi' : 'menolak') . " guest {$user->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Guest berhasil " . ($request->status === 'TERVERIFIKASI' ? 'diverifikasi' : 'ditolak'),
            'data' => $user
        ]);
    }

    public function toggleStatus(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        $user->update(['is_active' => !$user->is_active]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'TOGGLE_USER_STATUS',
            'entity' => 'User',
            'entity_id' => $user->id,
            'description' => auth()->user()->name . " " . ($user->is_active ? 'mengaktifkan' : 'menonaktifkan') . " user {$user->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "User berhasil " . ($user->is_active ? 'diaktifkan' : 'dinonaktifkan'),
            'data' => $user
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::with('loans')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        $hasActiveLoans = $user->loans()->whereIn('status', ['AKTIF', 'DISETUJUI'])->exists();

        if ($hasActiveLoans) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus user yang memiliki peminjaman aktif'
            ], 400);
        }

        $userName = $user->name;
        $user->delete();

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'DELETE_USER',
            'entity' => 'User',
            'entity_id' => $id,
            'description' => auth()->user()->name . " menghapus user {$userName}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus'
        ]);
    }
}
