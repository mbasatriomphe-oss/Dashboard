"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  UserPlus,
  UserCog,
  Trash2,
  Edit,
  MoreVertical,
  Store,
  ShoppingBag,
  Bell,
  Shield,
  Palette,
  Globe,
  DollarSign,
  Package,
  AlertTriangle,
  Save,
  RefreshCw,
  Upload,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  Printer,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Key,
  LogOut,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
} from "lucide-react"
import { toast } from "sonner"

// ==================== TYPES ====================

interface Seller {
  id: string
  name: string
  email: string
  phone: string
  role: "admin" | "manager" | "cashier" | "seller"
  status: "active" | "inactive"
  password: string
  hireDate: string
  avatar?: string
  commission?: number
  hourlyRate?: number
  salesTarget?: number
  permissions: {
    viewSales: boolean
    editProducts: boolean
    manageStock: boolean
    viewReports: boolean
    manageUsers: boolean
    manageSettings: boolean
  }
}

interface StoreInfo {
  name: string
  logo: string
  address: string
  phone: string
  email: string
  website: string
  taxNumber: string
  currency: string
  timezone: string
  businessHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
}

interface AlertSettings {
  lowStockThreshold: number
  criticalStockThreshold: number
  outOfStockAlert: boolean
  lowStockAlert: boolean
  dailyReportEmail: boolean
  weeklyReportEmail: boolean
  reportRecipients: string[]
}

interface InvoiceSettings {
  headerText: string
  footerText: string
  invoicePrefix: string
  nextInvoiceNumber: number
  showTaxDetails: boolean
  taxRate: number
  currencySymbol: string
}

interface AppearanceSettings {
  theme: "light" | "dark" | "system"
  primaryColor: string
  sidebarCollapsed: boolean
  tableDensity: "compact" | "normal" | "comfortable"
  showAnimations: boolean
}

// ==================== DONNÉES INITIALES ====================

const initialSellers: Seller[] = [
  {
    id: "V001",
    name: "Sophie Martin",
    email: "sophie.martin@boutique.com",
    phone: "+33 6 12 34 56 78",
    role: "admin",
    status: "active",
    password: "******",
    hireDate: "2023-01-15",
    commission: 5,
    hourlyRate: 15,
    salesTarget: 10000,
    permissions: {
      viewSales: true,
      editProducts: true,
      manageStock: true,
      viewReports: true,
      manageUsers: true,
      manageSettings: true,
    },
  },
  {
    id: "V002",
    name: "Thomas Bernard",
    email: "thomas.bernard@boutique.com",
    phone: "+33 6 23 45 67 89",
    role: "manager",
    status: "active",
    password: "******",
    hireDate: "2023-03-20",
    commission: 3,
    hourlyRate: 14,
    salesTarget: 8000,
    permissions: {
      viewSales: true,
      editProducts: true,
      manageStock: true,
      viewReports: true,
      manageUsers: false,
      manageSettings: false,
    },
  },
  {
    id: "V003",
    name: "Julie Petit",
    email: "julie.petit@boutique.com",
    phone: "+33 6 34 56 78 90",
    role: "cashier",
    status: "active",
    password: "******",
    hireDate: "2023-06-10",
    commission: 2,
    hourlyRate: 12,
    salesTarget: 5000,
    permissions: {
      viewSales: true,
      editProducts: false,
      manageStock: false,
      viewReports: false,
      manageUsers: false,
      manageSettings: false,
    },
  },
  {
    id: "V004",
    name: "Nicolas Durand",
    email: "nicolas.durand@boutique.com",
    phone: "+33 6 45 67 89 01",
    role: "seller",
    status: "inactive",
    password: "******",
    hireDate: "2022-11-01",
    commission: 4,
    hourlyRate: 13,
    salesTarget: 7000,
    permissions: {
      viewSales: true,
      editProducts: false,
      manageStock: true,
      viewReports: true,
      manageUsers: false,
      manageSettings: false,
    },
  },
]

