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
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_need_id')->constrained()->cascadeOnDelete();
            $table->string('vendor_name');
            $table->string('vendor_contact')->nullable();
            $table->unsignedBigInteger('price');
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedTinyInteger('spec_score')->nullable();
            $table->unsignedTinyInteger('budget_score')->nullable();
            $table->unsignedTinyInteger('match_score')->nullable();
            $table->text('match_reason')->nullable();
            $table->timestamp('matched_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
