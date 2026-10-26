<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Asset;
use App\Models\Agreement;
use App\Models\Payment;
use App\Models\ConditionHistory;
use App\Models\ActivityLog;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        $query = Loan::with(['asset.unit', 'asset.location', 'borrower', 'agreement', 'payment']);

        $user = auth()->user();

        // Operator only sees loans for assets in their unit
        if ($user->isOperator() && $user->unit_id) {
            $query->whereHas('asset', function($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('borrower_id')) {
            $query->where('borrower_id', $request->borrower_id);
        }

        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        if ($request->has('unit_id')) {
            $query->whereHas('asset', function($q) use ($request) {
                $q->where('unit_id', $request->unit_id);
            });
        }

        $page = $request->get('page', 1);
        $limit = $request->get('limit', 10);

        $loans = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $loans->items(),
            'pagination' => [
                'total' => $loans->total(),
                'page' => $loans->currentPage(),
                'limit' => $loans->perPage(),
                'totalPages' => $loans->lastPage()
            ]
        ]);
    }

    public function show($id)
    {
        $loan = Loan::with(['asset.unit', 'asset.location', 'borrower', 'agreement', 'payment', 'createdBy'])->find($id);

        if (!$loan) {
            return response()->json([
                'success' => false,
                'message' => 'Peminjaman tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $loan
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'asset_id' => 'required|exists:assets,id',
            'purpose' => 'required|string',
            'borrow_date' => 'required|date',
            'estimated_return_date' => 'required|date|after:borrow_date',
            'agreed_to_terms' => 'required|accepted',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $asset = Asset::with('unit')->find($request->asset_id);

        if ($asset->status !== 'TERSEDIA') {
            return response()->json([
                'success' => false,
                'message' => 'Aset tidak tersedia untuk dipinjam'
            ], 400);
        }

        // Check if asset is borrowable
        if (!$asset->is_borrowable) {
            return response()->json([
                'success' => false,
                'message' => 'Aset ini tidak diizinkan untuk dipinjam'
            ], 400);
        }

        $borrower = auth()->user();

        // Calculate costs
        $borrowDate = Carbon::parse($request->borrow_date);
        $returnDate = Carbon::parse($request->estimated_return_date);
        $totalDays = max(1, $borrowDate->diffInDays($returnDate));

        $discountPercent = $borrower->is_guest ? 0 : (SystemSetting::get('CAMPUS_DISCOUNT_PERCENT', 50));
        
        $rentalPricePerDay = $asset->rental_price ?? 0;
        $totalRentalCost = $rentalPricePerDay * $totalDays;
        $discountAmount = ($totalRentalCost * $discountPercent) / 100;
        $totalCost = $totalRentalCost - $discountAmount;
        $depositAmount = $borrower->is_guest ? ($totalCost * 0.5) : 0;

        // Create loan
        $loan = Loan::create([
            'asset_id' => $request->asset_id,
            'borrower_id' => $borrower->id,
            'purpose' => $request->purpose,
            'borrow_date' => $borrowDate,
            'estimated_return_date' => $returnDate,
            'status' => 'MENUNGGU',
            'condition_when_borrowed' => $asset->kondisi,
            'rental_cost_per_day' => $rentalPricePerDay,
            'total_days' => $totalDays,
            'total_rental_cost' => $totalRentalCost,
            'discount_percent' => $discountPercent,
            'discount_amount' => $discountAmount,
            'total_cost' => $totalCost,
            'deposit_amount' => $depositAmount,
        ]);

        // Create agreement
        $agreementContent = $this->generateAgreementText($loan, $asset, $borrower);
        
        Agreement::create([
            'loan_id' => $loan->id,
            'user_id' => $borrower->id,
            'content' => $agreementContent,
            'status' => 'BERLAKU',
        ]);

        // Create payment record
        Payment::create([
            'loan_id' => $loan->id,
            'user_id' => $borrower->id,
            'amount' => $depositAmount > 0 ? $depositAmount : $totalCost,
            'status' => 'BELUM_BAYAR',
        ]);

        ActivityLog::create([
            'user_id' => $borrower->id,
            'action' => 'CREATE_LOAN',
            'entity' => 'Loan',
            'entity_id' => $loan->id,
            'description' => "{$borrower->name} mengajukan peminjaman {$asset->nama_barang} (Unit: {$asset->unit->name})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan peminjaman berhasil dibuat. Menunggu approval admin.',
            'data' => $loan->load(['asset.unit', 'borrower'])
        ], 201);
    }

    public function approve(Request $request, $id)
    {
        $loan = Loan::with(['asset.unit', 'borrower'])->find($id);

        if (!$loan) {
            return response()->json([
                'success' => false,
                'message' => 'Peminjaman tidak ditemukan'
            ], 404);
        }

        if ($loan->status !== 'MENUNGGU') {
            return response()->json([
                'success' => false,
                'message' => 'Status peminjaman tidak dapat diubah'
            ], 400);
        }

        // Operator can only approve loans for assets in their unit
        $user = auth()->user();
        if ($user->isOperator() && $user->unit_id && $loan->asset->unit_id !== $user->unit_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menyetujui peminjaman ini'
            ], 403);
        }

        $loan->update([
            'status' => 'DISETUJUI',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        // Update asset status
        $loan->asset->update(['status' => 'DIPINJAM']);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'APPROVE_LOAN',
            'entity' => 'Loan',
            'entity_id' => $loan->id,
            'description' => auth()->user()->name . " menyetujui peminjaman {$loan->asset->name} oleh {$loan->borrower->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Peminjaman berhasil disetujui',
            'data' => $loan->load(['asset.unit', 'borrower'])
        ]);
    }

    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $loan = Loan::with(['asset.unit', 'borrower'])->find($id);

        if (!$loan) {
            return response()->json([
                'success' => false,
                'message' => 'Peminjaman tidak ditemukan'
            ], 404);
        }

        if ($loan->status !== 'MENUNGGU') {
            return response()->json([
                'success' => false,
                'message' => 'Status peminjaman tidak dapat diubah'
            ], 400);
        }

        $loan->update([
            'status' => 'DITOLAK',
            'rejection_reason' => $request->rejection_reason,
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'REJECT_LOAN',
            'entity' => 'Loan',
            'entity_id' => $loan->id,
            'description' => auth()->user()->name . " menolak peminjaman {$loan->asset->name} oleh {$loan->borrower->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Peminjaman ditolak',
            'data' => $loan
        ]);
    }

    public function return(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'condition_when_returned' => 'required|in:BAIK,CUKUP,KURANG,RUSAK_RINGAN,RUSAK_BERAT',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $loan = Loan::with(['asset.unit', 'borrower'])->find($id);

        if (!$loan) {
            return response()->json([
                'success' => false,
                'message' => 'Peminjaman tidak ditemukan'
            ], 404);
        }

        if (!in_array($loan->status, ['DISETUJUI', 'AKTIF'])) {
            return response()->json([
                'success' => false,
                'message' => 'Peminjaman tidak dapat dikembalikan'
            ], 400);
        }

        $actualReturnDate = now();
        
        // Calculate late fee
        $estimatedReturn = Carbon::parse($loan->estimated_return_date);
        $lateFee = 0;
        
        if ($actualReturnDate->gt($estimatedReturn)) {
            $lateDays = $estimatedReturn->diffInDays($actualReturnDate);
            $feePerDay = SystemSetting::get('LATE_FEE_PER_DAY', 25000);
            $lateFee = $lateDays * $feePerDay;
        }

        $finalTotalCost = $loan->total_cost + $lateFee;
        $newStatus = $lateFee > 0 ? 'TERLAMBAT' : 'DIKEMBALIKAN';

        $loan->update([
            'status' => $newStatus,
            'actual_return_date' => $actualReturnDate,
            'condition_when_returned' => $request->condition_when_returned,
            'late_fee' => $lateFee,
            'total_cost' => $finalTotalCost,
            'notes' => $request->notes,
        ]);

        // Update asset
        $loan->asset->update([
            'status' => 'TERSEDIA',
            'condition' => $request->condition_when_returned,
        ]);

        // Condition history
        ConditionHistory::create([
            'asset_id' => $loan->asset_id,
            'condition' => $request->condition_when_returned,
            'notes' => "Kondisi saat dikembalikan dari peminjaman oleh {$loan->borrower->name}",
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        // Update agreement
        Agreement::where('loan_id', $loan->id)->update(['status' => 'SELESAI']);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'RETURN_LOAN',
            'entity' => 'Loan',
            'entity_id' => $loan->id,
            'description' => auth()->user()->name . " memproses pengembalian {$loan->asset->name} oleh {$loan->borrower->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Aset berhasil dikembalikan',
            'data' => $loan
        ]);
    }

    public function myLoans(Request $request)
    {
        $query = Loan::with(['asset.unit', 'asset.location', 'agreement', 'payment'])
            ->where('borrower_id', auth()->id());

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $loans = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $loans
        ]);
    }

    private function generateAgreementText($loan, $asset, $borrower)
    {
        $unitName = $asset->unit ? $asset->unit->name : '-';
        $locationName = $asset->location ? $asset->location->name : '-';

        return "
PERJANJIAN PEMINJAMAN ASET

Nomor Perjanjian: {$loan->id}
Tanggal: " . now()->format('d-m-Y') . "

PIHAK PERTAMA (PEMBERI PINJAMAN):
Sistem Pengelolaan Aset & Inventaris (SISETRIS)
Universitas

PIHAK KEDUA (PEMINJAM):
Nama: {$borrower->name}
Email: {$borrower->email}
" . ($borrower->is_guest ? "No. KTP: {$borrower->identity_number}" : "Unit: {$unitName}") . "

ASET YANG DIPINJAM:
- Kode Barang: {$asset->kode_barang}
- Nama Barang: {$asset->nama_barang}
- Jenis BMN: {$asset->jenis_bmn}
- Unit: {$unitName}
- Lokasi: {$locationName}

KETENTUAN PEMINJAMAN:
1. Tanggal Pinjam: " . Carbon::parse($loan->borrow_date)->format('d-m-Y') . "
2. Estimasi Pengembalian: " . Carbon::parse($loan->estimated_return_date)->format('d-m-Y') . "
3. Tujuan: {$loan->purpose}
4. Biaya Sewa: Rp " . number_format($loan->total_rental_cost, 0, ',', '.') . "
5. Diskon: {$loan->discount_percent}% (Rp " . number_format($loan->discount_amount, 0, ',', '.') . ")
6. Total Biaya: Rp " . number_format($loan->total_cost, 0, ',', '.') . "
" . ($loan->deposit_amount > 0 ? "7. Deposit: Rp " . number_format($loan->deposit_amount, 0, ',', '.') : '') . "

TANGGUNG JAWAB PEMINJAM:
1. Peminjam wajib menjaga aset dengan baik dan menggunakannya sesuai fungsi.
2. Peminjam bertanggung jawab penuh atas kerusakan, kehilangan, atau kecelakaan yang terjadi pada aset selama masa peminjaman.
3. Peminjam wajib mengembalikan aset sesuai tanggal yang disepakati.
4. Keterlambatan pengembalian akan dikenakan denda Rp 25.000 per hari.
5. Kerusakan pada aset akan dikenakan biaya perbaikan atau penggantian sesuai kondisi kerusakan.
6. Jika aset hilang, peminjam wajib mengganti dengan aset yang sama atau membayar sesuai harga aset.

SANKSI:
1. Pelanggaran terhadap perjanjian ini dapat menjadi dasar pengajuan gugatan hukum.
2. Peminjam yang melanggar perjanjian dapat dikenakan sanksi administratif dan/atau pidana sesuai peraturan yang berlaku.

Dengan menyetujui, Pihak Kedua menyatakan:
- Telah membaca, memahami, dan menyetujui seluruh isi perjanjian ini.
- Bersedia tunduk pada ketentuan dan bertanggung jawab penuh sesuai perjanjian.
- Perjanjian ini mengikat secara hukum dan dapat dijadikan bukti di pengadilan jika diperlukan.

Timestamp Persetujuan: " . now()->toIso8601String() . "
";
    }
}
