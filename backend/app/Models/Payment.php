<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_id',
        'user_id',
        'amount',
        'status',
        'paid_at',
        'payment_method',
        'proof_photo',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    // Relationships
    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopePaid($query)
    {
        return $query->where('status', 'LUNAS');
    }

    public function scopeUnpaid($query)
    {
        return $query->where('status', 'BELUM_BAYAR');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'PENDING');
    }
}
