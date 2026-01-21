import { useState, useEffect } from "react";
import { api, formatCurrency, formatDate, getCurrentMonth, getToday } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
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
import { Plus, Wallet, Trash2, Briefcase, TrendingUp, Gift, HelpCircle } from "lucide-react";

const sourceIcons = {
  "salary": Briefcase,
  "freelance": TrendingUp,
  "investment": TrendingUp,
  "other": Gift
};

const sourceLabels = {
  "salary": "Palkka",
  "freelance": "Freelance",
  "investment": "Sijoitukset",
  "other": "Muu"
};

const IncomesPage = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    source: "",
    date: getToday(),
    recurring: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get(`/incomes?month=${getCurrentMonth()}`);
      setIncomes(response.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description || !formData.source || !formData.date) {
      toast.error("Täytä kaikki kentät");
      return;
    }

    try {
      await api.post("/incomes", {
        amount: parseFloat(formData.amount),
        description: formData.description,
        source: formData.source,
        date: formData.date,
        recurring: formData.recurring
      });
      toast.success("Tulo lisätty!");
      setDialogOpen(false);
      setFormData({ amount: "", description: "", source: "", date: getToday(), recurring: false });
      fetchData();
    } catch (error) {
      toast.error("Tulon lisäys epäonnistui");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Haluatko varmasti poistaa tämän tulon?")) return;
    
    try {
      await api.delete(`/incomes/${id}`);
      toast.success("Tulo poistettu");
      fetchData();
    } catch (error) {
      toast.error("Poisto epäonnistui");
    }
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="incomes-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Tulot
          </h1>
          <p className="text-slate-500 mt-1">Kuukauden tulot</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-full" data-testid="add-income-btn">
              <Plus className="w-4 h-4 mr-2" />
              Lisää tulo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lisää uusi tulo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Summa (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="h-12"
                  data-testid="income-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Kuvaus</Label>
                <Input
                  id="description"
                  placeholder="Esim. Kuukausipalkka"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-12"
                  data-testid="income-description-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Lähde</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger className="h-12" data-testid="income-source-select">
                    <SelectValue placeholder="Valitse lähde" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Palkka</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="investment">Sijoitukset</SelectItem>
                    <SelectItem value="other">Muu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Päivämäärä</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-12"
                  data-testid="income-date-input"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="recurring" className="cursor-pointer">Toistuva tulo</Label>
                <Switch
                  id="recurring"
                  checked={formData.recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked })}
                  data-testid="income-recurring-switch"
                />
              </div>
              <Button 
                onClick={handleSubmit}
                className="w-full bg-emerald-500 text-white hover:bg-emerald-600 rounded-full h-12"
                data-testid="save-income-btn"
              >
                Tallenna
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Summary */}
      <div className="bg-emerald-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-emerald-100">Tulot yhteensä</span>
        </div>
        <p className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {formatCurrency(totalIncome)}
        </p>
        <p className="text-emerald-200 text-sm mt-2">{incomes.length} tapahtumaa</p>
      </div>

      {/* Incomes List */}
      {incomes.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {incomes.map((income) => {
              const IconComponent = sourceIcons[income.source] || HelpCircle;
              return (
                <div 
                  key={income.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{income.description}</p>
                      <p className="text-sm text-slate-500">
                        {sourceLabels[income.source] || income.source}
                        {income.recurring && <span className="ml-2 text-emerald-600">• Toistuva</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-semibold text-emerald-600 tabular-nums">
                        +{formatCurrency(income.amount)}
                      </span>
                      <p className="text-xs text-slate-400">{formatDate(income.date)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(income.id)}
                      className="text-slate-400 hover:text-red-600"
                      data-testid={`delete-income-${income.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ei tuloja</h3>
          <p className="text-slate-500 mb-6">Lisää ensimmäinen tulosi aloittaaksesi seurannan.</p>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-full px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lisää tulo
          </Button>
        </div>
      )}
    </div>
  );
};

export default IncomesPage;
