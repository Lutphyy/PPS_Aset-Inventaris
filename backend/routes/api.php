<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AgreementController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\MasterDataController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/register-guest', [AuthController::class, 'registerGuest']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });

    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Master data: read for all authenticated users (needed for dropdowns)
    Route::get('/master-data', [MasterDataController::class, 'index']);

    // Master data management (Admin Unit only)
    Route::middleware('role:ADMIN_UNIT')->group(function () {
        Route::put('/master-data/categories', [MasterDataController::class, 'updateCategories']);
        Route::put('/master-data/conditions', [MasterDataController::class, 'updateConditions']);
        Route::put('/master-data/statuses', [MasterDataController::class, 'updateStatuses']);
    });

    // Unit & Location management routes (Admin Unit only)
    Route::middleware('role:ADMIN_UNIT')->group(function () {
        Route::prefix('units')->group(function () {
            Route::get('/', [UnitController::class, 'index']);
            Route::get('/{id}', [UnitController::class, 'show']);
            Route::post('/', [UnitController::class, 'store']);
            Route::put('/{id}', [UnitController::class, 'update']);
            Route::delete('/{id}', [UnitController::class, 'destroy']);
        });

        Route::prefix('locations')->group(function () {
            Route::get('/', [LocationController::class, 'index']);
            Route::get('/{id}', [LocationController::class, 'show']);
            Route::post('/', [LocationController::class, 'store']);
            Route::put('/{id}', [LocationController::class, 'update']);
            Route::delete('/{id}', [LocationController::class, 'destroy']);
        });
    });

    // Public unit/location listing (all authenticated users can list for dropdowns)
    Route::get('/units-list', [UnitController::class, 'index']);
    Route::get('/locations-list', [LocationController::class, 'index']);

    // Asset routes
    Route::prefix('assets')->group(function () {
        Route::get('/', [AssetController::class, 'index']);
        Route::get('/{id}', [AssetController::class, 'show']);
        Route::get('/{id}/history', [AssetController::class, 'history']);
        
        // Admin/Operator only routes
        Route::middleware('role:SUPER_ADMIN,ADMIN_UNIT,OPERATOR')->group(function () {
            Route::post('/', [AssetController::class, 'store']);
            Route::put('/{id}', [AssetController::class, 'update']);
            Route::patch('/{id}/condition', [AssetController::class, 'updateCondition']);
            Route::patch('/{id}/status', [AssetController::class, 'updateStatus']);
            Route::post('/{id}/transfer', [AssetController::class, 'transfer']);
            Route::delete('/{id}', [AssetController::class, 'destroy']);
        });
    });

    // Loan routes
    Route::prefix('loans')->group(function () {
        Route::get('/', [LoanController::class, 'index']);
        Route::get('/my-loans', [LoanController::class, 'myLoans']);
        Route::get('/{id}', [LoanController::class, 'show']);
        Route::post('/', [LoanController::class, 'store']);
        
        // Admin/Operator only routes
        Route::middleware('role:SUPER_ADMIN,ADMIN_UNIT,OPERATOR')->group(function () {
            Route::patch('/{id}/approve', [LoanController::class, 'approve']);
            Route::patch('/{id}/reject', [LoanController::class, 'reject']);
            Route::patch('/{id}/return', [LoanController::class, 'return']);
        });
    });

    // User management routes (Super Admin only)
    Route::middleware('role:SUPER_ADMIN')->group(function () {
        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::get('/{id}', [UserController::class, 'show']);
            Route::put('/{id}', [UserController::class, 'update']);
            Route::patch('/{id}/verify', [UserController::class, 'verifyGuest']);
            Route::patch('/{id}/toggle-status', [UserController::class, 'toggleStatus']);
            Route::delete('/{id}', [UserController::class, 'destroy']);
        });
    });

    // Agreement routes
    Route::prefix('agreements')->group(function () {
        Route::get('/', [AgreementController::class, 'index']);
        Route::get('/{id}', [AgreementController::class, 'show']);
        
        // Admin only routes
        Route::middleware('role:SUPER_ADMIN,ADMIN_UNIT,OPERATOR')->group(function () {
            Route::patch('/{id}/violate', [AgreementController::class, 'markAsViolated']);
        });
    });

    // Payment routes
    Route::prefix('payments')->group(function () {
        Route::get('/', [PaymentController::class, 'index']);
        Route::get('/{id}', [PaymentController::class, 'show']);
        Route::patch('/{id}', [PaymentController::class, 'update']);
    });

    // Report routes (Admin/Operator/Viewer)
    Route::middleware('role:SUPER_ADMIN,ADMIN_UNIT,OPERATOR,VIEWER')->group(function () {
        Route::prefix('reports')->group(function () {
            Route::get('/assets/excel', [ReportController::class, 'exportAssetsExcel']);
            Route::get('/assets/by-condition/excel', [ReportController::class, 'exportAssetsByConditionExcel']);
            Route::get('/revenue/excel', [ReportController::class, 'exportRevenueExcel']);
            Route::get('/loans/excel', [ReportController::class, 'exportLoansExcel']);
        });
    });

    // Activity Logs routes (Admin only)
    Route::middleware('role:SUPER_ADMIN,ADMIN_UNIT')->group(function () {
        Route::get('/activity-logs', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\ActivityLog::with('user')->orderBy('created_at', 'desc');
            $limit = $request->get('limit', 50);
            $logs = $query->paginate($limit);
            return response()->json([
                'success' => true,
                'data' => $logs->items(),
                'pagination' => [
                    'total' => $logs->total(),
                    'page' => $logs->currentPage(),
                    'limit' => $logs->perPage(),
                    'totalPages' => $logs->lastPage()
                ]
            ]);
        });
    });
});
