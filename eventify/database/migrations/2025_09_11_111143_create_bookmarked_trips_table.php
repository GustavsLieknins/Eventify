<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bookmarked_trips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // reference to users table
            $table->string('title')->nullable(); // optional trip title
            $table->json('flights'); // store flights JSON
            $table->json('hotels');  // store hotels JSON
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookmarked_trips');
    }
};
