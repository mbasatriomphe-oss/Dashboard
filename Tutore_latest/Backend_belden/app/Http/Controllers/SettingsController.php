<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    protected $file = 'settings.json';

    protected function readSettings()
    {
        if (!Storage::exists($this->file)) {
            return $this->defaultSettings();
        }
        $contents = Storage::get($this->file);
        $data = json_decode($contents, true);
        if (!is_array($data)) {
            return $this->defaultSettings();
        }
        return array_replace_recursive($this->defaultSettings(), $data);
    }

    protected function writeSettings(array $data)
    {
        Storage::put($this->file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    protected function defaultSettings()
    {
        return [
            'boutique' => [
                'nom' => 'Ma Boutique',
                'logo' => '',
                'adresse' => '',
                'telephone' => '',
                'email' => '',
                'site_web' => '',
                'numero_tva' => '',
                'devise' => 'EUR',
                'fuseau_horaire' => 'Europe/Paris',
            ],
            'horaires' => [],
            'alertes' => [
                'seuil_stock_faible' => 10,
                'seuil_stock_critique' => 5,
                'alerte_rupture' => true,
                'alerte_stock_faible' => true,
                'rapport_quotidien' => true,
                'rapport_hebdomadaire' => false,
                'destinataires_rapports' => [],
            ],
            'facturation' => [
                'en_tete_ticket' => 'Merci de votre visite !',
                'pied_page_ticket' => 'Retour possible sous 14 jours',
                'prefixe_facture' => 'INV',
                'prochain_numero' => 1001,
                'afficher_tva' => true,
                'taux_tva' => 20,
                'symbole_devise' => '€',
            ],
            'apparence' => [
                'theme' => 'system',
                'couleur_principale' => '#6366f1',
                'densite_tableau' => 'normal',
                'animations' => true,
            ],
        ];
    }

    // Boutique
    public function getStoreInfo()
    {
        $s = $this->readSettings();
        return response()->json(['status' => 'success', 'data' => $s['boutique']]);
    }

    public function updateStoreInfo(Request $request)
    {
        $s = $this->readSettings();
        $s['boutique'] = array_merge($s['boutique'], $request->all());
        $this->writeSettings($s);
        return response()->json(['status' => 'success', 'data' => $s['boutique']]);
    }

    // Horaires
    public function getStoreHours()
    {
        $s = $this->readSettings();
        return response()->json(['status' => 'success', 'data' => $s['horaires']]);
    }

    public function updateStoreHours(Request $request)
    {
        $s = $this->readSettings();
        $payload = $request->all();
        if (isset($payload['horaires'])) {
            $s['horaires'] = $payload['horaires'];
        } else {
            $s['horaires'] = $payload;
        }
        $this->writeSettings($s);
        return response()->json(['status' => 'success', 'data' => $s['horaires']]);
    }

    // Alertes
    public function getAlertSettings()
    {
        $s = $this->readSettings();
        return response()->json(['status' => 'success', 'data' => $s['alertes']]);
    }

    public function updateAlertSettings(Request $request)
    {
        $s = $this->readSettings();
        $s['alertes'] = array_merge($s['alertes'], $request->all());
        $this->writeSettings($s);
        return response()->json(['status' => 'success', 'data' => $s['alertes']]);
    }

    // Facturation
    public function getInvoiceSettings()
    {
        $s = $this->readSettings();
        return response()->json(['status' => 'success', 'data' => $s['facturation']]);
    }

    public function updateInvoiceSettings(Request $request)
    {
        $s = $this->readSettings();
        $s['facturation'] = array_merge($s['facturation'], $request->all());
        $this->writeSettings($s);
        return response()->json(['status' => 'success', 'data' => $s['facturation']]);
    }

    // Apparence
    public function getAppearance()
    {
        $s = $this->readSettings();
        return response()->json(['status' => 'success', 'data' => $s['apparence']]);
    }

    public function updateAppearance(Request $request)
    {
        $s = $this->readSettings();
        $s['apparence'] = array_merge($s['apparence'], $request->all());
        $this->writeSettings($s);
        return response()->json(['status' => 'success', 'data' => $s['apparence']]);
    }
}