const initialStoreInfo: StoreInfo = {
  name: "Ma Boutique",
  logo: "",
  address: "123 Rue du Commerce, 75001 Paris, France",
  phone: "+33 1 23 45 67 89",
  email: "contact@maboutique.com",
  website: "www.maboutique.com",
  taxNumber: "FR123456789",
  currency: "EUR",
  timezone: "Europe/Paris",
  businessHours: {
    monday: { open: "09:00", close: "19:00", closed: false },
    tuesday: { open: "09:00", close: "19:00", closed: false },
    wednesday: { open: "09:00", close: "19:00", closed: false },
    thursday: { open: "09:00", close: "19:00", closed: false },
    friday: { open: "09:00", close: "19:00", closed: false },
    saturday: { open: "10:00", close: "18:00", closed: false },
    sunday: { open: "00:00", close: "00:00", closed: true },
  },
}

const initialAlertSettings: AlertSettings = {
  lowStockThreshold: 10,
  criticalStockThreshold: 5,
  outOfStockAlert: true,
  lowStockAlert: true,
  dailyReportEmail: true,
  weeklyReportEmail: false,
  reportRecipients: ["admin@boutique.com", "manager@boutique.com"],
}

const initialInvoiceSettings: InvoiceSettings = {
  headerText: "Merci de votre visite !",
  footerText: "Retour possible sous 14 jours",
  invoicePrefix: "INV",
  nextInvoiceNumber: 1001,
  showTaxDetails: true,
  taxRate: 20,
  currencySymbol: "€",
}

