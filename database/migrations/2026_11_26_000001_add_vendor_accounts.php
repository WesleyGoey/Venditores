<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Vendor accounts own the vendors they list, and the admin approves each one before users see it.
 * Both changes are additive with safe defaults, so code that predates them keeps working:
 * every existing vendor stays approved and every existing user is not a vendor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_vendor')->default(false)->after('is_admin');
        });

        Schema::table('recommended_vendors', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('approved')->after('price_estimate')->index();
            $table->text('admin_note')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('recommended_vendors', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['status', 'admin_note']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_vendor');
        });
    }
};
