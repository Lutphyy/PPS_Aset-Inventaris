<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agreement extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_id',
        'user_id',
        'content',
        'agreed_at',
        'status',
        'violation_notes',
        'marked_violation_at',
        'marked_by',
    ];

    protected $casts = [
        'agreed_at' => 'datetime',
        'marked_violation_at' => 'datetime',
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
    public function scopeActive($query)
    {
        return $query->where('status', 'BERLAKU');
    }

    public function scopeViolated($query)
    {
        return $query->where('status', 'DILANGGAR');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'SELESAI');
    }
}
