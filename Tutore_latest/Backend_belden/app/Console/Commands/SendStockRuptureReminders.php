<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\StockRuptureReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class SendStockRuptureReminders extends Command
{
    protected $signature = 'notifications:stock-rupture-reminders';

    protected $description = 'Send a daily reminder to admins for products that are out of stock.';

    public function handle(): int
    {
        $ruptureRows = DB::table('v_stock_disponible')
            ->select(['id', 'code', 'nom', 'stock_actuel'])
            ->where('stock_actuel', '<=', 0)
            ->orderBy('nom')
            ->get();

        if ($ruptureRows->isEmpty()) {
            $this->info('No stock rupture products found.');

            return self::SUCCESS;
        }

        $admins = User::query()->where('role', 'admin')->get();

        if ($admins->isEmpty()) {
            $this->warn('No admin users found.');

            return self::SUCCESS;
        }

        $products = $ruptureRows->map(static fn ($row) => [
            'id' => (int) $row->id,
            'code' => $row->code,
            'nom' => $row->nom,
            'stock_actuel' => (int) $row->stock_actuel,
        ])->all();

        Notification::send($admins, new StockRuptureReminderNotification([
            'count' => count($products),
            'products' => $products,
            'message' => count($products) === 1
                ? 'Un produit est en rupture de stock. Merci de l’approvisionner.'
                : count($products) . ' produits sont en rupture de stock. Merci de les approvisionner.',
        ]));

        $this->info('Stock rupture reminder notification sent to admins.');

        return self::SUCCESS;
    }
}