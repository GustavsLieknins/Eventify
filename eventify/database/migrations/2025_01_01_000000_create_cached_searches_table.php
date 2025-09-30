<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cached_searches', function (Blueprint $table) {
            $table->id();
            $table->string('key_hash', 64)->index();
            $table->json('params_json');

            $table->longText('payload_json')->nullable(); 
            $table->string('etag', 190)->nullable();

            $table->enum('status', ['fresh', 'stale', 'pending', 'error'])->default('pending')->index();
            $table->timestamp('fetched_at')->nullable()->index();
            $table->timestamp('refresh_after')->nullable()->index();
            $table->timestamp('expires_at')->nullable()->index();  

            $table->text('error_text')->nullable();

            $table->timestamps();

            $table->unique(['key_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cached_searches');
    }
};
