"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, Edit, Filter, Loader2, MoreHorizontal, Package, Plus, RefreshCw, Search, Trash2, Upload, Image as ImageIcon } from "lucide-react"
import { backendRequest } from "@/app/services/backend"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

interface Category {
  id: number
  nom: string
}

interface Unite {
  id: number
  nom: string
  symbole: string
}

interface ProductRaw {
  id: number
  code: string
  nom: string
  description: string | null
  photo: string | null
  unite_id: number | null
  categorie_id: number
  has_variantes?: boolean
  prix_achat?: number | string | null
  prix_vente?: number | string | null
  quantite_stock?: number | string | null
  unite?: Unite
  categorie?: Category
}

interface Product extends ProductRaw {
  unite: Unite | undefined
  categorie: Category | undefined
}

interface ProductAttributeTemplate {
  id: number
  categorie_id: number
  attribut_id: number
  obligatoire?: boolean
  est_visuel?: boolean
  attribut?: {
    id: number
    nom: string
    type_affichage?: string | null
  }
}

interface VariantRow {
  id: number
  attribut: string
  valeur: string
  prix: string
  stock: string
}

const EMPTY_FORM = {
  nom: "",
  description: "",
  unite_id: "",
  categorie_id: "",
  has_variantes: false,
  prix_achat: "",
  prix_vente: "",
  quantite_stock: "",
}

const EMPTY_VARIANT_ROW = (): VariantRow => ({
  id: Date.now() + Math.random(),
  attribut: "",
  valeur: "",
  prix: "",
  stock: "",
})

function normalise(product: ProductRaw): Product {
  return {
    ...product,
    unite: product.unite,
    categorie: product.categorie,
  }
}

