<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'borrower_id',
        'purpose',
        'borrow_date',
        'estimated_return_date',
        'actual_return_date',
        'status',
        'condition_when_borrowed',
        'condition_when_returned',
        'rental_cost_per_day',
        'total_days',
        'total_rental_cost',
        'discount_percent',
        'discount_amount',
        'late_fee',
        'total_cost',
        'deposit_amount',
        'notes',
        'rejection_reason',
        'created_by_id',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'borrow_date' => 'datetime',
        'estimated_return_date' => 'datetime',
        'actual_return_date' => 'datetime',
        'approved_at' => 'datetime',
        'rental_cost_per_day' => 'decimal:2',
        'total_rental_cost' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'late_fee' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
    ];

    // Relationships
    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function borrower()
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function agreement()
    {
        return $this->hasOne(Agreement::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'MENUNGGU');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'DISETUJUI');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['DISETUJUI', 'AKTIF']);
    }

    public function scopeReturned($query)
    {
        return $query->where('status', 'DIKEMBALIKAN');
    }

    public function scopeLate($query)
    {
        return $query->where('status', 'TERLAMBAT');
    }
}
