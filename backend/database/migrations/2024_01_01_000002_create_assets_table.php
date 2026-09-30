<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('category');
            $table->text('description')->nullable();
            $table->string('unit');
            $table->string('location');
            $table->string('floor')->nullable();
            $table->integer('purchase_year')->nullable();
            $table->decimal('purchase_price', 12, 2)->nullable();
            $table->decimal('rental_price_per_day', 10, 2)->default(0);
            $table->string('photo')->nullable();
            $table->enum('status', ['TERSEDIA', 'DIPINJAM', 'DALAM_PERBAIKAN', 'RUSAK', 'DIHAPUSKAN'])->default('TERSEDIA');
            $table->enum('condition', ['BAIK', 'CUKUP', 'KURANG', 'RUSAK_RINGAN', 'RUSAK_BERAT'])->default('BAIK');
            $table->text('notes')->nullable();
            
            $table->foreignId('created_by_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by_id')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
