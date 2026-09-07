"use client"

import type React from "react"
import { AlertCircle, Loader2, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { backendRequest } from "@/app/services/backend"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Product { id: number; nom: string }
interface Variante {
  id: number
  produit_id: number
  combinaison: Record<string, string>
  prix?: number | string | null
  stock?: number | string | null
  stock_alerte?: number | string | null
  produit?: Product
}

const EMPTY_FORM = {
  produit_id: "",
  combinaison: "",
  prix: "",
  stock: "",
  stock_alerte: "",
}

export default function VariantesPage() {
  const [items, setItems] = useState<Variante[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [variantesRes, produitsRes] = await Promise.all([
        backendRequest<{ data: Variante[] }>("/variantes-produits"),
        backendRequest<{ data: Product[] }>("/produits"),
      ])
      setItems(variantesRes.data ?? [])
      setProducts(produitsRes.data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(item => {
      const productName = item.produit?.nom ?? products.find(p => p.id === item.produit_id)?.nom ?? ""
      const comboText = JSON.stringify(item.combinaison ?? {})
      return `${productName} ${comboText}`.toLowerCase().includes(q)
    })
  }, [items, products, search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.produit_id) {
      setFormError("Le produit est requis.")
      return
    }

    let parsedCombination: Record<string, string> = {}
    try {
      parsedCombination = JSON.parse(formData.combinaison || "{}")
    } catch {
      setFormError("La combinaison doit être un JSON valide.")
      return
    }

    setSaving(true)
    setFormError("")

    try {
      const payload = {
        produit_id: Number(formData.produit_id),
        combinaison: parsedCombination,
        prix: formData.prix ? Number(formData.prix) : null,
        stock: formData.stock ? Number(formData.stock) : 0,
        stock_alerte: formData.stock_alerte ? Number(formData.stock_alerte) : 0,
      }

      await backendRequest("/variantes-produits", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      setDialogOpen(false)
      setFormData(EMPTY_FORM)
      await fetchData()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: Variante) => {
    if (!confirm("Supprimer cette variante ?")) return
    try {
      await backendRequest(`/variantes-produits/${item.id}`, { method: "DELETE" })
      setItems(prev => prev.filter(entry => entry.id !== item.id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-violet-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Catalogue</p>
          <h1 className="text-2xl font-bold lg:text-3xl">Variantes</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle variante
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit ou une combinaison..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Aucune variante trouvée.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Combinaison</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.produit?.nom ?? products.find(p => p.id === item.produit_id)?.nom ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(item.combinaison ?? {}).map(([key, value]) => (
                          <Badge key={`${item.id}-${key}`} variant="secondary">{key}: {value}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{item.prix ?? "—"}</TableCell>
                    <TableCell>{item.stock ?? "0"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => void handleDelete(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={open => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nouvelle variante</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Produit</Label>
              <Select value={formData.produit_id} onValueChange={value => setFormData(prev => ({ ...prev, produit_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={String(product.id)}>{product.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="combinaison">Combinaison JSON</Label>
              <Input
                id="combinaison"
                value={formData.combinaison}
                onChange={e => setFormData(prev => ({ ...prev, combinaison: e.target.value }))}
                placeholder='{"Couleur": "Rouge", "Taille": "M"}'
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="prix">Prix</Label>
                <Input id="prix" type="number" step="0.01" value={formData.prix} onChange={e => setFormData(prev => ({ ...prev, prix: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_alerte">Stock alerte</Label>
                <Input id="stock_alerte" type="number" value={formData.stock_alerte} onChange={e => setFormData(prev => ({ ...prev, stock_alerte: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
