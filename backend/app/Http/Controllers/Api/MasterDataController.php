<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MasterDataController extends Controller
{
    // Default values (fallback if not set in DB)
    private $defaultCategories = ['Elektronik', 'Furnitur', 'Kendaraan', 'Peralatan Laboratorium', 'Alat Kantor', 'Olahraga'];
    private $defaultConditions = ['BAIK', 'CUKUP', 'KURANG', 'RUSAK_RINGAN', 'RUSAK_BERAT'];
    private $defaultStatuses = ['TERSEDIA', 'DIPINJAM', 'DALAM_PERBAIKAN', 'RUSAK', 'DIPINDAHKAN', 'DIMUSNAHKAN'];

    /**
     * Get all master data (categories, conditions, statuses)
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $this->getList('asset_categories', $this->defaultCategories),
                'conditions' => $this->getList('asset_conditions', $this->defaultConditions),
                'statuses' => $this->getList('asset_statuses', $this->defaultStatuses),
            ]
        ]);
    }

    /**
     * Update categories
     */
    public function updateCategories(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $items = array_values(array_unique($request->items));
        SystemSetting::set('asset_categories', json_encode($items), 'Daftar kategori aset');

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui',
            'data' => $items,
        ]);
    }

    /**
     * Update conditions
     */
    public function updateConditions(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $items = array_values(array_unique($request->items));
        SystemSetting::set('asset_conditions', json_encode($items), 'Daftar kondisi aset');

        return response()->json([
            'success' => true,
            'message' => 'Kondisi berhasil diperbarui',
            'data' => $items,
        ]);
    }

    /**
     * Update statuses
     */
    public function updateStatuses(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $items = array_values(array_unique($request->items));
        SystemSetting::set('asset_statuses', json_encode($items), 'Daftar status aset');

        return response()->json([
            'success' => true,
            'message' => 'Status berhasil diperbarui',
            'data' => $items,
        ]);
    }

    /**
     * Helper: get list from system settings or fallback
     */
    private function getList($key, $default)
    {
        $value = SystemSetting::get($key);
        if ($value) {
            $decoded = json_decode($value, true);
            if (is_array($decoded) && count($decoded) > 0) {
                return $decoded;
            }
        }
        return $default;
    }
}
