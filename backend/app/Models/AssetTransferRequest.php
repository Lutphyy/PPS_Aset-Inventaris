<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetTransferRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'requested_by',
        'from_unit_id',
        'to_unit_id',
        'request_type',
        'reason',
        'admin_status',
        'admin_reviewed_by',
        'admin_reviewed_at',
        'admin_notes',
        'target_status',
        'target_reviewed_by',
        'target_reviewed_at',
        'target_notes',
    ];

    protected $casts = [
        'admin_reviewed_at' => 'datetime',
        'target_reviewed_at' => 'datetime',
    ];

    // Relationships
    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function fromUnit()
    {
        return $this->belongsTo(Unit::class, 'from_unit_id');
    }

    public function toUnit()
    {
        return $this->belongsTo(Unit::class, 'to_unit_id');
    }

    public function adminReviewer()
    {
        return $this->belongsTo(User::class, 'admin_reviewed_by');
    }

    public function targetReviewer()
    {
        return $this->belongsTo(User::class, 'target_reviewed_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('admin_status', 'PENDING');
    }

    public function scopeAwaitingTarget($query)
    {
        return $query->where('admin_status', 'APPROVED_TRANSFER')
                     ->where('target_status', 'PENDING');
    }

    // Helpers
    public function isPending(): bool
    {
        return $this->admin_status === 'PENDING';
    }

    public function isAwaitingTarget(): bool
    {
        return $this->admin_status === 'APPROVED_TRANSFER'
            && $this->target_status === 'PENDING';
    }
}
