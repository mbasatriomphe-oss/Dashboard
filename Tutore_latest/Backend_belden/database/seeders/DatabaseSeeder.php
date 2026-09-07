<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ordre d'exécution important pour respecter les contraintes de clés étrangères
        $this->call([
            DeviseSeeder::class,        // 1. Devise (singulier)
            UniteSeeder::class,         // 2. Unites (pluriel)
            CategorieSeeder::class,     // 3. Categories (pluriel)
            AdminUserSeeder::class,     // 4. User
            TauxChangeSeeder::class,    // Caisses initiales
            CaisseSoldeSeeder::class,   // Solde de test pour les approvisionnements
        ]);
    }
}
