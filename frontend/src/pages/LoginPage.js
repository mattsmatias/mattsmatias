import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Wallet, Eye, EyeOff, ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Täytä kaikki kentät");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Kirjautuminen onnistui!");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.detail || "Kirjautuminen epäonnistui";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Takaisin
          </Link>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Walleta
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Tervetuloa takaisin
          </h1>
          <p className="text-slate-600 mb-8">
            Kirjaudu sisään jatkaaksesi
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Sähköposti</Label>
              <Input
                id="email"
                type="email"
                placeholder="nimi@esimerkki.fi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-lg"
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Salasana</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-lg pr-12"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-full text-lg"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? "Kirjaudutaan..." : "Kirjaudu sisään"}
            </Button>
          </form>

          <p className="mt-8 text-center text-slate-600">
            Ei vielä tiliä?{" "}
            <Link to="/register" className="text-slate-900 font-medium hover:underline">
              Rekisteröidy
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex lg:flex-1 bg-slate-900 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="bg-slate-800 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Yleiskatsaus</p>
                <p className="text-white font-medium">Tässä kuussa</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tulot</span>
                <span className="text-emerald-400 font-semibold">+3 250,00 €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Menot</span>
                <span className="text-amber-400 font-semibold">-991,88 €</span>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Käteen jää</span>
                  <span className="text-white font-bold text-xl">+2 258,12 €</span>
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-center text-slate-400">
            Hallitse talouttasi helposti ja tehokkaasti
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
