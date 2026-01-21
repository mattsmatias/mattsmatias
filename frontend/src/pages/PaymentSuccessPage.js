import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { CheckCircle, Loader2, XCircle, ArrowRight } from "lucide-react";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempt = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempt >= maxAttempts) {
      setStatus("error");
      return;
    }

    try {
      const response = await api.get(`/payments/status/${sessionId}`);
      
      if (response.data.payment_status === "paid") {
        setStatus("success");
        await refreshUser();
        return;
      } else if (response.data.status === "expired") {
        setStatus("error");
        return;
      }

      // Continue polling
      setAttempts(attempt + 1);
      setTimeout(() => pollPaymentStatus(sessionId, attempt + 1), pollInterval);
    } catch (error) {
      console.error("Error checking payment status:", error);
      if (attempt < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(sessionId, attempt + 1), pollInterval);
      } else {
        setStatus("error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-slate-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Tarkistetaan maksua...
            </h1>
            <p className="text-slate-600">
              Odota hetki, vahvistamme maksusi.
            </p>
            {attempts > 0 && (
              <p className="text-slate-400 text-sm mt-4">
                Yritys {attempts}/5
              </p>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Maksu onnistui!
            </h1>
            <p className="text-slate-600 mb-8">
              Kiitos tilauksestasi. Tilauksesi on nyt aktiivinen ja voit aloittaa Walletan käytön.
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 h-12"
              data-testid="go-to-dashboard-btn"
            >
              Siirry hallintapaneeliin
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Jotain meni pieleen
            </h1>
            <p className="text-slate-600 mb-8">
              Emme pystyneet vahvistamaan maksuasi. Yritä uudelleen tai ota yhteyttä asiakaspalveluun.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/register")}
                className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 h-12"
              >
                Yritä uudelleen
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="rounded-full px-8 h-12"
              >
                Siirry hallintapaneeliin
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
