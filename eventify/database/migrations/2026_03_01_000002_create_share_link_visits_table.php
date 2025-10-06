<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('share_link_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('share_link_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('country', 2)->nullable()->index();
            $table->ipAddress('ip')->index();
            $table->string('user_agent', 1024)->nullable();
            $table->timestamps();

            $table->index(['share_link_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('share_link_visits');
    }
};
