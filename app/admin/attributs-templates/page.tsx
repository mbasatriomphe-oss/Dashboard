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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Category { id: number; nom: string }
interface Attribut { id: number; nom: string }
interface AttributTemplate { id: number; categorie_id: number; attribut_id: number; obligatoire: boolean; est_visuel: boolean; attribut?: Attribut; categorie?: Category }
interface AttributeRow {
  id: string
  nom: string
  type_affichage: string
  obligatoire: boolean
  est_visuel: boolean
}

const EMPTY_FORM = {
  categorie_id: "",
  obligatoire: false,
  est_visuel: false,
}

const EMPTY_ATTRIBUTE_ROW = (): AttributeRow => ({
  id: "",
  nom: "",
  type_affichage: "text",
  obligatoire: false,
  est_visuel: false,
})

export default function AttributTemplatesPage() {
  const [items, setItems] = useState<AttributTemplate[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [attributs, setAttributs] = useState<Attribut[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState("")
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([EMPTY_ATTRIBUTE_ROW()])

  const addAttributeRow = () => {
    setAttributeRows(prev => [...prev, EMPTY_ATTRIBUTE_ROW()])
  }

  const removeAttributeRow = (rowIndex: number) => {
    setAttributeRows(prev => {
      if (prev.length === 1) {
        return [EMPTY_ATTRIBUTE_ROW()]
      }
      return prev.filter((_, index) => index !== rowIndex)
    })
  }

  const updateAttributeRow = (rowIndex: number, field: keyof AttributeRow, value: string | boolean) => {
    setAttributeRows(prev => prev.map((row, index) => index === rowIndex ? { ...row, [field]: value } : row))
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [templatesRes, categoriesRes, attributsRes] = await Promise.all([
        backendRequest<{ data: AttributTemplate[] }>("/attributs-templates"),
        backendRequest<{ data: Category[] }>("/categories"),
        backendRequest<{ data: Attribut[] }>("/attributs"),
      ])
      setItems(templatesRes.data ?? [])
      setCategories(categoriesRes.data ?? [])
      setAttributs(attributsRes.data ?? [])
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
      const categoryName = item.categorie?.nom ?? categories.find(c => c.id === item.categorie_id)?.nom ?? ""
      const attributName = item.attribut?.nom ?? attributs.find(a => a.id === item.attribut_id)?.nom ?? ""
      return `${categoryName} ${attributName}`.toLowerCase().includes(q)
    })
  }, [attributs, categories, items, search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.categorie_id) {
      setFormError("La catégorie est requise.")
      return
    }

    const validRows = attributeRows.filter(row => row.nom.trim() || row.id)
    if (validRows.length === 0) {
      setFormError("Ajoutez au moins un attribut à associer à cette catégorie.")
      return
    }

    setSaving(true)
    setFormError("")

    try {
      const categoryId = Number(formData.categorie_id)
      const payloads: Array<{ categorie_id: number; attribut_id: number; obligatoire: boolean; est_visuel: boolean }> = []

      for (const row of validRows) {
        const trimmedName = row.nom.trim()
        let chosenAttributId = row.id ? Number(row.id) : 0

        if (!chosenAttributId && trimmedName) {
          const existingMatch = attributs.find(item => item.nom.toLowerCase() === trimmedName.toLowerCase())
          if (existingMatch) {
            chosenAttributId = existingMatch.id
          } else {
            const createdRes = await backendRequest<{ data: Attribut }>('/attributs', {
              method: 'POST',
              body: JSON.stringify({
                nom: trimmedName,
                type_affichage: row.type_affichage || 'text',
              }),
            })

            const createdAttribut = createdRes.data ?? createdRes
            if (!createdAttribut || !('id' in createdAttribut)) {
              throw new Error('Impossible de créer l\'attribut.')
            }

            chosenAttributId = createdAttribut.id
            setAttributs(prev => [createdAttribut, ...prev.filter(item => item.id !== createdAttribut.id)])
          }
        }

        if (!chosenAttributId) {
          throw new Error(`L'attribut "${trimmedName || 'inconnu'}" est invalide.`)
        }

        payloads.push({
          categorie_id: categoryId,
          attribut_id: chosenAttributId,
          obligatoire: row.obligatoire ?? formData.obligatoire,
          est_visuel: row.est_visuel ?? formData.est_visuel,
        })
      }

      for (const payload of payloads) {
        await backendRequest('/attributs-templates', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setDialogOpen(false)
      setFormData(EMPTY_FORM)
      setAttributeRows([EMPTY_ATTRIBUTE_ROW()])
      await fetchData()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: AttributTemplate) => {
    if (!confirm("Supprimer ce mapping ?")) return
    try {
      await backendRequest(`/attributs-templates/${item.id}`, { method: "DELETE" })
      setItems(prev => prev.filter(entry => entry.id !== item.id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-cyan-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Catalogue</p>
          <h1 className="text-2xl font-bold lg:text-3xl">Modèles d’attributs</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchData()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau mapping
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
              placeholder="Rechercher une catégorie ou un attribut..."
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
            <div className="py-12 text-center text-muted-foreground">Aucun mapping trouvé.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Attribut</TableHead>
                  <TableHead>Obligatoire</TableHead>
                  <TableHead>Visuel</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.categorie?.nom ?? categories.find(c => c.id === item.categorie_id)?.nom ?? "—"}</TableCell>
                    <TableCell>{item.attribut?.nom ?? attributs.find(a => a.id === item.attribut_id)?.nom ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={item.obligatoire ? "default" : "secondary"}>{item.obligatoire ? "Oui" : "Non"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.est_visuel ? "default" : "secondary"}>{item.est_visuel ? "Oui" : "Non"}</Badge>
                    </TableCell>
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle>Nouveau mapping</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={formData.categorie_id} onValueChange={value => setFormData(prev => ({ ...prev, categorie_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={String(category.id)}>{category.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-2xl border border-dashed bg-gradient-to-br from-slate-50 to-cyan-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label className="text-sm font-semibold">Attributs à associer</Label>
                  <p className="text-xs text-muted-foreground">Reliez les attributs à la catégorie sélectionnée.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addAttributeRow}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>

              {attributeRows.map((row, index) => (
                <div key={index} className="space-y-3 rounded-md border bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attribut {index + 1}</span>
                    {attributeRows.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => removeAttributeRow(index)}>
                        Retirer
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Choisir un attribut existant</Label>
                    <Select value={row.id} onValueChange={value => updateAttributeRow(index, 'id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un attribut existant" />
                      </SelectTrigger>
                      <SelectContent>
                        {attributs.map(attribut => (
                          <SelectItem key={attribut.id} value={String(attribut.id)}>{attribut.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ou créer un nouvel attribut</Label>
                    <Input
                      value={row.nom}
                      onChange={e => updateAttributeRow(index, 'nom', e.target.value)}
                      placeholder="Ex: Taille, Matière, Couleur..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Type d’affichage</Label>
                    <Select value={row.type_affichage} onValueChange={value => updateAttributeRow(index, 'type_affichage', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texte</SelectItem>
                        <SelectItem value="color">Couleur</SelectItem>
                        <SelectItem value="select">Liste</SelectItem>
                        <SelectItem value="number">Nombre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="font-medium">Obligatoire</div>
                        <div className="text-sm text-muted-foreground">Requis</div>
                      </div>
                      <Switch checked={row.obligatoire} onCheckedChange={value => updateAttributeRow(index, 'obligatoire', value)} />
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="font-medium">Visuel</div>
                        <div className="text-sm text-muted-foreground">Image</div>
                      </div>
                      <Switch checked={row.est_visuel} onCheckedChange={value => updateAttributeRow(index, 'est_visuel', value)} />
                    </div>
                  </div>
                </div>
              ))}

              <p className="text-xs text-muted-foreground">
                Si un attribut n’existe pas, il sera créé puis associé directement à cette catégorie dans le même formulaire.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer les attributs
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
