<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        $query = Location::with('unit')->withCount('assets');

        if ($request->has('unit_id')) {
            $query->where('unit_id', $request->unit_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'LIKE', "%{$search}%");
        }

        if ($request->has('active_only') && $request->active_only) {
            $query->active();
        }

        $locations = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $locations
        ]);
    }

    public function show($id)
    {
        $location = Location::with('unit')->withCount('assets')->find($id);

        if (!$location) {
            return response()->json([
                'success' => false,
                'message' => 'Lokasi tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $location
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'unit_id' => 'required|exists:units,id',
            'floor' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $location = Location::create([
            'name' => $request->name,
            'unit_id' => $request->unit_id,
            'floor' => $request->floor,
            'description' => $request->description,
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'CREATE_LOCATION',
            'entity' => 'Location',
            'entity_id' => $location->id,
            'description' => auth()->user()->name . " membuat lokasi {$location->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lokasi berhasil dibuat',
            'data' => $location->load('unit')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $location = Location::find($id);

        if (!$location) {
            return response()->json([
                'success' => false,
                'message' => 'Lokasi tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'unit_id' => 'nullable|exists:units,id',
            'floor' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $location->update($request->only(['name', 'unit_id', 'floor', 'description', 'is_active']));

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'UPDATE_LOCATION',
            'entity' => 'Location',
            'entity_id' => $location->id,
            'description' => auth()->user()->name . " mengupdate lokasi {$location->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lokasi berhasil diupdate',
            'data' => $location->load('unit')
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $location = Location::withCount('assets')->find($id);

        if (!$location) {
            return response()->json([
                'success' => false,
                'message' => 'Lokasi tidak ditemukan'
            ], 404);
        }

        if ($location->assets_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus lokasi yang masih memiliki aset'
            ], 400);
        }

        $locationName = $location->name;
        $location->delete();

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'DELETE_LOCATION',
            'entity' => 'Location',
            'entity_id' => $id,
            'description' => auth()->user()->name . " menghapus lokasi {$locationName}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lokasi berhasil dihapus'
        ]);
    }
}
