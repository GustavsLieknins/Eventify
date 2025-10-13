<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('visit_logs', function (Blueprint $table) {
            $table->decimal('lat', 10, 7)->nullable()->after('country')->index();
            $table->decimal('lng', 10, 7)->nullable()->after('lat')->index();
            $table->string('city', 128)->nullable()->after('lng');
            $table->string('region', 128)->nullable()->after('city');
        });
    }

    public function down(): void
    {
        Schema::table('visit_logs', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng', 'city', 'region']);
        });
    }
};
