<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\User;
use App\Models\Loan;
use App\Models\Payment;
use App\Models\Unit;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = auth()->user();
        $isOperator = $user->isOperator() && $user->unit_id;

        // Base queries scoped by unit for operators
        $assetQuery = Asset::query();
        $loanQuery = Loan::query();

        if ($isOperator) {
            $assetQuery->where('unit_id', $user->unit_id);
            $loanQuery->whereHas('asset', function($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        }

        // Total assets
        $totalAssets = (clone $assetQuery)->count();

        // Assets by status
        $assetsByStatus = (clone $assetQuery)->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Assets by condition
        $assetsByCondition = (clone $assetQuery)->selectRaw('`condition`, COUNT(*) as count')
            ->groupBy('condition')
            ->pluck('count', 'condition');

        // Assets by category
        $assetsByCategory = (clone $assetQuery)->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'count' => $item->count
                ];
            });

        // Assets by unit (only for admin roles)
        $assetsByUnit = [];
        if (!$isOperator) {
            $assetsByUnit = Unit::withCount('assets')->get()->map(function ($unit) {
                return [
                    'unit' => $unit->name,
                    'unit_code' => $unit->code,
                    'count' => $unit->assets_count,
                ];
            });
        }

        // Total users
        $totalUsers = $isOperator ? 0 : User::count();

        // Active loans
        $activeLoans = (clone $loanQuery)->whereIn('status', ['DISETUJUI', 'AKTIF'])->count();

        // Pending loans
        $pendingLoans = (clone $loanQuery)->where('status', 'MENUNGGU')->count();

        // Recent loans
        $recentLoansQuery = Loan::with(['asset.unit', 'borrower']);
        if ($isOperator) {
            $recentLoansQuery->whereHas('asset', function($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        }
        $recentLoans = $recentLoansQuery->orderBy('created_at', 'desc')->limit(5)->get();

        // Upcoming due dates (next 7 days)
        $upcomingDueQuery = Loan::with(['asset.unit', 'borrower'])
            ->whereIn('status', ['DISETUJUI', 'AKTIF'])
            ->where('estimated_return_date', '<=', Carbon::now()->addDays(7))
            ->orderBy('estimated_return_date', 'asc');
        if ($isOperator) {
            $upcomingDueQuery->whereHas('asset', function($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        }
        $upcomingDue = $upcomingDueQuery->get();

        // Revenue - this month
        $thisMonthStart = Carbon::now()->startOfMonth();
        $revenueThisMonth = Payment::where('status', 'LUNAS')
            ->where('paid_at', '>=', $thisMonthStart)
            ->sum('amount');

        // Revenue - total
        $revenueTotal = Payment::where('status', 'LUNAS')->sum('amount');

        // Pending guest verifications
        $pendingGuestVerifications = User::where('is_guest', true)
            ->where('verification_status', 'BELUM_TERVERIFIKASI')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'totalAssets' => $totalAssets,
                    'totalUsers' => $totalUsers,
                    'activeLoans' => $activeLoans,
                    'pendingLoans' => $pendingLoans,
                    'pendingGuestVerifications' => $pendingGuestVerifications,
                    'revenueThisMonth' => $revenueThisMonth ?? 0,
                    'revenueTotal' => $revenueTotal ?? 0,
                ],
                'assetsByStatus' => $assetsByStatus,
                'assetsByCondition' => $assetsByCondition,
                'assetsByCategory' => $assetsByCategory,
                'assetsByUnit' => $assetsByUnit,
                'recentLoans' => $recentLoans,
                'upcomingDue' => $upcomingDue,
            ]
        ]);
    }
}
