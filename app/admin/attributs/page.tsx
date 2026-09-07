"use client"

import type React from "react"
import { AlertCircle, Edit, Loader2, MoreHorizontal, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { backendRequest } from "@/app/services/backend"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Attribut {
  id: number
  nom: string
  type_affichage?: string | null
}

const EMPTY_FORM = {
  nom: "",
  type_affichage: "text",
}

export default function AttributsPage() {
  const [items, setItems] = useState<Attribut[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Attribut | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState("")

  const fetchItems = useCallback(async (q = "") => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ per_page: "0" })
      if (q) params.set("search", q)
      const res = await backendRequest<{ data: Attribut[] }>(`/attributs?${params.toString()}`)
      setItems(res.data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchItems(search)
    }, 250)

    return () => clearTimeout(timer)
  }, [search, fetchItems])

  const openCreate = () => {
    setEditing(null)
    setFormData(EMPTY_FORM)
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (item: Attribut) => {
    setEditing(item)
    setFormData({
      nom: item.nom,
      type_affichage: item.type_affichage ?? "text",
    })
    setFormError("")
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
    setFormError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nom.trim()) {
      setFormError("Le nom est obligatoire.")
      return
    }

    setSaving(true)
    setFormError("")

    try {
      const payload = {
        nom: formData.nom.trim(),
        type_affichage: formData.type_affichage,
      }

      if (editing) {
        const res = await backendRequest<{ data: Attribut }>(`/attributs/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        setItems(prev => prev.map(item => item.id === editing.id ? res.data! : item))
      } else {
        const res = await backendRequest<{ data: Attribut }>("/attributs", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        setItems(prev => [res.data!, ...prev])
      }

      closeDialog()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: Attribut) => {
    if (!confirm(`Supprimer l'attribut "${item.nom}" ?`)) return

    try {
      await backendRequest(`/attributs/${item.id}`, { method: "DELETE" })
      setItems(prev => prev.filter(entry => entry.id !== item.id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-emerald-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Catalogue</p>
          <h1 className="text-2xl font-bold lg:text-3xl">Attributs</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchItems(search)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel attribut
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
              placeholder="Rechercher un attribut..."
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
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Aucun attribut trouvé.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nom}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.type_affichage ?? "text"}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => void handleDelete(item)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
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

      <Dialog open={dialogOpen} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'attribut" : "Nouvel attribut"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={e => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: Couleur"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_affichage">Type d'affichage</Label>
              <Select value={formData.type_affichage} onValueChange={value => setFormData(prev => ({ ...prev, type_affichage: value }))}>
                <SelectTrigger id="type_affichage">
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

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
