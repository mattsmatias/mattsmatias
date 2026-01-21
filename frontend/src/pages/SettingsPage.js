import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  LogOut,
  ChevronRight,
  Loader2,
  CheckCircle
} from "lucide-react";

const SettingsPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    weeklyReport: false,
    monthlyReport: true
  });

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

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Asetukset
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-0.5">Hallitse tiliäsi ja asetuksiasi</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500">{user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Nimi</p>
              <p className="text-sm text-slate-500">{user?.name}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Sähköposti</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900">Tili luotu</p>
              <p className="text-sm text-slate-500">{formatDate(user?.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tilaus</h2>
            <p className="text-sm text-slate-500">Hallitse tilaustasi</p>
          </div>
        </div>
        
        {user?.subscription_active ? (
          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">Pro-tilaus aktiivinen</span>
            </div>
            <p className="text-sm text-emerald-700">
              Tilauksesi on voimassa {formatDate(user?.subscription_end)} asti
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Päivitä Pro-tilaukseen</h3>
            <p className="text-slate-300 mb-4">Saat käyttöösi kaikki ominaisuudet</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">4,99</span>
              <span className="text-slate-400">€ / kk</span>
            </div>
            <Button
              onClick={handlePayment}
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600 rounded-full h-12"
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Ladataan...
                </>
              ) : (
                "Aktivoi tilaus"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ilmoitukset</h2>
            <p className="text-sm text-slate-500">Valitse mitä ilmoituksia saat</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900">Budjettivaroitukset</p>
              <p className="text-sm text-slate-500">Saat ilmoituksen kun lähestyt budjettirajaa</p>
            </div>
            <Switch 
              checked={notifications.budgetAlerts}
              onCheckedChange={(checked) => setNotifications({...notifications, budgetAlerts: checked})}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900">Viikkoraportti</p>
              <p className="text-sm text-slate-500">Saat viikoittaisen yhteenvedon sähköpostilla</p>
            </div>
            <Switch 
              checked={notifications.weeklyReport}
              onCheckedChange={(checked) => setNotifications({...notifications, weeklyReport: checked})}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900">Kuukausiraportti</p>
              <p className="text-sm text-slate-500">Saat kuukausittaisen yhteenvedon sähköpostilla</p>
            </div>
            <Switch 
              checked={notifications.monthlyReport}
              onCheckedChange={(checked) => setNotifications({...notifications, monthlyReport: checked})}
            />
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Turvallisuus</h2>
            <p className="text-sm text-slate-500">Hallitse tilisi turvallisuutta</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Vaihda salasana</p>
              <p className="text-sm text-slate-500">Päivitä tilisi salasana</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900">Poista tili</p>
              <p className="text-sm text-slate-500">Poista tilisi ja kaikki tietosi pysyvästi</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full h-12 rounded-full text-red-600 border-red-200 hover:bg-red-50"
        data-testid="logout-btn"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Kirjaudu ulos
      </Button>

      {/* App Info */}
      <div className="text-center text-sm text-slate-400 pb-4">
        <p>Walleta v1.0.0</p>
        <p>© 2024 Walleta. Kaikki oikeudet pidätetään.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
