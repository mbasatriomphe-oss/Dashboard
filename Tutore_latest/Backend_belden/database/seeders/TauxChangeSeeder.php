<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TauxChangeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer les devises USD et CDF avec DB
        $usd = DB::table('devises')->where('code', 'USD')->first();
        $cdf = DB::table('devises')->where('code', 'CDF')->first();

        // Vérifier que les deux devises existent
        if (!$usd || !$cdf) {
            $this->command->error('Les devises USD et/ou CDF ne sont pas trouvées.');
            $this->command->info('Veuillez exécuter DeviseSeeder d\'abord.');
            return;
        }

        // Supprimer les anciens taux pour éviter les conflits
        DB::table('taux')->where('devise_source', $usd->id)->where('devise_but', $cdf->id)->delete();
        DB::table('taux')->where('devise_source', $cdf->id)->where('devise_but', $usd->id)->delete();

        // Taux USD -> CDF (1 USD = 2500 CDF)
        DB::table('taux')->insert([
            'devise_source' => $usd->id,
            'devise_but' => $cdf->id,
            'valeur' => 2500.00,
            'date_effet' => Carbon::today(),
            'statut' => 'actif',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Taux CDF -> USD (2500 CDF = 1 USD)
        DB::table('taux')->insert([
            'devise_source' => $cdf->id,
            'devise_but' => $usd->id,
            'valeur' => 0.0004,
            'date_effet' => Carbon::today(),
            'statut' => 'actif',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('✅ Taux de change créés avec succès :');
        $this->command->info('- USD -> CDF : 2500,00');
        $this->command->info('- CDF -> USD : 0,0004');
    }
}