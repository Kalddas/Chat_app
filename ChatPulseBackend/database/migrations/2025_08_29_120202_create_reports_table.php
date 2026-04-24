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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // spam, harassment, inappropriate_content, fake_profile
            $table->text('reason');
            $table->string('status')->default('pending'); // pending, in_review, resolved, dismissed
            $table->foreignId('reported_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('reporter_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('handled_by')->nullable()->constrained('admins')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
