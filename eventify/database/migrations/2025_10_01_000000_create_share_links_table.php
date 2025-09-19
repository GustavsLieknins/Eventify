<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('share_links', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 64)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // point to your bookmarked trips table; adjust table/model name if needed
            $table->foreignId('trip_id')->constrained('bookmarked_trips')->cascadeOnDelete();
            $table->timestamp('expires_at')->nullable(); // null = never expires
            $table->timestamps();

            $table->index(['trip_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('share_links');
    }
};
