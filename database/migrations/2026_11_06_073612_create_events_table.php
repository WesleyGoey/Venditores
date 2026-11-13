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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('event_date');
            $table->string('location')->nullable();
            $table->unsignedBigInteger('total_budget');
            $table->text('description')->nullable();
            $table->string('proposal_path')->nullable();
            $table->string('proposal_original_name')->nullable();
            $table->string('status')->default('draft');
            $table->text('summary')->nullable();
            $table->string('scale')->nullable();
            $table->unsignedInteger('estimated_attendees')->nullable();
            $table->timestamp('analyzed_at')->nullable();
            $table->json('risk_advice')->nullable();
            $table->timestamp('risk_advised_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
