<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class fournisseurs extends Model
{
    use HasFactory;

    protected $table = 'fournisseurs';

    protected $fillable = [
        'nom',
        'adresse',
        'ville',
        'pays',
        'contact',
    ];

    public function approvisionnements()
    {
        return $this->hasMany(approvisionnements::class, 'id_fournisseur');
    }
}
