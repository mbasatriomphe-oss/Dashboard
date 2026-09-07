<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CaisseSoldeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $balances = [
            'USD' => 1000000.00000000,
            'CDF' => 2500000000.00000000,
        ];

        foreach ($balances as $code => $solde) {
            $devise = DB::table('devises')->where('code', $code)->first();

            if (! $devise) {
                continue;
            }

            DB::table('caisses')->updateOrInsert(
                ['id_devise' => $devise->id],
                [
                    'solde' => $solde,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        $this->command?->info('Caisses créditées avec succès pour les tests.');
    }
}
