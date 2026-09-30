<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('name');
            $table->string('phone')->nullable();
            $table->enum('role', ['SUPER_ADMIN', 'ADMIN_UNIT', 'OPERATOR', 'BORROWER', 'GUEST', 'VIEWER'])->default('BORROWER');
            $table->string('unit')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_guest')->default(false);
            $table->string('identity_number')->nullable()->unique();
            $table->string('identity_photo')->nullable();
            $table->text('address')->nullable();
            $table->enum('verification_status', ['BELUM_TERVERIFIKASI', 'TERVERIFIKASI', 'DITOLAK'])->default('BELUM_TERVERIFIKASI');
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
