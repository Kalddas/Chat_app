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
        Schema::table('attachments', function (Blueprint $table) {
            $table->string('file_path')->after('message_id');
            $table->string('file_type')->after('file_path');
            $table->unsignedBigInteger('file_size')->after('file_type');
            $table->dropColumn('path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            $table->string('path')->after('message_id');
            $table->dropColumn(['file_path', 'file_type', 'file_size']);
        });
    }
};
