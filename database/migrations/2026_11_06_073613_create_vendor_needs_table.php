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
        Schema::create('vendor_needs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('category');
            $table->text('specification')->nullable();
            $table->unsignedBigInteger('allocated_budget')->default(0);
            $table->unsignedSmallInteger('allocation_basis_points')->nullable();
            $table->boolean('is_vital')->default(false);
            $table->string('procurement_status')->default('drafting');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_needs');
    }
};