const initialAppearance: AppearanceSettings = {
  theme: "system",
  primaryColor: "#6366f1",
  sidebarCollapsed: false,
  tableDensity: "normal",
  showAnimations: true,
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function AdminSettingsPage() {
  const [sellers, setSellers] = useState<Seller[]>(initialSellers)
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(initialStoreInfo)
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(initialAlertSettings)
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(initialInvoiceSettings)
  const [appearance, setAppearance] = useState<AppearanceSettings>(initialAppearance)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null)
  const [formData, setFormData] = useState<Partial<Seller>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Filtrer les vendeurs
  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || seller.role === roleFilter
    const matchesStatus = statusFilter === "all" || seller.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // Statistiques des vendeurs
  const stats = {
    total: sellers.length,
    active: sellers.filter(s => s.status === "active").length,
    inactive: sellers.filter(s => s.status === "inactive").length,
    admin: sellers.filter(s => s.role === "admin").length,
    manager: sellers.filter(s => s.role === "manager").length,
    cashier: sellers.filter(s => s.role === "cashier").length,
    seller: sellers.filter(s => s.role === "seller").length,
  }

  // Ajouter un vendeur
  const handleAddSeller = () => {
    const newSeller: Seller = {
      id: `V${String(sellers.length + 1).padStart(3, "0")}`,
      name: formData.name || "Nouveau Vendeur",
      email: formData.email || "nouveau@boutique.com",
      phone: formData.phone || "",
      role: formData.role || "seller",
      status: "active",
      password: "temp123",
      hireDate: new Date().toISOString().split("T")[0],
      commission: formData.commission || 2,
      hourlyRate: formData.hourlyRate || 12,
      salesTarget: formData.salesTarget || 5000,
      permissions: {
        viewSales: formData.permissions?.viewSales ?? true,
        editProducts: formData.permissions?.editProducts ?? false,
        manageStock: formData.permissions?.manageStock ?? false,
        viewReports: formData.permissions?.viewReports ?? false,
        manageUsers: formData.permissions?.manageUsers ?? false,
        manageSettings: formData.permissions?.manageSettings ?? false,
      },
    }
    setSellers([...sellers, newSeller])
    setIsDialogOpen(false)
    setEditingSeller(null)
    setFormData({})
    toast.success("Vendeur ajouté avec succès")
  }

  // Modifier un vendeur
  const handleEditSeller = () => {
    if (!editingSeller) return
    setSellers(sellers.map(s => s.id === editingSeller.id ? { ...s, ...formData } : s))
    setIsDialogOpen(false)
    setEditingSeller(null)
    setFormData({})
    toast.success("Vendeur modifié avec succès")
  }

  // Supprimer un vendeur
  const handleDeleteSeller = (id: string) => {
    setSellers(sellers.filter(s => s.id !== id))
    toast.success("Vendeur supprimé")
  }

  // Changer le statut
  const handleToggleStatus = (id: string) => {
    setSellers(sellers.map(s => 
      s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s
    ))
    toast.success("Statut mis à jour")
  }

  // Ouvrir le dialogue d'édition
  const openEditDialog = (seller: Seller) => {
    setEditingSeller(seller)
    setFormData(seller)
    setIsDialogOpen(true)
  }

  // Sauvegarder les paramètres de la boutique
  const handleSaveStoreSettings = () => {
    toast.success("Paramètres de la boutique sauvegardés")
  }

  // Sauvegarder les alertes
  const handleSaveAlerts = () => {
    toast.success("Paramètres d'alertes sauvegardés")
  }

  // Sauvegarder les factures
  const handleSaveInvoice = () => {
    toast.success("Paramètres de facturation sauvegardés")
  }

  // Sauvegarder l'apparence
  const handleSaveAppearance = () => {
    // Appliquer le thème
    if (appearance.theme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (appearance.theme === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
    toast.success("Apparence sauvegardée")
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      cashier: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      seller: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    }
    const labels = {
      admin: "Admin",
      manager: "Manager",
      cashier: "Caissier",
      seller: "Vendeur",
    }
    return <Badge className={styles[role as keyof typeof styles]}>{labels[role as keyof typeof labels]}</Badge>
  }

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Actif</Badge>
    }
    return <Badge variant="outline" className="text-muted-foreground">Inactif</Badge>
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez votre boutique, vos vendeurs et personnalisez l'application
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="sellers" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="sellers">
            <Users className="h-4 w-4 mr-2" />
            Vendeurs
          </TabsTrigger>
          <TabsTrigger value="store">
            <Store className="h-4 w-4 mr-2" />
            Boutique
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alertes
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <CreditCard className="h-4 w-4 mr-2" />
            Facturation
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Apparence
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        {/* ==================== ONGLET VENDEURS ==================== */}
        <TabsContent value="sellers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Gestion des Vendeurs</CardTitle>
                  <CardDescription>
                    Ajoutez, modifiez ou supprimez des vendeurs et gérez leurs permissions
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingSeller(null); setFormData({}); }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter un vendeur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingSeller ? "Modifier le vendeur" : "Ajouter un vendeur"}</DialogTitle>
                      <DialogDescription>
                        Remplissez les informations du vendeur
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nom complet *</Label>
                          <Input
                            value={formData.name || ""}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Jean Dupont"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={formData.email || ""}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="jean@boutique.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Téléphone</Label>
                          <Input
                            value={formData.phone || ""}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+33 6 12 34 56 78"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rôle *</Label>
                          <Select
                            value={formData.role || "seller"}
                            onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrateur</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="cashier">Caissier</SelectItem>
                              <SelectItem value="seller">Vendeur</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Commission (%)</Label>
                          <Input
                            type="number"
                            value={formData.commission || 2}
                            onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Taux horaire (€)</Label>
                          <Input
                            type="number"
                            value={formData.hourlyRate || 12}
                            onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Objectif de vente (€/mois)</Label>
                        <Input
                          type="number"
                          value={formData.salesTarget || 5000}
                          onChange={(e) => setFormData({ ...formData, salesTarget: parseFloat(e.target.value) })}
                        />
                      </div>
                      <Separator />
                      <div>
                        <Label className="mb-2 block">Permissions</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="viewSales"
                              checked={formData.permissions?.viewSales ?? true}
                              onCheckedChange={(checked) => 
                                setFormData({ ...formData, permissions: { ...formData.permissions, viewSales: !!checked } })
                              }
                            />
                            <Label htmlFor="viewSales">Voir les ventes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editProducts"
                              checked={formData.permissions?.editProducts ?? false}
                              onCheckedChange={(checked) => 
                                setFormData({ ...formData, permissions: { ...formData.permissions, editProducts: !!checked } })
                              }
                            />
                            <Label htmlFor="editProducts">Modifier les produits</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="manageStock"
                              checked={formData.permissions?.manageStock ?? false}
                              onCheckedChange={(checked) => 
                                setFormData({ ...formData, permissions: { ...formData.permissions, manageStock: !!checked } })
                              }
                            />
                            <Label htmlFor="manageStock">Gérer les stocks</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="viewReports"
                              checked={formData.permissions?.viewReports ?? false}
                              onCheckedChange={(checked) => 
                                setFormData({ ...formData, permissions: { ...formData.permissions, viewReports: !!checked } })
                              }
                            />
                            <Label htmlFor="viewReports">Voir les rapports</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="manageUsers"
                              checked={formData.permissions?.manageUsers ?? false}
                              onCheckedChange={(checked) => 
                                setFormData({ ...formData, permissions: { ...formData.permissions, manageUsers: !!checked } })
                              }
                            />
                            <Label htmlFor="manageUsers">Gérer les utilisateurs</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="manageSettings"
                              checked={formData.permissions?.manageSettings ?? false}
                              onCheckedChange={(checked) => 
                                setFormData({ ...formData, permissions: { ...formData.permissions, manageSettings: !!checked } })
                              }
                            />
                            <Label htmlFor="manageSettings">Gérer les paramètres</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={editingSeller ? handleEditSeller : handleAddSeller}>
                        <Save className="h-4 w-4 mr-2" />
                        {editingSeller ? "Modifier" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Actifs</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                  <p className="text-xs text-muted-foreground">Inactifs</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.admin + stats.manager}</p>
                  <p className="text-xs text-muted-foreground">Managers</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.cashier}</p>
                  <p className="text-xs text-muted-foreground">Caissiers</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{stats.seller}</p>
                  <p className="text-xs text-muted-foreground">Vendeurs</p>
                </div>
              </div>

              {/* Filtres */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un vendeur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Caissier</SelectItem>
                    <SelectItem value="seller">Vendeur</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tableau des vendeurs */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendeur</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Objectif</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date d'embauche</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {seller.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{seller.name}</p>
                              <p className="text-xs text-muted-foreground">{seller.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{seller.email}</p>
                            <p className="text-muted-foreground">{seller.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(seller.role)}</TableCell>
                        <TableCell>{seller.commission}%</TableCell>
                        <TableCell>${seller.salesTarget?.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(seller.status)}</TableCell>
                        <TableCell>{seller.hireDate}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(seller)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(seller.id)}>
                                {seller.status === "active" ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Activer
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteSeller(seller.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ONGLET BOUTIQUE ==================== */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Informations de la Boutique</CardTitle>
              <CardDescription>
                Modifiez les informations générales de votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nom de la boutique *</Label>
                  <Input
                    value={storeInfo.name}
                    onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                    placeholder="Ma Boutique"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={storeInfo.logo}
                      onChange={(e) => setStoreInfo({ ...storeInfo, logo: e.target.value })}
                      placeholder="https://..."
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Textarea
                    value={storeInfo.address}
                    onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                    placeholder="Adresse complète"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={storeInfo.phone}
                    onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={storeInfo.email}
                    onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                    placeholder="contact@boutique.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site web</Label>
                  <Input
                    value={storeInfo.website}
                    onChange={(e) => setStoreInfo({ ...storeInfo, website: e.target.value })}
                    placeholder="www.boutique.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numéro de TVA</Label>
                  <Input
                    value={storeInfo.taxNumber}
                    onChange={(e) => setStoreInfo({ ...storeInfo, taxNumber: e.target.value })}
                    placeholder="FR123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Select
                    value={storeInfo.currency}
                    onValueChange={(value) => setStoreInfo({ ...storeInfo, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dollar ($)</SelectItem>
                      <SelectItem value="GBP">Livre (£)</SelectItem>
                      <SelectItem value="XAF">Franc CFA (FCFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Select
                    value={storeInfo.timezone}
                    onValueChange={(value) => setStoreInfo({ ...storeInfo, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/New_York">America/New York</SelectItem>
                      <SelectItem value="Africa/Douala">Africa/Douala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              <div>
                <Label className="mb-3 block">Horaires d'ouverture</Label>
                <div className="space-y-2">
                  {Object.entries(storeInfo.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 p-2 bg-muted/20 rounded-lg">
                      <div className="w-32 font-medium capitalize">{day}</div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`closed-${day}`}
                          checked={hours.closed}
                          onCheckedChange={(checked) => 
                            setStoreInfo({
                              ...storeInfo,
                              businessHours: {
                                ...storeInfo.businessHours,
                                [day]: { ...hours, closed: !!checked }
                              }
                            })
                          }
                        />
                        <Label htmlFor={`closed-${day}`}>Fermé</Label>
                      </div>
                      {!hours.closed && (
                        <>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => 
                              setStoreInfo({
                                ...storeInfo,
                                businessHours: {
                                  ...storeInfo.businessHours,
                                  [day]: { ...hours, open: e.target.value }
                                }
                              })
                            }
                            className="w-32"
                          />
                          <span>→</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => 
                              setStoreInfo({
                                ...storeInfo,
                                businessHours: {
                                  ...storeInfo.businessHours,
                                  [day]: { ...hours, close: e.target.value }
                                }
                              })
                            }
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveStoreSettings} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les informations
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ONGLET ALERTES ==================== */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertes et Notifications</CardTitle>
              <CardDescription>
                Configurez les alertes de stock et les notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Seuil d'alerte stock faible</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={alertSettings.lowStockThreshold}
                      onChange={(e) => setAlertSettings({ ...alertSettings, lowStockThreshold: parseInt(e.target.value) })}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">unités</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Alerte quand le stock descend en dessous de ce seuil</p>
                </div>
                <div className="space-y-2">
                  <Label>Seuil critique</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={alertSettings.criticalStockThreshold}
                      onChange={(e) => setAlertSettings({ ...alertSettings, criticalStockThreshold: parseInt(e.target.value) })}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">unités</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Alerte critique quand le stock est très bas</p>
                </div>
              </div>

              <Separator />
              <div className="space-y-3">
                <Label>Activer les alertes</Label>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Alertes rupture de stock</p>
                    <p className="text-sm text-muted-foreground">Notification quand un produit est en rupture</p>
                  </div>
                  <Switch
                    checked={alertSettings.outOfStockAlert}
                    onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, outOfStockAlert: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Alertes stock faible</p>
                    <p className="text-sm text-muted-foreground">Notification quand un produit atteint le seuil faible</p>
                  </div>
                  <Switch
                    checked={alertSettings.lowStockAlert}
                    onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, lowStockAlert: checked })}
                  />
                </div>
              </div>

              <Separator />
              <div className="space-y-3">
                <Label>Rapports par email</Label>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Rapport quotidien</p>
                    <p className="text-sm text-muted-foreground">Reçu chaque matin à 8h00</p>
                  </div>
                  <Switch
                    checked={alertSettings.dailyReportEmail}
                    onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, dailyReportEmail: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Rapport hebdomadaire</p>
                    <p className="text-sm text-muted-foreground">Reçu chaque lundi</p>
                  </div>
                  <Switch
                    checked={alertSettings.weeklyReportEmail}
                    onCheckedChange={(checked) => setAlertSettings({ ...alertSettings, weeklyReportEmail: checked })}
                  />
                </div>
                <div className="space-y-2 mt-3">
                  <Label>Destinataires des rapports</Label>
                  <div className="flex flex-wrap gap-2">
                    {alertSettings.reportRecipients.map((email, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {email}
                        <button
                          onClick={() => {
                            setAlertSettings({
                              ...alertSettings,
                              reportRecipients: alertSettings.reportRecipients.filter((_, i) => i !== idx)
                            })
                          }}
                          className="ml-1 hover:text-red-500"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const email = prompt("Entrez l'adresse email :")
                        if (email) {
                          setAlertSettings({
                            ...alertSettings,
                            reportRecipients: [...alertSettings.reportRecipients, email]
                          })
                        }
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveAlerts}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les alertes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ONGLET FACTURATION ==================== */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Facturation</CardTitle>
              <CardDescription>
                Personnalisez vos factures et tickets de caisse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>En-tête du ticket</Label>
                  <Input
                    value={invoiceSettings.headerText}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, headerText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pied de page du ticket</Label>
                  <Input
                    value={invoiceSettings.footerText}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Préfixe des factures</Label>
                  <Input
                    value={invoiceSettings.invoicePrefix}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoicePrefix: e.target.value })}
                    placeholder="INV"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prochain numéro de facture</Label>
                  <Input
                    type="number"
                    value={invoiceSettings.nextInvoiceNumber}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, nextInvoiceNumber: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taux de TVA (%)</Label>
                  <Input
                    type="number"
                    value={invoiceSettings.taxRate}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, taxRate: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Symbole de la devise</Label>
                  <Input
                    value={invoiceSettings.currencySymbol}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, currencySymbol: e.target.value })}
                    placeholder="€"
                    className="w-20"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showTaxDetails"
                  checked={invoiceSettings.showTaxDetails}
                  onCheckedChange={(checked) => setInvoiceSettings({ ...invoiceSettings, showTaxDetails: !!checked })}
                />
                <Label htmlFor="showTaxDetails">Afficher les détails de la TVA sur les tickets</Label>
              </div>

              {/* Aperçu du ticket */}
              <Separator />
              <div>
                <Label className="mb-2 block">Aperçu du ticket</Label>
                <div className="border rounded-lg p-4 bg-muted/20 font-mono text-sm">
                  <div className="text-center border-b pb-2 mb-2">
                    <p className="font-bold">{storeInfo.name}</p>
                    <p className="text-xs">{storeInfo.address}</p>
                    <p className="text-xs">Tel: {storeInfo.phone}</p>
                  </div>
                  <p className="text-center text-xs text-muted-foreground mb-2">{invoiceSettings.headerText}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Produit 1</span>
                      <span>10.00{invoiceSettings.currencySymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produit 2</span>
                      <span>15.00{invoiceSettings.currencySymbol}</span>
                    </div>
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between font-bold">
                      <span>TOTAL</span>
                      <span>25.00{invoiceSettings.currencySymbol}</span>
                    </div>
                    {invoiceSettings.showTaxDetails && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Dont TVA ({invoiceSettings.taxRate}%)</span>
                        <span>4.17{invoiceSettings.currencySymbol}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-2">{invoiceSettings.footerText}</p>
                  <div className="text-center border-t pt-2 mt-2 text-xs">
                    <p>N° {invoiceSettings.invoicePrefix}-{invoiceSettings.nextInvoiceNumber}</p>
                    <p>{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveInvoice}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres de facturation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ONGLET APPARENCE ==================== */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Thème</Label>
                <RadioGroup
                  value={appearance.theme}
                  onValueChange={(value: any) => setAppearance({ ...appearance, theme: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Clair
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Sombre
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">Système</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Couleur principale</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={appearance.primaryColor}
                    onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={appearance.primaryColor}
                    onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                    className="w-32"
                  />
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: appearance.primaryColor }} />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Densité des tableaux</Label>
                <RadioGroup
                  value={appearance.tableDensity}
                  onValueChange={(value: any) => setAppearance({ ...appearance, tableDensity: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="compact" />
                    <Label htmlFor="compact">Compact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal">Normal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comfortable" id="comfortable" />
                    <Label htmlFor="comfortable">Confortable</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Animations</p>
                  <p className="text-sm text-muted-foreground">Activer les animations et transitions</p>
                </div>
                <Switch
                  checked={appearance.showAnimations}
                  onCheckedChange={(checked) => setAppearance({ ...appearance, showAnimations: checked })}
                />
              </div>

              <Button onClick={handleSaveAppearance}>
                <Save className="h-4 w-4 mr-2" />
                Appliquer l'apparence
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ONGLET SÉCURITÉ ==================== */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité et Accès</CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte et les accès
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Pour des raisons de sécurité, certaines actions nécessitent une vérification supplémentaire.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Changer le mot de passe</p>
                    <p className="text-sm text-muted-foreground">Modifiez votre mot de passe actuel</p>
                  </div>
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Authentification à deux facteurs</p>
                    <p className="text-sm text-muted-foreground">Sécurisez votre compte avec 2FA</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sessions actives</p>
                    <p className="text-sm text-muted-foreground">Gérez vos sessions ouvertes</p>
                  </div>
                  <Button variant="outline">Voir les sessions</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50 dark:bg-red-900/20">
                  <div>
                    <p className="font-medium text-red-600">Déconnexion de tous les appareils</p>
                    <p className="text-sm text-muted-foreground">Déconnectez-vous de tous les appareils</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Tout déconnecter
                  </Button>
                </div>
              </div>

              <Separator />
              <div>
                <Label className="mb-2 block">Journal d'activité</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="flex justify-between items-center p-2 text-sm border-b">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Connexion réussie</span>
                    </div>
                    <span className="text-muted-foreground">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 text-sm border-b">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-blue-500" />
                      <span>Ajout du vendeur Thomas Bernard</span>
                    </div>
                    <span className="text-muted-foreground">2024-01-15 14:30</span>
                  </div>
                  <div className="flex justify-between items-center p-2 text-sm border-b">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-amber-500" />
                      <span>Modification des paramètres</span>
                    </div>
                    <span className="text-muted-foreground">2024-01-14 09:22</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}