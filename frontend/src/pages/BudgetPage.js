import { useState, useEffect } from "react";
import { api, formatCurrency, getCurrentMonth } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { TrendingUp, Edit2, Save } from "lucide-react";

const BudgetPage = () => {
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetRes, expensesRes] = await Promise.all([
        api.get("/budgets/current"),
        api.get(`/expenses?month=${getCurrentMonth()}`)
      ]);
      setBudget(budgetRes.data);
      setExpenses(expensesRes.data || []);
      if (budgetRes.data) {
        setAmount(budgetRes.data.amount.toString());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Syötä kelvollinen summa");
      return;
    }

    try {
      await api.post("/budgets", {
        amount: parseFloat(amount),
        month: getCurrentMonth()
      });
      toast.success("Budjetti tallennettu!");
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Budjetin tallennus epäonnistui");
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetAmount = budget?.amount || 0;
  const percentage = budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - totalExpenses;

  // Group expenses by category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const categories = Object.entries(categoryTotals)
    .map(([name, total]) => ({
      name,
      total,
      percentage: budgetAmount > 0 ? (total / budgetAmount) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="budget-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Budjetti
          </h1>
          <p className="text-slate-500 mt-1">Kuukauden {getCurrentMonth()}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full" data-testid="edit-budget-btn">
              <Edit2 className="w-4 h-4 mr-2" />
              {budget ? "Muokkaa" : "Aseta budjetti"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aseta kuukausibudjetti</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="budget-amount">Budjetti (€)</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  placeholder="1200.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12"
                  data-testid="budget-amount-input"
                />
              </div>
              <Button 
                onClick={handleSaveBudget}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-full h-12"
                data-testid="save-budget-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                Tallenna
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Budget Card */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Kuukauden budjetti</p>
            <p className="text-white font-medium">Yhteenveto</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-slate-400 text-sm mb-1">Budjetti</p>
            <p className="text-3xl font-bold tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {formatCurrency(budgetAmount)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Käytetty</p>
            <p className="text-3xl font-bold tabular-nums text-amber-400" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Jäljellä</p>
            <p className={`text-3xl font-bold tabular-nums ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: 'Manrope, sans-serif' }}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Budjetin käyttöaste</span>
            <span className={`font-semibold ${percentage >= 100 ? 'text-red-400' : percentage >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4">
            <div 
              className={`h-4 rounded-full progress-animate ${percentage >= 100 ? 'bg-red-400' : percentage >= 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Kulut kategorioittain
          </h2>
          <div className="space-y-4">
            {categories.map((cat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{cat.name}</span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(cat.total)}</span>
                    <span className="text-slate-500 text-sm ml-2">({cat.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <Progress value={cat.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!budget && (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Aseta kuukausibudjetti</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Määritä kuukausibudjettisi aloittaaksesi menojen seurannan.
          </p>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6"
          >
            Aseta budjetti
          </Button>
        </div>
      )}
    </div>
  );
};

export default BudgetPage;
