<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class retours extends Model
{
    use HasFactory;

    protected $table = 'retours';

    protected $fillable = [
        'code',
        'date_retour',
        'id_vente',
        'id_client',
        'id_vendeur',
        'motif',
        'commentaire',
    ];

    protected $casts = [
        'date_retour' => 'date',
    ];

    public function vente()
    {
        return $this->belongsTo(ventes::class, 'id_vente');
    }

    public function client()
    {
        return $this->belongsTo(clients::class, 'id_client');
    }

    public function vendeur()
    {
        return $this->belongsTo(vendeurs::class, 'id_vendeur');
    }

    public function lignes()
    {
        return $this->hasMany(ligne_retours::class, 'id_retour');
    }
}
