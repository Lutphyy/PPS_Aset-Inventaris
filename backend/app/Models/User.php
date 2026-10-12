<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'name',
        'phone',
        'role',
        'unit_id',
        'is_active',
        'is_guest',
        'identity_number',
        'identity_photo',
        'address',
        'verification_status',
        'verified_at',
        'verified_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'verified_at' => 'datetime',
        'is_active' => 'boolean',
        'is_guest' => 'boolean',
        'password' => 'hashed',
    ];

    // Relationships
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class, 'borrower_id');
    }

    public function createdAssets()
    {
        return $this->hasMany(Asset::class, 'created_by_id');
    }

    public function updatedAssets()
    {
        return $this->hasMany(Asset::class, 'updated_by_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function agreements()
    {
        return $this->hasMany(Agreement::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeGuests($query)
    {
        return $query->where('is_guest', true);
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'TERVERIFIKASI');
    }

    public function scopeByUnit($query, $unitId)
    {
        return $query->where('unit_id', $unitId);
    }

    // Helper methods
    public function isSuperAdmin()
    {
        return $this->role === 'SUPER_ADMIN';
    }

    public function isAdminUnit()
    {
        return $this->role === 'ADMIN_UNIT';
    }

    public function isOperator()
    {
        return $this->role === 'OPERATOR';
    }

    public function isAdmin()
    {
        return in_array($this->role, ['SUPER_ADMIN', 'ADMIN_UNIT']);
    }

    /**
     * Check if user can access assets in a specific unit
     */
    public function canAccessUnit($unitId)
    {
        // SuperAdmin and Admin Unit can access all units
        if ($this->isAdmin()) {
            return true;
        }
        // Operator can only access their own unit
        if ($this->isOperator()) {
            return $this->unit_id == $unitId;
        }
        return true; // Borrowers/Guests can view any unit's available assets
    }
}
