import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Maksu peruutettu
        </h1>
        <p className="text-slate-600 mb-8">
          Maksuprosessi keskeytettiin. Voit kokeilla uudelleen tai jatkaa Walletan käyttöä ilmaiseksi rajoitetuilla ominaisuuksilla.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/register")}
            className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-full px-8 h-12"
            data-testid="retry-payment-btn"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Yritä uudelleen
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="rounded-full px-8 h-12"
            data-testid="continue-free-btn"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Jatka ilmaiseksi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
