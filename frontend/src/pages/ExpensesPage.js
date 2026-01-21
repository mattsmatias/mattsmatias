import { useState, useEffect } from "react";
import { api, formatCurrency, formatDate, getCurrentMonth, getToday } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import { Plus, CreditCard, Trash2, Home, Utensils, Car, Gamepad2, Heart, Shirt, BookOpen, Receipt } from "lucide-react";

const categoryIcons = {
  "Asuminen": Home,
  "Ruoka": Utensils,
  "Liikenne": Car,
  "Viihde": Gamepad2,
  "Terveys": Heart,
  "Vaatteet": Shirt,
  "Koulutus": BookOpen,
  "Muut": Receipt
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    date: getToday()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, categoriesRes] = await Promise.all([
        api.get(`/expenses?month=${getCurrentMonth()}`),
        api.get("/categories")
      ]);
      setExpenses(expensesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description || !formData.category || !formData.date) {
      toast.error("Täytä kaikki kentät");
      return;
    }

    try {
      await api.post("/expenses", {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date
      });
      toast.success("Kulu lisätty!");
      setDialogOpen(false);
      setFormData({ amount: "", description: "", category: "", date: getToday() });
      fetchData();
    } catch (error) {
      toast.error("Kulun lisäys epäonnistui");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Haluatko varmasti poistaa tämän kulun?")) return;
    
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Kulu poistettu");
      fetchData();
    } catch (error) {
      toast.error("Poisto epäonnistui");
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = expense.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(expense);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="expenses-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Menot
          </h1>
          <p className="text-slate-500 mt-1">Kuukauden kulut</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full" data-testid="add-expense-btn">
              <Plus className="w-4 h-4 mr-2" />
              Lisää kulu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lisää uusi kulu</DialogTitle>
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
                  data-testid="expense-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Kuvaus</Label>
                <Input
                  id="description"
                  placeholder="Esim. Ruokaostokset"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-12"
                  data-testid="expense-description-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="h-12" data-testid="expense-category-select">
                    <SelectValue placeholder="Valitse kategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                    ))}
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
                  data-testid="expense-date-input"
                />
              </div>
              <Button 
                onClick={handleSubmit}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-full h-12"
                data-testid="save-expense-btn"
              >
                Tallenna
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Summary */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-slate-400">Kulut yhteensä</span>
        </div>
        <p className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {formatCurrency(totalExpenses)}
        </p>
        <p className="text-slate-500 text-sm mt-2">{expenses.length} tapahtumaa</p>
      </div>

      {/* Expenses List */}
      {Object.keys(groupedExpenses).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedExpenses)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dayExpenses]) => (
              <div key={date} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="font-medium text-slate-700">{formatDate(date)}</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {dayExpenses.map((expense) => {
                    const IconComponent = categoryIcons[expense.category] || Receipt;
                    return (
                      <div 
                        key={expense.id}
                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{expense.description}</p>
                            <p className="text-sm text-slate-500">{expense.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-amber-600 tabular-nums">
                            -{formatCurrency(expense.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                            className="text-slate-400 hover:text-red-600"
                            data-testid={`delete-expense-${expense.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ei kuluja</h3>
          <p className="text-slate-500 mb-6">Lisää ensimmäinen kulusi aloittaaksesi seurannan.</p>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lisää kulu
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
