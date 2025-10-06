<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('visit_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('path')->index();
            $table->string('referrer', 1024)->nullable();
            $table->string('country', 2)->nullable()->index();
            $table->ipAddress('ip')->index();
            $table->string('user_agent', 1024)->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();
            $table->index(['created_at', 'country']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visit_logs');
    }
};
