import { useState, useEffect } from "react";
import { api, formatCurrency, getCurrentMonth } from "../lib/api";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  PieChart as PieChartIcon,
  BarChart3
} from "lucide-react";

const COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#06B6D4', '#EF4444', '#6B7280'];

const ReportsPage = () => {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, expensesRes, incomesRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get(`/expenses?month=${getCurrentMonth()}`),
        api.get(`/incomes?month=${getCurrentMonth()}`)
      ]);
      setSummary(summaryRes.data);
      setExpenses(expensesRes.data || []);
      setIncomes(incomesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Tietojen lataus epäonnistui");
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

  // Prepare category data for pie chart
  const categoryData = summary?.expenses?.categories?.map((cat, index) => ({
    name: cat.name,
    value: cat.amount,
    color: COLORS[index % COLORS.length]
  })) || [];

  // Prepare income vs expense comparison
  const comparisonData = [
    { name: "Tulot", amount: summary?.income?.total || 0, fill: "#10B981" },
    { name: "Menot", amount: summary?.expenses?.total || 0, fill: "#F59E0B" },
    { name: "Käteen jää", amount: summary?.balance?.remaining || 0, fill: "#3B82F6" }
  ];

  // Prepare daily spending data (last 7 days)
  const getDailyData = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const dayName = date.toLocaleDateString('fi-FI', { weekday: 'short' });
      
      const dayExpenses = expenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const dayIncomes = incomes
        .filter(i => i.date === dateStr)
        .reduce((sum, i) => sum + i.amount, 0);
      
      days.push({
        name: dayName,
        date: dateStr,
        menot: dayExpenses,
        tulot: dayIncomes
      });
    }
    return days;
  };

  const dailyData = getDailyData();

  // Calculate stats
  const totalExpenses = summary?.expenses?.total || 0;
  const totalIncome = summary?.income?.total || 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
  const avgDailyExpense = expenses.length > 0 ? totalExpenses / new Date().getDate() : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
          <p className="font-medium text-slate-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Raportit
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-0.5">Taloutesi analytiikka</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-slate-500">Tulot</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-500">Menot</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-slate-500">Säästöaste</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            {savingsRate.toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-slate-500">Päiväkulutus</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(avgDailyExpense)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Yleiskuva", icon: BarChart3 },
          { id: "categories", label: "Kategoriat", icon: PieChartIcon },
          { id: "trends", label: "Trendit", icon: TrendingUp }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full whitespace-nowrap ${
              activeTab === tab.id ? "bg-slate-900 text-white" : ""
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Income vs Expenses Bar Chart */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Tulot vs Menot
            </h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tickFormatter={(value) => `${(value/1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Spending Line Chart */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Viimeisen 7 päivän kulutus
            </h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value}€`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="menot" 
                    name="Menot"
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    dot={{ fill: "#F59E0B", strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tulot" 
                    name="Tulot"
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: "#10B981", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {categoryData.length > 0 ? (
            <>
              {/* Pie Chart */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Kulujen jakautuminen
                </h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category List */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Kategoriat eriteltynä
                </h3>
                <div className="space-y-3">
                  {categoryData.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        ></div>
                        <span className="font-medium text-slate-900">{cat.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(cat.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
              <PieChartIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Ei vielä dataa</h3>
              <p className="text-slate-500">Lisää kuluja nähdäksesi kategorijakauman</p>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          {/* Savings Progress */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Säästötavoite</h3>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-emerald-100 text-sm">Säästetty tässä kuussa</p>
                <p className="text-3xl font-bold tabular-nums">
                  {formatCurrency(Math.max(0, (summary?.income?.total || 0) - (summary?.expenses?.total || 0)))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm">Säästöaste</p>
                <p className="text-3xl font-bold">{savingsRate.toFixed(0)}%</p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-white h-3 rounded-full progress-animate"
                style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
              ></div>
            </div>
            <p className="text-emerald-100 text-sm mt-2">
              {savingsRate >= 20 ? "🎉 Loistavaa! Säästät hyvin!" : "💡 Tavoite: säästä vähintään 20% tuloistasi"}
            </p>
          </div>

          {/* Budget Usage */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Budjetin käyttö
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Budjetti</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(summary?.budget?.amount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Käytetty</span>
                <span className="font-semibold text-amber-600 tabular-nums">
                  {formatCurrency(summary?.expenses?.total || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Jäljellä</span>
                <span className={`font-semibold tabular-nums ${
                  (summary?.budget?.remaining || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {formatCurrency(summary?.budget?.remaining || 0)}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">Käyttöaste</span>
                  <span className={`font-semibold ${
                    (summary?.budget?.percentage || 0) >= 100 ? 'text-red-600' : 
                    (summary?.budget?.percentage || 0) >= 75 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {(summary?.budget?.percentage || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full progress-animate ${
                      (summary?.budget?.percentage || 0) >= 100 ? 'bg-red-500' : 
                      (summary?.budget?.percentage || 0) >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(summary?.budget?.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">💡 Vinkkejä</h3>
            <ul className="space-y-3 text-slate-300">
              {savingsRate < 20 && (
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Yritä säästää vähintään 20% tuloistasi kuukausittain</span>
                </li>
              )}
              {(summary?.budget?.percentage || 0) > 75 && (
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Olet käyttänyt yli 75% budjetistasi - harkitse menojen vähentämistä</span>
                </li>
              )}
              {(summary?.loans?.total_remaining || 0) > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Maksa lainoja pois nopeammin säästääksesi korkokuluissa</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span>Seuraa kulujasi säännöllisesti pysyäksesi budjetissa</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
