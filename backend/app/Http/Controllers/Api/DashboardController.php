<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\User;
use App\Models\Loan;
use App\Models\Payment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        // Total assets
        $totalAssets = Asset::count();

        // Assets by status
        $assetsByStatus = Asset::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Assets by condition
        $assetsByCondition = Asset::selectRaw('`condition`, COUNT(*) as count')
            ->groupBy('condition')
            ->pluck('count', 'condition');

        // Assets by category
        $assetsByCategory = Asset::selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'count' => $item->count
                ];
            });

        // Assets by location
        $assetsByLocation = Asset::selectRaw('location, COUNT(*) as count')
            ->groupBy('location')
            ->get()
            ->map(function ($item) {
                return [
                    'location' => $item->location,
                    'count' => $item->count
                ];
            });

        // Total users
        $totalUsers = User::count();

        // Active loans
        $activeLoans = Loan::whereIn('status', ['DISETUJUI', 'AKTIF'])->count();

        // Pending loans
        $pendingLoans = Loan::where('status', 'MENUNGGU')->count();

        // Recent loans
        $recentLoans = Loan::with(['asset', 'borrower'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Upcoming due dates (next 7 days)
        $upcomingDue = Loan::with(['asset', 'borrower'])
            ->whereIn('status', ['DISETUJUI', 'AKTIF'])
            ->where('estimated_return_date', '<=', Carbon::now()->addDays(7))
            ->orderBy('estimated_return_date', 'asc')
            ->get();

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
                'assetsByLocation' => $assetsByLocation,
                'recentLoans' => $recentLoans,
                'upcomingDue' => $upcomingDue,
            ]
        ]);
    }
}
