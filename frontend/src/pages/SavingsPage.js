import { useState, useEffect } from "react";
import { api, formatCurrency } from "../lib/api";
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
import { Plus, PiggyBank, Trash2, Plane, Home, Car, Gift, Target, Edit2 } from "lucide-react";

const goalIcons = {
  "piggy-bank": PiggyBank,
  "plane": Plane,
  "home": Home,
  "car": Car,
  "gift": Gift,
  "target": Target
};

const SavingsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
    icon: "piggy-bank"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get("/savings");
      setGoals(response.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", target_amount: "", current_amount: "", target_date: "", icon: "piggy-bank"
    });
    setEditingGoal(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.target_amount) {
      toast.error("Täytä pakolliset kentät");
      return;
    }

    try {
      const data = {
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        target_date: formData.target_date || null,
        icon: formData.icon
      };

      if (editingGoal) {
        await api.put(`/savings/${editingGoal.id}`, data);
        toast.success("Säästötavoite päivitetty!");
      } else {
        await api.post("/savings", data);
        toast.success("Säästötavoite lisätty!");
      }
      
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Toiminto epäonnistui");
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date || "",
      icon: goal.icon || "piggy-bank"
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Haluatko varmasti poistaa tämän säästötavoitteen?")) return;
    
    try {
      await api.delete(`/savings/${id}`);
      toast.success("Säästötavoite poistettu");
      fetchData();
    } catch (error) {
      toast.error("Poisto epäonnistui");
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" data-testid="savings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Säästöt
          </h1>
          <p className="text-slate-500 mt-1">Seuraa säästötavoitteitasi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 text-white hover:bg-blue-600 rounded-full" data-testid="add-savings-btn">
              <Plus className="w-4 h-4 mr-2" />
              Lisää tavoite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Muokkaa tavoitetta" : "Lisää säästötavoite"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tavoitteen nimi</Label>
                <Input
                  placeholder="Esim. Lomamatka"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12"
                  data-testid="savings-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Ikoni</Label>
                <div className="flex gap-2">
                  {Object.entries(goalIcons).map(([key, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: key })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        formData.icon === key 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tavoitesumma (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5000"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    className="h-12"
                    data-testid="savings-target-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Säästetty (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                    className="h-12"
                    data-testid="savings-current-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tavoitepäivä (valinnainen)</Label>
                <Input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="h-12"
                />
              </div>
              <Button 
                onClick={handleSubmit}
                className="w-full bg-blue-500 text-white hover:bg-blue-600 rounded-full h-12"
                data-testid="save-savings-btn"
              >
                {editingGoal ? "Päivitä" : "Tallenna"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="bg-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
          <span className="text-blue-100">Säästetty yhteensä</span>
        </div>
        <p className="text-4xl font-bold tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {formatCurrency(totalSaved)}
        </p>
        <p className="text-blue-200 text-sm mt-2">
          Tavoite: {formatCurrency(totalTarget)}
        </p>
        {totalTarget > 0 && (
          <div className="mt-4">
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-white h-3 rounded-full progress-animate"
                style={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Goals List */}
      {goals.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const IconComponent = goalIcons[goal.icon] || PiggyBank;
            const percentage = (goal.current_amount / goal.target_amount) * 100;
            const remaining = goal.target_amount - goal.current_amount;
            
            return (
              <div key={goal.id} className="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{goal.name}</h3>
                      {goal.target_date && (
                        <p className="text-sm text-slate-500">
                          Tavoite: {new Date(goal.target_date).toLocaleDateString('fi-FI')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(goal)}
                      className="text-slate-400 hover:text-blue-600"
                      data-testid={`edit-savings-${goal.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goal.id)}
                      className="text-slate-400 hover:text-red-600"
                      data-testid={`delete-savings-${goal.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Edistyminen</span>
                      <span className="font-semibold text-blue-600">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-slate-500">Säästetty</p>
                      <p className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(goal.current_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Jäljellä</p>
                      <p className="font-semibold text-slate-900 tabular-nums">{formatCurrency(remaining)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PiggyBank className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ei säästötavoitteita</h3>
          <p className="text-slate-500 mb-6">Lisää ensimmäinen säästötavoitteesi.</p>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-blue-500 text-white hover:bg-blue-600 rounded-full px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lisää tavoite
          </Button>
        </div>
      )}
    </div>
  );
};

export default SavingsPage;
