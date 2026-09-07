"use client"

import { useState } from "react"
import { useAuth } from "../context/auth-context"
import { backendRequest } from "../services/backend"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Store, Lock, User, AlertCircle, ShieldCheck, UserCog } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isVendeur, setIsVendeur] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const [signupData, setSignupData] = useState({
    nom: "",
    post_nom: "",
    prenom: "",
    email: "",
    password: "",
    password_confirmation: "",
  })

  const handleVendeurToggle = (checked) => {
    setIsVendeur(checked)
    setPassword("")
    setError("")
    setSuccess("")
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!email.trim() || !password.trim()) {
      setError(isVendeur ? "Veuillez entrer votre email et votre mot de passe vendeur" : "Veuillez entrer votre email et votre mot de passe")
      setIsLoading(false)
      return
    }

    const result = await login(email, password, isVendeur)

    if (!result.success) {
      setError(result.error)
    }

    setIsLoading(false)
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!signupData.nom.trim() || !signupData.prenom.trim() || !signupData.email.trim() || !signupData.password.trim()) {
      setError("Tous les champs obligatoires doivent être remplis.")
      setIsLoading(false)
      return
    }

    if (signupData.password !== signupData.password_confirmation) {
      setError("Les mots de passe ne correspondent pas.")
      setIsLoading(false)
      return
    }

    try {
      const payload = await backendRequest("/register", {
        method: "POST",
        body: JSON.stringify(signupData),
      })

      setSuccess("Compte créé avec succès. Vous pouvez maintenant vous connecter.")
      setIsSignUp(false)
      setSignupData({ nom: "", post_nom: "", prenom: "", email: "", password: "", password_confirmation: "" })
      setEmail(payload.user?.email || signupData.email)
      setPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#0f172a_50%,_#020817)] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4 lg:p-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
          <div className="hidden relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 p-8 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.32),_transparent_40%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center rounded-2xl bg-white/15 p-3 backdrop-blur-md">
                <Store className="h-9 w-9 text-white" />
              </div>
              <h1 className="mt-8 text-4xl font-black tracking-tight">Belden Store</h1>
              <p className="mt-3 max-w-sm text-sm text-emerald-50/80">
                Gérez vos ventes, les produits et les clients dans une expérience moderne pensée pour le commerce en ligne.
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Bénéfice</p>
                <p className="mt-2 text-2xl font-bold">+42%</p>
                <p className="text-sm text-emerald-50/80">Croissance des ventes en ligne</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-2xl font-bold">18k</p>
                  <p className="text-xs text-emerald-50/80">Produits gérés</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-2xl font-bold">4.8/5</p>
                  <p className="text-xs text-emerald-50/80">Expérience client</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-md">
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center rounded-2xl bg-emerald-500/15 p-3 text-emerald-400">
                  <Store className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-3xl font-bold text-white">{isSignUp ? "Créer un compte" : "Bienvenue"}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {isSignUp
                    ? "Rejoignez la boutique et commencez à acheter en ligne."
                    : "Connectez-vous pour accéder à votre espace."}
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4 border-red-500/30 bg-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-100">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription className="text-emerald-200">{success}</AlertDescription>
                </Alert>
              )}

              {!isSignUp ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                      isVendeur ? "border-amber-500/40 bg-amber-500/10" : "border-white/10 bg-white/5"
                    }`}
                    onClick={() => handleVendeurToggle(!isVendeur)}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${isVendeur ? "border-amber-500 bg-amber-500" : "border-slate-400"}`}>
                      {isVendeur && <span className="text-[10px] font-bold text-white">✓</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {isVendeur ? <UserCog className="h-4 w-4 text-amber-400" /> : <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                      <span className={isVendeur ? "text-amber-200" : "text-slate-200"}>
                        {isVendeur ? "Connexion vendeur" : "Connexion administrateur"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
                        placeholder={isVendeur ? "vendeur@email.com" : "admin@email.com"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-slate-500"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="h-12 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700">
                    {isLoading ? "Connexion..." : isVendeur ? "Se connecter en tant que vendeur" : "Se connecter"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Nom</label>
                      <Input value={signupData.nom} onChange={(e) => setSignupData({ ...signupData, nom: e.target.value })} className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500" placeholder="Nom" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Post-nom</label>
                      <Input value={signupData.post_nom} onChange={(e) => setSignupData({ ...signupData, post_nom: e.target.value })} className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500" placeholder="Post-nom" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Prénom</label>
                    <Input value={signupData.prenom} onChange={(e) => setSignupData({ ...signupData, prenom: e.target.value })} className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500" placeholder="Prénom" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email</label>
                    <Input type="email" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500" placeholder="vous@email.com" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Mot de passe</label>
                    <Input type="password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500" placeholder="••••••••" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Confirmer le mot de passe</label>
                    <Input type="password" value={signupData.password_confirmation} onChange={(e) => setSignupData({ ...signupData, password_confirmation: e.target.value })} className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500" placeholder="••••••••" />
                  </div>

                  <Button type="submit" disabled={isLoading} className="h-12 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700">
                    {isLoading ? "Création du compte..." : "Créer mon compte"}
                  </Button>
                </form>
              )}

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
                <span>{isSignUp ? "Vous avez déjà un compte ?" : "Pas encore inscrit ?"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError("")
                    setSuccess("")
                  }}
                  className="font-medium text-emerald-400 hover:text-emerald-300"
                >
                  {isSignUp ? "Se connecter" : "S'inscrire"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
