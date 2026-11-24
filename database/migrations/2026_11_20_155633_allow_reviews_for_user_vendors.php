<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reviews can also be about a vendor a user entered themselves, which only has a name.
     */
    public function up(): void
    {
        Schema::table('vendor_reviews', function (Blueprint $table) {
            $table->foreignId('recommended_vendor_id')->nullable()->change();
            $table->string('vendor_name')->nullable()->after('recommended_vendor_id');
            $table->unique(['vendor_name', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('vendor_reviews', function (Blueprint $table) {
            $table->dropUnique(['vendor_name', 'user_id']);
            $table->dropColumn('vendor_name');
        });
    }
};
