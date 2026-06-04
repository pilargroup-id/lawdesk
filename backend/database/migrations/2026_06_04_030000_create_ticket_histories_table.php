<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // siapa support yang melakukan aksi ini
            $table->unsignedBigInteger('support_id')->nullable();
            $table->string('support_name')->nullable();

            // status snapshot saat aksi ini dilakukan
            $table->string('status', 50)->default('waiting');

            // progress saat itu
            $table->unsignedTinyInteger('progres_percent')->default(0);

            // catatan / deskripsi aksi
            $table->text('notes')->nullable();

            // kapan aksi ini dilakukan
            $table->dateTime('action_date')->nullable();

            $table->timestamps();

            $table->index(['ticket_id', 'action_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_histories');
    }
};
