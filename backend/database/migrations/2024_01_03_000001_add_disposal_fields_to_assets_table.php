<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            // Disposal / Release fields
            $table->string('disposal_type')->nullable()->after('updated_by_id');
            // Values: DIMUSNAHKAN, DILEPASKAN (ke universitas / pihak lain)
            $table->date('disposal_date')->nullable()->after('disposal_type');
            $table->text('disposal_reason')->nullable()->after('disposal_date');
            $table->string('disposal_destination')->nullable()->after('disposal_reason');
            // Tujuan pelepasan: misalnya "Universitas X", "Kementerian Y"
            $table->string('disposal_document')->nullable()->after('disposal_destination');
            // File bukti (path to uploaded file - PDF/image)
            $table->foreignId('disposed_by_id')->nullable()->after('disposal_document')
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('disposed_at')->nullable()->after('disposed_by_id');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['disposed_by_id']);
            $table->dropColumn([
                'disposal_type',
                'disposal_date',
                'disposal_reason',
                'disposal_destination',
                'disposal_document',
                'disposed_by_id',
                'disposed_at',
            ]);
        });
    }
};
