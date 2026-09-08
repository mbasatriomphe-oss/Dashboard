"use client"

import { useState } from "react"
import { useAuth } from "../context/auth-context"
import { backendRequest } from "../services/backend"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, User, AlertCircle, ShieldCheck, UserCog, Utensils } from "lucide-react"

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
    <main className="relative min-h-screen overflow-hidden bg-[#f6f1e8] text-[#26332b]">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#d7e5c6]/70 blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[#f0c7a6]/70 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-4 sm:p-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#d9d1c3] bg-[#fffdf9]/90 shadow-[0_24px_80px_rgba(76,58,39,0.16)] lg:grid-cols-[0.92fr_1.08fr]">
          <section className="relative hidden min-h-[680px] overflow-hidden bg-[#315b45] p-8 text-[#fffdf9] lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div className="absolute -right-20 top-16 h-64 w-64 rounded-full border-[28px] border-[#e9a36f]/30" />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[34px] border-[#f6d8a8]/20" />
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2b37d] text-[#315b45] shadow-lg">
                  <Utensils className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f8ddbb]">Uniluk</span>
              </div>
              <h1 className="mt-16 max-w-sm text-5xl font-black leading-[0.98] tracking-[-0.04em]">Cantine<br />Uniluk</h1>
              <p className="mt-6 max-w-sm text-base leading-7 text-[#e3f0df]">
                Le goût du fait maison, une gestion simple et un espace pensé pour toute la communauté universitaire.
              </p>
            </div>
            <div className="relative z-10 space-y-5">
              <div className="border-l-2 border-[#f2b37d] pl-4">
                <p className="text-lg font-semibold">Bien manger. Bien gérer.</p>
                <p className="mt-1 text-sm text-[#cfe2d0]">Commandes, produits et clients réunis au même endroit.</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#dcebdc]">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#f2b37d]" />Service rapide</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#f2b37d]" />Produits frais</span>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-5 flex items-center gap-3 lg:hidden">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#315b45] text-[#f2b37d]"><Utensils className="h-5 w-5" /></span>
                    <span className="text-sm font-bold uppercase tracking-[0.16em] text-[#315b45]">Cantine Uniluk</span>
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c56c42]">Espace membre</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#26332b] sm:text-4xl">{isSignUp ? "Bienvenue parmi nous" : "Ravi de vous revoir"}</h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[#718075]">{isSignUp ? "Créez votre compte pour commander et suivre vos achats." : "Connectez-vous pour retrouver votre espace et vos commandes."}</p>
                </div>
              </div>

              {error && (
                  <Alert variant="destructive" className="mb-5 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-5 border-[#b9d7bd] bg-[#edf7ed] text-[#315b45]">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription className="text-[#315b45]">{success}</AlertDescription>
                </Alert>
              )}

              {!isSignUp ? (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                      isVendeur ? "border-[#e4a268] bg-[#fff5e9]" : "border-[#ded8ce] bg-[#faf8f3]"
                    }`}
                    onClick={() => handleVendeurToggle(!isVendeur)}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${isVendeur ? "border-[#d88951] bg-[#d88951]" : "border-[#aab4a9]"}`}>
                      {isVendeur && <span className="text-[10px] font-bold text-white">✓</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {isVendeur ? <UserCog className="h-4 w-4 text-[#c56c42]" /> : <ShieldCheck className="h-4 w-4 text-[#4d7b57]" />}
                      <span className={isVendeur ? "text-[#9a542f]" : "text-[#405348]"}>
                        {isVendeur ? "Connexion vendeur" : "Connexion administrateur"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#405348]">Email</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819187]" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 border-[#ded8ce] bg-[#faf8f3] pl-10 text-[#26332b] placeholder:text-[#a5aea5] focus:border-[#4d7b57] focus:ring-[#4d7b57]"
                        placeholder={isVendeur ? "vendeur@email.com" : "admin@email.com"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#405348]">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819187]" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 border-[#ded8ce] bg-[#faf8f3] pl-10 pr-10 text-[#26332b] placeholder:text-[#a5aea5] focus:border-[#4d7b57] focus:ring-[#4d7b57]"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#819187] hover:text-[#315b45]">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="group h-12 w-full rounded-xl bg-[#315b45] text-white shadow-lg shadow-[#315b45]/20 transition hover:bg-[#264a37]">
                    {isLoading ? "Connexion..." : isVendeur ? "Se connecter en tant que vendeur" : "Se connecter"}<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#405348]">Nom</label>
                      <Input value={signupData.nom} onChange={(e) => setSignupData({ ...signupData, nom: e.target.value })} className="h-11 border-[#ded8ce] bg-[#faf8f3] text-[#26332b] placeholder:text-[#a5aea5]" placeholder="Nom" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#405348]">Post-nom</label>
                      <Input value={signupData.post_nom} onChange={(e) => setSignupData({ ...signupData, post_nom: e.target.value })} className="h-11 border-[#ded8ce] bg-[#faf8f3] text-[#26332b] placeholder:text-[#a5aea5]" placeholder="Post-nom" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#405348]">Prénom</label>
                    <Input value={signupData.prenom} onChange={(e) => setSignupData({ ...signupData, prenom: e.target.value })} className="h-11 border-[#ded8ce] bg-[#faf8f3] text-[#26332b] placeholder:text-[#a5aea5]" placeholder="Prénom" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#405348]">Email</label>
                    <Input type="email" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} className="h-11 border-[#ded8ce] bg-[#faf8f3] text-[#26332b] placeholder:text-[#a5aea5]" placeholder="vous@email.com" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#405348]">Mot de passe</label>
                    <Input type="password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} className="h-11 border-[#ded8ce] bg-[#faf8f3] text-[#26332b] placeholder:text-[#a5aea5]" placeholder="••••••••" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#405348]">Confirmer le mot de passe</label>
                    <Input type="password" value={signupData.password_confirmation} onChange={(e) => setSignupData({ ...signupData, password_confirmation: e.target.value })} className="h-11 border-[#ded8ce] bg-[#faf8f3] text-[#26332b] placeholder:text-[#a5aea5]" placeholder="••••••••" />
                  </div>

                  <Button type="submit" disabled={isLoading} className="group h-12 w-full rounded-xl bg-[#315b45] text-white shadow-lg shadow-[#315b45]/20 transition hover:bg-[#264a37]">
                    {isLoading ? "Création du compte..." : "Créer mon compte"}<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>
              )}

              <div className="mt-7 flex items-center justify-center gap-2 border-t border-[#ebe4d9] pt-5 text-sm text-[#718075]">
                <span>{isSignUp ? "Vous avez déjà un compte ?" : "Pas encore inscrit ?"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError("")
                    setSuccess("")
                  }}
                  className="font-semibold text-[#c56c42] hover:text-[#9a542f]"
                >
                  {isSignUp ? "Se connecter" : "S'inscrire"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
