<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_transfer_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('from_unit_id')->nullable()->constrained('units');
            $table->foreignId('to_unit_id')->nullable()->constrained('units');
            $table->string('request_type'); // CLAIM, TRANSFER, RELEASE
            $table->text('reason');

            // Admin Unit review
            $table->string('admin_status')->default('PENDING');
            // Values: PENDING, APPROVED, REJECTED
            $table->foreignId('admin_reviewed_by')->nullable()->constrained('users');
            $table->timestamp('admin_reviewed_at')->nullable();
            $table->text('admin_notes')->nullable();

            // Operator Tujuan review (only if admin approved transfer)
            $table->string('target_status')->nullable();
            // Values: PENDING, ACCEPTED, REJECTED
            $table->foreignId('target_reviewed_by')->nullable()->constrained('users');
            $table->timestamp('target_reviewed_at')->nullable();
            $table->text('target_notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_transfer_requests');
    }
};
