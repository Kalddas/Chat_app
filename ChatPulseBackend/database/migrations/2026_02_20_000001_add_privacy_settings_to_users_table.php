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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('read_receipts_enabled')->default(true)->after('language');
            $table->boolean('show_online_status')->default(true)->after('read_receipts_enabled');
            $table->timestamp('last_seen_at')->nullable()->after('show_online_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['read_receipts_enabled', 'show_online_status', 'last_seen_at']);
        });
    }
};
