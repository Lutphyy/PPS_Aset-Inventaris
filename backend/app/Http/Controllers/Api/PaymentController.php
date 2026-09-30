<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['loan.asset', 'loan.borrower', 'user']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $page = $request->get('page', 1);
        $limit = $request->get('limit', 10);

        $payments = $query->orderBy('created_at', 'desc')->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'pagination' => [
                'total' => $payments->total(),
                'page' => $payments->currentPage(),
                'limit' => $payments->perPage(),
                'totalPages' => $payments->lastPage()
            ]
        ]);
    }

    public function show($id)
    {
        $payment = Payment::with(['loan.asset', 'loan.borrower'])->find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }

    public function update(Request $request, $id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment tidak ditemukan'
            ], 404);
        }

        $updateData = [];

        if ($request->has('status')) {
            $updateData['status'] = $request->status;
            if ($request->status === 'LUNAS') {
                $updateData['paid_at'] = now();
            }
        }

        if ($request->has('payment_method')) {
            $updateData['payment_method'] = $request->payment_method;
        }

        if ($request->has('notes')) {
            $updateData['notes'] = $request->notes;
        }

        if ($request->hasFile('proof_photo')) {
            $file = $request->file('proof_photo');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/payments'), $filename);
            $updateData['proof_photo'] = '/uploads/payments/' . $filename;
        }

        $payment->update($updateData);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'UPDATE_PAYMENT',
            'entity' => 'Payment',
            'entity_id' => $payment->id,
            'description' => auth()->user()->name . " mengupdate payment",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment berhasil diupdate',
            'data' => $payment
        ]);
    }
}
