<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->unique()->constrained('loans')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            $table->text('content');
            $table->timestamp('agreed_at')->useCurrent();
            $table->enum('status', ['BERLAKU', 'SELESAI', 'DILANGGAR'])->default('BERLAKU');
            $table->text('violation_notes')->nullable();
            $table->timestamp('marked_violation_at')->nullable();
            $table->unsignedBigInteger('marked_by')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agreements');
    }
};
