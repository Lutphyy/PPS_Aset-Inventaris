<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }

    public function locations()
    {
        return $this->hasMany(Location::class);
    }

    public function transfersFrom()
    {
        return $this->hasMany(AssetTransfer::class, 'from_unit_id');
    }

    public function transfersTo()
    {
        return $this->hasMany(AssetTransfer::class, 'to_unit_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
