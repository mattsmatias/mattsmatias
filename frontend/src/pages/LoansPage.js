import { useState, useEffect } from "react";
import { api, formatCurrency, getToday } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Target, Trash2, Home, Car, CreditCard, GraduationCap } from "lucide-react";

const loanTypeIcons = {
  "asuntolaina": Home,
  "autolaina": Car,
  "kulutusluotto": CreditCard,
  "opintolaina": GraduationCap
};

const loanTypeLabels = {
  "asuntolaina": "Asuntolaina",
  "autolaina": "Autolaina",
  "kulutusluotto": "Kulutusluotto",
  "opintolaina": "Opintolaina"
};

const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    loan_type: "",
    original_amount: "",
    remaining_amount: "",
    interest_rate: "",
    monthly_payment: "",
    start_date: getToday(),
    end_date: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get("/loans");
      setLoans(response.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.loan_type || !formData.original_amount || !formData.remaining_amount || !formData.monthly_payment) {
      toast.error("Täytä kaikki pakolliset kentät");
      return;
    }

    try {
      await api.post("/loans", {
        name: formData.name,
        loan_type: formData.loan_type,
        original_amount: parseFloat(formData.original_amount),
        remaining_amount: parseFloat(formData.remaining_amount),
        interest_rate: parseFloat(formData.interest_rate) || 0,
        monthly_payment: parseFloat(formData.monthly_payment),
        start_date: formData.start_date,
        end_date: formData.end_date || null
      });
      toast.success("Laina lisätty!");
      setDialogOpen(false);
      setFormData({
        name: "", loan_type: "", original_amount: "", remaining_amount: "",
        interest_rate: "", monthly_payment: "", start_date: getToday(), end_date: ""
      });
      fetchData();
    } catch (error) {
      toast.error("Lainan lisäys epäonnistui");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Haluatko varmasti poistaa tämän lainan?")) return;
    
    try {
      await api.delete(`/loans/${id}`);
      toast.success("Laina poistettu");
      fetchData();
    } catch (error) {
      toast.error("Poisto epäonnistui");
    }
  };

  const totalRemaining = loans.reduce((sum, l) => sum + l.remaining_amount, 0);
  const totalMonthly = loans.reduce((sum, l) => sum + l.monthly_payment, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="loans-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Lainat
          </h1>
          <p className="text-slate-500 mt-1">Hallitse velkojasi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full" data-testid="add-loan-btn">
              <Plus className="w-4 h-4 mr-2" />
              Lisää laina
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Lisää uusi laina</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Lainan nimi</Label>
                <Input
                  placeholder="Esim. Asuntolaina"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12"
                  data-testid="loan-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Lainatyyppi</Label>
                <Select value={formData.loan_type} onValueChange={(value) => setFormData({ ...formData, loan_type: value })}>
                  <SelectTrigger className="h-12" data-testid="loan-type-select">
                    <SelectValue placeholder="Valitse tyyppi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asuntolaina">Asuntolaina</SelectItem>
                    <SelectItem value="autolaina">Autolaina</SelectItem>
                    <SelectItem value="kulutusluotto">Kulutusluotto</SelectItem>
                    <SelectItem value="opintolaina">Opintolaina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alkuperäinen summa (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="150000"
                    value={formData.original_amount}
                    onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                    className="h-12"
                    data-testid="loan-original-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jäljellä (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="120000"
                    value={formData.remaining_amount}
                    onChange={(e) => setFormData({ ...formData, remaining_amount: e.target.value })}
                    className="h-12"
                    data-testid="loan-remaining-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Korko (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3.5"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    className="h-12"
                    data-testid="loan-interest-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kuukausierä (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="800"
                    value={formData.monthly_payment}
                    onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                    className="h-12"
                    data-testid="loan-monthly-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Aloituspäivä</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="h-12"
                />
              </div>
              <Button 
                onClick={handleSubmit}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-full h-12"
                data-testid="save-loan-btn"
              >
                Tallenna
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-slate-400">Lainat yhteensä</span>
          </div>
          <p className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {formatCurrency(totalRemaining)}
          </p>
          <p className="text-slate-500 text-sm mt-2">{loans.length} lainaa</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-slate-500">Kuukausierät yhteensä</span>
          </div>
          <p className="text-4xl font-bold text-slate-900 tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {formatCurrency(totalMonthly)}
          </p>
          <p className="text-slate-500 text-sm mt-2">per kuukausi</p>
        </div>
      </div>

      {/* Loans List */}
      {loans.length > 0 ? (
        <div className="space-y-4">
          {loans.map((loan) => {
            const IconComponent = loanTypeIcons[loan.loan_type] || Target;
            const paidPercentage = ((loan.original_amount - loan.remaining_amount) / loan.original_amount) * 100;
            
            return (
              <div key={loan.id} className="bg-white rounded-2xl p-6 border border-slate-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{loan.name}</h3>
                      <p className="text-sm text-slate-500">{loanTypeLabels[loan.loan_type] || loan.loan_type}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(loan.id)}
                    className="text-slate-400 hover:text-red-600"
                    data-testid={`delete-loan-${loan.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Jäljellä</p>
                    <p className="font-semibold text-red-600 tabular-nums">{formatCurrency(loan.remaining_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Kuukausierä</p>
                    <p className="font-semibold text-slate-900 tabular-nums">{formatCurrency(loan.monthly_payment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Korko</p>
                    <p className="font-semibold text-slate-900">{loan.interest_rate}%</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Maksettu</span>
                    <span className="font-medium text-emerald-600">{paidPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={paidPercentage} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ei lainoja</h3>
          <p className="text-slate-500 mb-6">Lisää laina aloittaaksesi velan seurannan.</p>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lisää laina
          </Button>
        </div>
      )}
    </div>
  );
};

export default LoansPage;
