<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class unites extends Model
{
    use HasFactory;

    protected $table = 'unites';

    protected $fillable = [
        'nom',
        'symbole',
    ];

    public function produits()
    {
        return $this->hasMany(produits::class, 'unite_id');
    }
}
