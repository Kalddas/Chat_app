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
        Schema::table('suspended_user_messages', function (Blueprint $table) {
            $table->text('admin_response')->nullable()->after('message');
            $table->foreignId('responded_by')->nullable()->after('admin_response')->constrained('users')->onDelete('set null');
            $table->timestamp('responded_at')->nullable()->after('responded_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('suspended_user_messages', function (Blueprint $table) {
            $table->dropForeign(['responded_by']);
            $table->dropColumn(['admin_response', 'responded_by', 'responded_at']);
        });
    }
};

