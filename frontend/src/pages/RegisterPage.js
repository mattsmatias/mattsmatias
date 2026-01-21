import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Wallet, Eye, EyeOff, ArrowLeft, CheckCircle, CreditCard, Loader2 } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1); // 1 = register, 2 = payment
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error("Täytä kaikki kentät");
      return;
    }

    if (password.length < 6) {
      toast.error("Salasanan tulee olla vähintään 6 merkkiä");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Tili luotu onnistuneesti!");
      setStep(2);
    } catch (error) {
      const message = error.response?.data?.detail || "Rekisteröinti epäonnistui";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await api.post("/payments/checkout", { origin_url: originUrl });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Maksun aloitus epäonnistui";
      toast.error(message);
      setPaymentLoading(false);
    }
  };

  const handleSkipPayment = () => {
    toast.info("Voit aktivoida tilauksen myöhemmin asetuksista");
    navigate("/dashboard");
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

          {/* Step indicators */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">Tili</span>
            </div>
            <div className="flex-1 h-px bg-slate-200"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>
                2
              </div>
              <span className="text-sm font-medium">Maksu</span>
            </div>
          </div>

          {step === 1 && (
            <>
              <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Luo tili
              </h1>
              <p className="text-slate-600 mb-8">
                Aloita taloutesi hallinta tänään
              </p>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nimi</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Matti Meikäläinen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-lg"
                    data-testid="register-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Sähköposti</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nimi@esimerkki.fi"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-lg"
                    data-testid="register-email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Salasana</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Vähintään 6 merkkiä"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-lg pr-12"
                      data-testid="register-password-input"
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
                  data-testid="register-submit-btn"
                >
                  {loading ? "Luodaan tiliä..." : "Jatka maksuun"}
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Aktivoi tilaus
              </h1>
              <p className="text-slate-600 mb-8">
                Valitse maksuvaihtoehto
              </p>

              <div className="bg-slate-900 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">Kuukausitilaus</span>
                  <div className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-2 py-1 rounded-full">
                    Suosituin
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>4,99</span>
                  <span className="text-slate-400">€ / kk</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {["Kaikki ominaisuudet", "Rajaton käyttö", "Peru milloin vain"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={handlePayment}
                className="w-full h-12 bg-emerald-500 text-white hover:bg-emerald-600 rounded-full text-lg mb-3"
                disabled={paymentLoading}
                data-testid="payment-btn"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Siirrytään maksuun...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Maksa kortilla
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleSkipPayment}
                className="w-full text-slate-500 hover:text-slate-700"
                data-testid="skip-payment-btn"
              >
                Ohita ja kokeile ensin
              </Button>
            </>
          )}

          {step === 1 && (
            <p className="mt-8 text-center text-slate-600">
              Onko sinulla jo tili?{" "}
              <Link to="/login" className="text-slate-900 font-medium hover:underline">
                Kirjaudu
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex lg:flex-1 bg-emerald-500 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Hallitse talouttasi helposti
          </h2>
          <p className="text-emerald-100 text-lg">
            Walleta auttaa sinua säästämään, budjetoimaan ja saavuttamaan taloudelliset tavoitteesi.
          </p>
          
          <div className="mt-12 bg-white/10 rounded-2xl p-6 text-left">
            <div className="space-y-4">
              {[
                { label: "Budjetointi", value: "✓" },
                { label: "Menoseuranta", value: "✓" },
                { label: "Lainojen hallinta", value: "✓" },
                { label: "Säästötavoitteet", value: "✓" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-white">{item.label}</span>
                  <span className="text-emerald-200 font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
