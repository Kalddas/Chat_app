<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Skip this migration if using SQLite (tests) - it already supports TEXT type
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql' && Schema::hasColumn('messages', 'text')) {
            DB::statement('ALTER TABLE messages MODIFY text TEXT');
        }
        // SQLite automatically creates text columns as TEXT, so no action needed
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql' && Schema::hasColumn('messages', 'text')) {
            DB::statement('ALTER TABLE messages MODIFY text VARCHAR(255)');
        }
        // SQLite doesn't support ALTER TABLE MODIFY
    }
};

