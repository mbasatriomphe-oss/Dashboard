<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ligne_approvisionnements', function (Blueprint $table) {
            $table->boolean('paye_par_caisse')->default(false)->after('id_devise');
        });
    }

    public function down(): void
    {
        Schema::table('ligne_approvisionnements', function (Blueprint $table) {
            $table->dropColumn('paye_par_caisse');
        });
    }
};
