<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');
            $table->foreignId('borrower_id')->constrained('users')->onDelete('cascade');
            
            $table->text('purpose');
            $table->dateTime('borrow_date');
            $table->dateTime('estimated_return_date');
            $table->dateTime('actual_return_date')->nullable();
            
            $table->enum('status', ['MENUNGGU', 'DISETUJUI', 'DITOLAK', 'AKTIF', 'DIKEMBALIKAN', 'TERLAMBAT'])->default('MENUNGGU');
            
            $table->enum('condition_when_borrowed', ['BAIK', 'CUKUP', 'KURANG', 'RUSAK_RINGAN', 'RUSAK_BERAT']);
            $table->enum('condition_when_returned', ['BAIK', 'CUKUP', 'KURANG', 'RUSAK_RINGAN', 'RUSAK_BERAT'])->nullable();
            
            $table->decimal('rental_cost_per_day', 10, 2);
            $table->integer('total_days');
            $table->decimal('total_rental_cost', 10, 2);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('late_fee', 10, 2)->default(0);
            $table->decimal('total_cost', 10, 2);
            $table->decimal('deposit_amount', 10, 2)->default(0);
            
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->foreignId('created_by_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
