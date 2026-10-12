<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $query = Unit::withCount(['assets', 'locations', 'users']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('code', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('active_only') && $request->active_only) {
            $query->active();
        }

        $units = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $units
        ]);
    }

    public function show($id)
    {
        $unit = Unit::withCount(['assets', 'locations', 'users'])
            ->with(['locations' => function($q) { $q->active(); }])
            ->find($id);

        if (!$unit) {
            return response()->json([
                'success' => false,
                'message' => 'Unit tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $unit
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:units,code',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $unit = Unit::create([
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'description' => $request->description,
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'CREATE_UNIT',
            'entity' => 'Unit',
            'entity_id' => $unit->id,
            'description' => auth()->user()->name . " membuat unit {$unit->name} ({$unit->code})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Unit berhasil dibuat',
            'data' => $unit
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $unit = Unit::find($id);

        if (!$unit) {
            return response()->json([
                'success' => false,
                'message' => 'Unit tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:50|unique:units,code,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $updateData = $request->only(['name', 'description', 'is_active']);
        if ($request->has('code')) {
            $updateData['code'] = strtoupper($request->code);
        }

        $unit->update($updateData);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'UPDATE_UNIT',
            'entity' => 'Unit',
            'entity_id' => $unit->id,
            'description' => auth()->user()->name . " mengupdate unit {$unit->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Unit berhasil diupdate',
            'data' => $unit
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $unit = Unit::withCount('assets')->find($id);

        if (!$unit) {
            return response()->json([
                'success' => false,
                'message' => 'Unit tidak ditemukan'
            ], 404);
        }

        if ($unit->assets_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus unit yang masih memiliki aset'
            ], 400);
        }

        $unitName = $unit->name;
        $unit->delete();

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'DELETE_UNIT',
            'entity' => 'Unit',
            'entity_id' => $id,
            'description' => auth()->user()->name . " menghapus unit {$unitName}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Unit berhasil dihapus'
        ]);
    }
}
