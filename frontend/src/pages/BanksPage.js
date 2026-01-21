import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api, formatCurrency } from "../lib/api";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { 
  Building2, 
  Link2, 
  Plus, 
  RefreshCw, 
  Download,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  CreditCard,
  ArrowRight
} from "lucide-react";

const BanksPage = () => {
  const [searchParams] = useSearchParams();
  const [banks, setBanks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [importing, setImporting] = useState(false);
  const [nordigenConfigured, setNordigenConfigured] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Check for callback from bank
    const ref = searchParams.get("ref");
    if (ref) {
      toast.success("Pankkiyhteys muodostettu! Päivitä sivu nähdäksesi tilit.");
      fetchData();
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Finnish banks
      try {
        const banksRes = await api.get("/banks/finland");
        setBanks(banksRes.data || []);
      } catch (error) {
        if (error.response?.status === 500 && error.response?.data?.detail?.includes("not configured")) {
          setNordigenConfigured(false);
        }
        console.error("Error fetching banks:", error);
      }
      
      // Fetch user's connections
      try {
        const connectionsRes = await api.get("/banks/connections");
        setConnections(connectionsRes.data || []);
      } catch (error) {
        console.error("Error fetching connections:", error);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBank = async (bank) => {
    setConnecting(true);
    setSelectedBank(bank);
    
    try {
      const redirectUrl = `${window.location.origin}/dashboard/banks?ref=${bank.id}`;
      
      const response = await api.post("/banks/connect", {
        institution_id: bank.id,
        redirect_url: redirectUrl
      });
      
      if (response.data.link) {
        // Redirect to bank's authentication page
        window.location.href = response.data.link;
      }
    } catch (error) {
      console.error("Error connecting bank:", error);
      toast.error("Pankkiyhteyden luonti epäonnistui");
      setConnecting(false);
    }
  };

  const handleViewAccounts = async (connection) => {
    setSelectedConnection(connection);
    setDialogOpen(true);
    
    try {
      const response = await api.get(`/banks/connection/${connection.id}/accounts`);
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Tilien haku epäonnistui");
    }
  };

  const handleImportTransactions = async (accountId) => {
    setImporting(true);
    
    try {
      const response = await api.post(`/banks/import-transactions/${accountId}`);
      toast.success(response.data.message);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error importing transactions:", error);
      toast.error("Tapahtumien tuonti epäonnistui");
    } finally {
      setImporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "LN": return "text-emerald-600 bg-emerald-100"; // Linked
      case "CR": return "text-amber-600 bg-amber-100"; // Created
      case "EX": return "text-red-600 bg-red-100"; // Expired
      default: return "text-slate-600 bg-slate-100";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "LN": return "Yhdistetty";
      case "CR": return "Odottaa";
      case "EX": return "Vanhentunut";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!nordigenConfigured) {
    return (
      <div className="space-y-6 pb-20 md:pb-0" data-testid="banks-page">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Pankkiyhteydet
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-0.5">Yhdistä pankkitilisi automaattiseen seurantaan</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Nordigen API ei ole konfiguroitu</h3>
              <p className="text-amber-700 mb-4">
                Pankkiyhteydet vaativat Nordigen (GoCardless) API-avaimet. Noudata näitä ohjeita:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-amber-800 text-sm">
                <li>Luo ilmainen tili osoitteessa <a href="https://gocardless.com/bank-account-data/" target="_blank" rel="noopener noreferrer" className="underline font-medium">gocardless.com/bank-account-data</a></li>
                <li>Luo uudet "User secrets" hallintapaneelissa</li>
                <li>Lisää <code className="bg-amber-100 px-1 rounded">NORDIGEN_SECRET_ID</code> ja <code className="bg-amber-100 px-1 rounded">NORDIGEN_SECRET_KEY</code> ympäristömuuttujiin</li>
                <li>Käynnistä backend uudelleen</li>
              </ol>
              <Button 
                variant="outline" 
                className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => window.open("https://gocardless.com/bank-account-data/", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Avaa GoCardless
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="banks-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Pankkiyhteydet
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-0.5">Yhdistä pankkitilisi automaattiseen seurantaan</p>
        </div>
        <Button 
          onClick={fetchData}
          variant="outline"
          className="rounded-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Päivitä
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Automaattinen tilien seuranta</h3>
            <p className="text-blue-700 text-sm">
              Yhdistä pankkitilisi turvallisesti PSD2-standardin mukaisesti. Tapahtumat tuodaan automaattisesti Walletaan.
            </p>
          </div>
        </div>
      </div>

      {/* Existing Connections */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Yhdistetyt pankit</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {connections.map((conn) => (
              <div 
                key={conn.id}
                className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{conn.institution_id}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(conn.status)}`}>
                      {getStatusText(conn.status)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewAccounts(conn)}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Banks */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Yhdistä uusi pankki</h2>
        
        {banks.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {banks.map((bank) => (
              <button
                key={bank.id}
                onClick={() => handleConnectBank(bank)}
                disabled={connecting}
                className="bg-white rounded-xl p-4 border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all text-left flex items-center gap-4 disabled:opacity-50"
              >
                {bank.logo ? (
                  <img 
                    src={bank.logo} 
                    alt={bank.name} 
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{bank.name}</p>
                  <p className="text-sm text-slate-500">{bank.bic || "Suomi"}</p>
                </div>
                {connecting && selectedBank?.id === bank.id ? (
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                ) : (
                  <Link2 className="w-5 h-5 text-slate-400" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 border border-slate-100 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Ei pankkeja saatavilla</p>
          </div>
        )}
      </div>

      {/* Accounts Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pankkitilit</DialogTitle>
            <DialogDescription>
              Valitse tili, josta haluat tuoda tapahtumat
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {accounts.length > 0 ? (
              accounts.map((account) => (
                <div 
                  key={account.id}
                  className="bg-slate-50 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{account.name}</p>
                        <p className="text-sm text-slate-500">{account.iban}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <p className="text-sm text-slate-500">Saldo</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleImportTransactions(account.id)}
                      disabled={importing}
                      className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-full"
                    >
                      {importing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Tuo tapahtumat
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
                <p className="text-slate-500">Haetaan tilejä...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BanksPage;
