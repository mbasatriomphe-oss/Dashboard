<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class approvisionnements extends Model
{
    use HasFactory;

    protected $table = 'approvisionnements';

    protected $fillable = [
        'code',
        'date',
        'id_user',
        'id_fournisseur',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function fournisseur()
    {
        return $this->belongsTo(fournisseurs::class, 'id_fournisseur');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function lignes()
    {
        return $this->hasMany(ligne_approvisionnements::class, 'id_approvisionnement');
    }

    public function lots()
    {
        return $this->hasMany(lots::class, 'id_approvisionnement');
    }
}
