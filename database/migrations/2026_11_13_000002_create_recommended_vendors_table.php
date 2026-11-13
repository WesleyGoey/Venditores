<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recommended_vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->index();
            $table->text('description')->nullable();
            $table->string('contact')->nullable();
            $table->string('website')->nullable();
            $table->unsignedBigInteger('price_estimate')->nullable();
            $table->timestamps();
        });

        Schema::create('vendor_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recommended_vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['recommended_vendor_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_reviews');
        Schema::dropIfExists('recommended_vendors');
    }
};