function getPhotoUrl(photo: string | null | undefined) {
  if (!photo) return "/placeholder.svg"
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("blob:")) return photo
  return `/storage/${photo.replace(/^\/+/, "")}`
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [unites, setUnites] = useState<Unite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedUnite, setSelectedUnite] = useState("all")
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const [variantRows, setVariantRows] = useState<VariantRow[]>([EMPTY_VARIANT_ROW()])
  const [categoryAttributes, setCategoryAttributes] = useState<Array<{ attributId: number; nom: string; valuesText: string }>>([])
  const [formError, setFormError] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")

  const fetchLookups = useCallback(async () => {
    const [catRes, uniteRes] = await Promise.all([
      backendRequest<{ data: Category[] }>("/categories?per_page=all"),
      backendRequest<{ data: Unite[] }>("/unites/all"),
    ])
    setCategories(catRes.data ?? [])
    setUnites(uniteRes.data ?? [])
  }, [])

  const fetchProducts = useCallback(async (search = "", category = "all", unite = "all") => {
    setIsLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ per_page: "0" })
      if (search.trim()) params.set("search", search.trim())
      if (category !== "all") params.set("categorie_id", category)
      if (unite !== "all") params.set("unite_id", unite)
      const res = await backendRequest<{ data: ProductRaw[] }>(`/produits?${params.toString()}`)
      setProducts((res.data ?? []).map(normalise))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await Promise.all([fetchLookups(), fetchProducts()])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur de chargement")
      }
    })()
  }, [fetchLookups, fetchProducts])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchInput, selectedCategory, selectedUnite)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, selectedCategory, selectedUnite, fetchProducts])

  const openCreate = () => {
    setEditing(null)
    setFormData({ ...EMPTY_FORM })
    setVariantRows([EMPTY_VARIANT_ROW()])
    setPhotoFile(null)
    setPhotoPreview("")
    setFormError("")
    setShowDialog(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setFormData({
      nom: product.nom,
      description: product.description ?? "",
      unite_id: product.unite_id ? String(product.unite_id) : "",
      categorie_id: String(product.categorie_id),
      has_variantes: Boolean(product.has_variantes),
      prix_achat: product.prix_achat != null ? String(product.prix_achat) : "",
      prix_vente: product.prix_vente != null ? String(product.prix_vente) : "",
      quantite_stock: product.quantite_stock != null ? String(product.quantite_stock) : "",
    })
    setVariantRows(product.has_variantes ? [EMPTY_VARIANT_ROW()] : [EMPTY_VARIANT_ROW()])
    setPhotoFile(null)
    setPhotoPreview(getPhotoUrl(product.photo))
    setFormError("")
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditing(null)
    setVariantRows([EMPTY_VARIANT_ROW()])
    setPhotoFile(null)
    setPhotoPreview("")
    setFormError("")
  }

  const resetFilters = () => {
    setSearchInput("")
    setSelectedCategory("all")
    setSelectedUnite("all")
  }

  const loadCategoryAttributes = useCallback(async (categoryId: string) => {
    if (!categoryId || !formData.has_variantes) {
      setCategoryAttributes([])
      return
    }

    try {
      const res = await backendRequest<{ data: ProductAttributeTemplate[] }>(`/attributs-templates?categorie_id=${categoryId}&per_page=all`)
      const items = (res.data ?? []).filter(item => item.attribut?.nom)
      setCategoryAttributes(
        items.map(item => ({
          attributId: item.attribut_id,
          nom: item.attribut?.nom ?? "Attribut",
          valuesText: "",
        }))
      )
    } catch {
      setCategoryAttributes([])
    }
  }, [formData.has_variantes])

  useEffect(() => {
    if (!formData.has_variantes || !formData.categorie_id) {
      setCategoryAttributes([])
      return
    }

    void loadCategoryAttributes(formData.categorie_id)
  }, [formData.categorie_id, formData.has_variantes, loadCategoryAttributes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nom.trim() || !formData.categorie_id) {
      setFormError("Le nom et la catégorie sont obligatoires.")
      return
    }

    if (!formData.has_variantes && !formData.unite_id) {
      setFormError("L'unité est obligatoire pour les produits simples.")
      return
    }

    if (formData.has_variantes) {
      const attributeGroups = categoryAttributes.length > 0
        ? categoryAttributes
        : variantRows.filter(row => row.attribut.trim() && row.valeur.trim())

      const hasValues = categoryAttributes.length > 0
        ? categoryAttributes.some(group => group.valuesText.split(",").map(v => v.trim()).filter(Boolean).length > 0)
        : attributeGroups.length > 0

      if (!hasValues) {
        setFormError("Complétez au moins une valeur pour chaque attribut de variante.")
        return
      }
    }

    setIsSaving(true)
    setFormError("")

    try {
      const body = new FormData()
      body.append("nom", formData.nom.trim())
      body.append("description", formData.description.trim())
      body.append("categorie_id", formData.categorie_id)
      body.append("has_variantes", formData.has_variantes ? "1" : "0")

      if (!formData.has_variantes && formData.unite_id) {
        body.append("unite_id", formData.unite_id)
      }

      if (!formData.has_variantes) {
        if (formData.prix_achat !== "") body.append("prix_achat", formData.prix_achat)
        if (formData.prix_vente !== "") body.append("prix_vente", formData.prix_vente)
        if (formData.quantite_stock !== "") body.append("quantite_stock", formData.quantite_stock)
      }

      if (photoFile) {
        body.append("photo_file", photoFile)
      }

      let createdProduct: ProductRaw | null = null

      if (editing) {
        body.append("_method", "PUT")
        const res = await backendRequest<{ data: ProductRaw }>(`/produits/${editing.id}`, {
          method: "POST",
          body,
        })
        createdProduct = res.data ?? null
        setProducts(prev => prev.map(p => p.id === editing.id ? normalise(res.data) : p))
      } else {
        const res = await backendRequest<{ data: ProductRaw }>("/produits", {
          method: "POST",
          body,
        })
        createdProduct = res.data ?? null
        setProducts(prev => [normalise(res.data), ...prev])
      }

      if (formData.has_variantes && createdProduct?.id) {
        const groups = categoryAttributes.length > 0
          ? categoryAttributes.map(attr => ({
              name: attr.nom,
              values: attr.valuesText.split(",").map(v => v.trim()).filter(Boolean),
            }))
          : variantRows
              .filter(row => row.attribut.trim() && row.valeur.trim())
              .map(row => ({
                name: row.attribut.trim(),
                values: [row.valeur.trim()],
              }))

        const validGroups = groups.filter(group => group.values.length > 0)
        if (validGroups.length > 0) {
          const combinations: Array<Record<string, string>> = [{}]

          for (const group of validGroups) {
            const nextCombinations: Array<Record<string, string>> = []
            for (const current of combinations) {
              for (const value of group.values) {
                nextCombinations.push({ ...current, [group.name]: value })
              }
            }
            combinations.length = 0
            combinations.push(...nextCombinations)
          }

          for (const combination of combinations) {
            await backendRequest("/variantes-produits", {
              method: "POST",
              body: JSON.stringify({
                produit_id: createdProduct.id,
                combinaison: combination,
                stock: 0,
                stock_alerte: 0,
              }),
            })
          }
        }
      }

      closeDialog()
      await fetchProducts(searchInput, selectedCategory, selectedUnite)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Supprimer le produit "${product.nom}" ?`)) return
    try {
      await backendRequest(`/produits/${product.id}`, { method: "DELETE" })
      setProducts(prev => prev.filter(p => p.id !== product.id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression")
    }
  }

  const visibleCount = useMemo(() => products.length, [products.length])
  const previewImage = photoPreview || (editing ? getPhotoUrl(editing.photo) : "")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-emerald-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Catalogue</p>
          <h1 className="text-2xl lg:text-3xl font-bold">Produits</h1>
          <p className="text-muted-foreground">Gestion complète reliée au backend Laravel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchProducts(searchInput, selectedCategory, selectedUnite)} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visibleCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unités</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unites.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher un produit..."
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedUnite} onValueChange={setSelectedUnite}>
              <SelectTrigger>
                <SelectValue placeholder="Unité" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">Toutes les unités</SelectItem>
                {unites.map(unite => (
                  <SelectItem key={unite.id} value={String(unite.id)}>{unite.nom} ({unite.symbole})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={resetFilters}>Réinitialiser les filtres</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
              Aucun produit trouvé.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">{product.code}</TableCell>
                    <TableCell className="font-medium">{product.nom}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.categorie?.nom ?? `#${product.categorie_id}`}</Badge>
                    </TableCell>
                    <TableCell>
                      {product.has_variantes ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Variantes</Badge>
                          <span className="text-xs text-muted-foreground">{product.quantite_stock ?? 0} / stock</span>
                        </div>
                      ) : (
                        <Badge variant="outline">{product.unite ? `${product.unite.nom} (${product.unite.symbole})` : `#${product.unite_id}`}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-muted-foreground">
                      {product.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product)}>
                            <Trash2 className="mr-2 h-4 w-4" />Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto flex-1 pr-1">
            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-4 rounded-2xl border bg-background p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="Nom du produit"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="categorie_id">Catégorie *</Label>
                    <Select value={formData.categorie_id} onValueChange={(value) => setFormData(prev => ({ ...prev, categorie_id: value }))}>
                      <SelectTrigger id="categorie_id">
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={String(cat.id)}>{cat.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="has_variantes">Produit avec variantes</Label>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <input
                      id="has_variantes"
                      type="checkbox"
                      checked={Boolean(formData.has_variantes)}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_variantes: e.target.checked, unite_id: e.target.checked ? "" : prev.unite_id }))}
                    />
                    <span className="text-sm">Oui, ce produit a des variantes</span>
                  </div>
                </div>

                {formData.has_variantes && (
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-medium">Aperçu des variantes</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Couleur</Badge>
                        <span>Noir, Blanc, Rouge</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Taille</Badge>
                        <span>S, M, L, XL</span>
                      </div>
                      <div className="rounded-md border bg-white p-2">
                        <span className="font-medium text-foreground">Exemples :</span> Noir / M, Blanc / L, Rouge / XL
                      </div>
                    </div>
                  </div>
                )}

                {!formData.has_variantes && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="unite_id">Unité *</Label>
                      <Select value={formData.unite_id} onValueChange={(value) => setFormData(prev => ({ ...prev, unite_id: value }))}>
                        <SelectTrigger id="unite_id">
                          <SelectValue placeholder="Choisir une unité" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {unites.map(unite => (
                            <SelectItem key={unite.id} value={String(unite.id)}>{unite.nom} ({unite.symbole})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {!formData.has_variantes && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="prix_achat">Prix d'achat</Label>
                      <Input id="prix_achat" type="number" min="0" step="0.01" value={formData.prix_achat} onChange={(e) => setFormData(prev => ({ ...prev, prix_achat: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prix_vente">Prix de vente</Label>
                      <Input id="prix_vente" type="number" min="0" step="0.01" value={formData.prix_vente} onChange={(e) => setFormData(prev => ({ ...prev, prix_vente: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="quantite_stock">Stock</Label>
                      <Input id="quantite_stock" type="number" min="0" step="1" value={formData.quantite_stock} onChange={(e) => setFormData(prev => ({ ...prev, quantite_stock: e.target.value }))} />
                    </div>
                  </div>
                )}

                {formData.has_variantes && (
                  <div className="space-y-3 rounded-lg border bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Attributs de la catégorie</p>
                    </div>

                    {categoryAttributes.length > 0 ? (
                      <div className="space-y-3">
                        {categoryAttributes.map((attribute) => (
                          <div key={attribute.attributId} className="rounded-md border bg-white p-3">
                            <Label className="mb-2 block font-medium">{attribute.nom}</Label>
                            <Input
                              value={attribute.valuesText}
                              placeholder="Valeurs séparées par des virgules, ex : Noir, Blanc, Rouge"
                              onChange={(e) => setCategoryAttributes(prev => prev.map(item => item.attributId === attribute.attributId ? { ...item, valuesText: e.target.value } : item))}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Aucun attribut configuré pour cette catégorie.</p>
                          <Button type="button" variant="outline" size="sm" onClick={() => setVariantRows(prev => [...prev, EMPTY_VARIANT_ROW()])}>
                            <Plus className="mr-2 h-4 w-4" /> Ajouter manuellement
                          </Button>
                        </div>

                        {variantRows.map((row) => (
                          <div key={row.id} className="grid gap-3 rounded-md border bg-white p-3 md:grid-cols-[1fr_1fr_auto]">
                            <div className="space-y-1">
                              <Label>Attribut</Label>
                              <Input
                                value={row.attribut}
                                placeholder="Couleur"
                                onChange={(e) => setVariantRows(prev => prev.map(item => item.id === row.id ? { ...item, attribut: e.target.value } : item))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Valeur</Label>
                              <Input
                                value={row.valeur}
                                placeholder="Rouge"
                                onChange={(e) => setVariantRows(prev => prev.map(item => item.id === row.id ? { ...item, valeur: e.target.value } : item))}
                              />
                            </div>
                            <div className="flex items-end pb-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive"
                                onClick={() => setVariantRows(prev => prev.length > 1 ? prev.filter(item => item.id !== row.id) : prev)}
                                disabled={variantRows.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Détails du produit, notes, ingrédients, etc."
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border bg-gradient-to-br from-slate-50 to-emerald-50 p-4">
                <div className="space-y-2">
                  <Label htmlFor="photo_file">Photo du produit</Label>
                  <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-white/70 p-4 text-center">
                    <div className="space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Choisir une image depuis la machine</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, WebP jusqu’à 4 Mo</p>
                      </div>
                      <Input
                        id="photo_file"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null
                          setPhotoFile(file)
                          setPhotoPreview(file ? URL.createObjectURL(file) : (editing ? getPhotoUrl(editing.photo) : ""))
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <Label>Aperçu</Label>
                  </div>
                  <div className="overflow-hidden rounded-2xl border bg-background">
                    {previewImage ? (
                      <img src={previewImage} alt="Aperçu produit" className="h-48 w-full object-cover" />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                        Aucune photo sélectionnée
                      </div>
                    )}
                  </div>
                  {photoFile && (
                    <p className="text-xs text-muted-foreground">
                      Fichier sélectionné : {photoFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
