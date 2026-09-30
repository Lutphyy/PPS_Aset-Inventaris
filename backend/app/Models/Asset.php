<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'category',
        'description',
        'unit',
        'location',
        'floor',
        'purchase_year',
        'purchase_price',
        'rental_price_per_day',
        'photo',
        'status',
        'condition',
        'notes',
        'created_by_id',
        'updated_by_id',
    ];

    protected $casts = [
        'purchase_year' => 'integer',
        'purchase_price' => 'decimal:2',
        'rental_price_per_day' => 'decimal:2',
    ];

    // Relationships
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by_id');
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function conditionHistories()
    {
        return $this->hasMany(ConditionHistory::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(StatusHistory::class);
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('status', 'TERSEDIA');
    }

    public function scopeBorrowed($query)
    {
        return $query->where('status', 'DIPINJAM');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCondition($query, $condition)
    {
        return $query->where('condition', $condition);
    }
}
