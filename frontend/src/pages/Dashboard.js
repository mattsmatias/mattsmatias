import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, formatCurrency, formatPercentage } from "../lib/api";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import {
  TrendingUp,
  Wallet,
  CreditCard,
  Target,
  PiggyBank,
  Plus,
  ArrowRight,
  X,
  Briefcase,
  Phone,
  Shield,
  MoreHorizontal
} from "lucide-react";

// Category icons and colors
const categoryConfig = {
  "Asuminen": { icon: "🏠", color: "#3B82F6" },
  "Ruoka": { icon: "🍽️", color: "#10B981" },
  "Liikenne": { icon: "🚗", color: "#8B5CF6" },
  "Viihde": { icon: "🎮", color: "#EC4899" },
  "Terveys": { icon: "❤️", color: "#EF4444" },
  "Vaatteet": { icon: "👕", color: "#F59E0B" },
  "Koulutus": { icon: "📚", color: "#06B6D4" },
  "Lainat": { icon: "💳", color: "#8B5CF6" },
  "Vakuutukset": { icon: "🛡️", color: "#F59E0B" },
  "Puhelinliittymät": { icon: "📱", color: "#10B981" },
  "Muut": { icon: "•••", color: "#6B7280" }
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get("/dashboard/summary");
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Yhteenvedon lataus epäonnistui");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const budgetPercentage = summary?.budget?.percentage || 0;
  const showBudgetAlert = budgetPercentage >= 75;
  const remainingPercentage = summary?.balance?.remaining_percentage || 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-0" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Yleiskatsaus
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-0.5">Tässä kuussa paljonko maksaa elää</p>
        </div>
        <Link to="/dashboard/expenses">
          <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full w-full sm:w-auto" data-testid="add-expense-btn">
            <Plus className="w-4 h-4 mr-2" />
            Lisää kulu
          </Button>
        </Link>
      </div>

      {/* Budget Alert */}
      {showBudgetAlert && showAlert && (
        <div className="bg-amber-500 text-white rounded-2xl p-4 flex items-start justify-between animate-fade-in" data-testid="budget-alert">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Lähestyt budjettirajaa</p>
              <p className="text-amber-100 text-sm">
                Olet käyttänyt {formatPercentage(budgetPercentage)} budjetistasi.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowAlert(false)}
            className="text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Monthly Expenses Card - Dark */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-white" data-testid="expenses-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm">Kuukauden kulut</p>
            <p className="text-white text-xs sm:text-sm">Aktiiviset kiinteät menot</p>
          </div>
        </div>
        
        <div className="mb-3">
          <span className="text-3xl sm:text-5xl font-bold tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {formatCurrency(summary?.expenses?.total || 0).replace('€', '').trim()}
          </span>
          <span className="text-lg sm:text-2xl text-slate-400 ml-1 sm:ml-2">€ /kk</span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">Budjetista käytetty</span>
          <span className={`font-semibold ${budgetPercentage >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {formatPercentage(budgetPercentage)}
          </span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full progress-animate ${budgetPercentage >= 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          ></div>
        </div>
        
        <p className="text-slate-500 text-sm mt-3">
          Budjetti: {formatCurrency(summary?.budget?.amount || 0)} / kk
        </p>
      </div>

      {/* Income Card - Green with breakdown */}
      <div className="bg-emerald-500 rounded-2xl p-4 sm:p-6 text-white" data-testid="income-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-medium">Tulot & Käteen jäävä</span>
          </div>
          <Link to="/dashboard/incomes">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Plus className="w-4 h-4 mr-1" />
              Lisää tulo
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-emerald-100 text-xs sm:text-sm mb-1">Nettotulot yhteensä</p>
            <p className="text-2xl sm:text-4xl font-bold tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {formatCurrency(summary?.income?.total || 0).replace('€', '').trim()}
            </p>
            <p className="text-emerald-200 text-sm">€/kk</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-100 text-xs sm:text-sm mb-1">Käteen jää</p>
            <div className="flex items-center justify-end gap-2">
              <p className="text-2xl sm:text-4xl font-bold tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {formatCurrency(summary?.balance?.remaining || 0).replace('€', '').trim()}
              </p>
              <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
                {remainingPercentage}%
              </span>
            </div>
            <p className="text-emerald-200 text-sm">€/kk</p>
          </div>
        </div>

        {/* Income breakdown */}
        {summary?.income?.sources?.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-white/20">
            {summary.income.sources.map((source, index) => (
              <div 
                key={index}
                className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3"
              >
                <span className="text-white">{source.name}</span>
                <span className="font-semibold tabular-nums">{formatCurrency(source.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses by Category Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100" data-testid="expenses-categories-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Kulut kategorioittain
        </h2>
        
        {summary?.expenses?.categories?.length > 0 ? (
          <div className="space-y-4">
            {summary.expenses.categories.map((category, index) => {
              const config = categoryConfig[category.name] || categoryConfig["Muut"];
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${config.color}15` }}
                      >
                        {config.icon}
                      </div>
                      <span className="font-medium text-slate-900">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(category.amount)}</span>
                      <span className="text-slate-500 text-sm ml-2">{category.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full progress-animate"
                      style={{ width: `${category.percentage}%`, backgroundColor: config.color }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Ei vielä kuluja tässä kuussa</p>
            <Link to="/dashboard/expenses">
              <Button variant="link" className="mt-2">Lisää ensimmäinen kulu</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Cards Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Loans Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 card-hover" data-testid="loans-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-medium text-slate-900">Lainat</span>
            </div>
            <Link to="/dashboard/loans">
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-slate-500 text-sm">Jäljellä yhteensä</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(summary?.loans?.total_remaining || 0)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Kuukausierät</p>
              <p className="text-lg font-semibold text-red-600 tabular-nums">
                -{formatCurrency(summary?.loans?.monthly_payments || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Savings Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 card-hover" data-testid="savings-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-slate-900">Säästöt</span>
            </div>
            <Link to="/dashboard/savings">
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-slate-500 text-sm">Säästetty yhteensä</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(summary?.savings?.total_saved || 0)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Tavoite</p>
              <p className="text-lg font-semibold text-blue-600 tabular-nums">
                {formatCurrency(summary?.savings?.total_target || 0)}
              </p>
            </div>
            {summary?.savings?.total_target > 0 && (
              <Progress 
                value={(summary?.savings?.total_saved / summary?.savings?.total_target) * 100} 
                className="h-2"
              />
            )}
          </div>
        </div>

        {/* Net Worth Card */}
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-white card-hover sm:col-span-2 lg:col-span-1" data-testid="networth-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-medium">Nettovarallisuus</span>
          </div>
          
          <p className="text-3xl font-bold tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {formatCurrency(summary?.balance?.net_worth || 0)}
          </p>
          <p className="text-slate-400 text-sm mt-2">Säästöt - Lainat</p>
        </div>
      </div>

      {/* Empty state if no data */}
      {!summary?.expenses?.total && !summary?.income?.total && (
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Aloita taloutesi seuranta</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Lisää ensimmäinen tulosi tai menosi aloittaaksesi taloutesi hallinnan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard/incomes">
              <Button className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-full px-6">
                <Plus className="w-4 h-4 mr-2" />
                Lisää tulo
              </Button>
            </Link>
            <Link to="/dashboard/expenses">
              <Button variant="outline" className="rounded-full px-6">
                <Plus className="w-4 h-4 mr-2" />
                Lisää meno
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
