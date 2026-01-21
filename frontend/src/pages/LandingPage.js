import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { 
  TrendingUp, 
  PiggyBank, 
  CreditCard, 
  Target, 
  BarChart3, 
  Shield,
  CheckCircle,
  ArrowRight,
  Wallet
} from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Budjetointi",
      description: "Aseta kuukausibudjetti ja seuraa toteumaa reaaliajassa"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Menoseuranta",
      description: "Lisää kulut helposti ja ryhmittele ne kategorioihin"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Lainojen hallinta",
      description: "Seuraa asuntolainoja, autolainoja ja muita velkoja"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Säästötavoitteet",
      description: "Aseta tavoitteita ja seuraa edistymistäsi"
    },
    {
      icon: <PiggyBank className="w-6 h-6" />,
      title: "Tulot & Menot",
      description: "Näe yhdellä silmäyksellä kaikki rahavirtasi"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Turvallinen",
      description: "Tietosi ovat turvassa vahvalla salauksella"
    }
  ];

  const benefits = [
    "Näe mihin rahasi oikeasti menevät",
    "Säästä automaattisesti joka kuukausi",
    "Pääse eroon veloista nopeammin",
    "Saavuta taloudelliset tavoitteesi"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Walleta
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900" data-testid="login-nav-btn">
                  Kirjaudu
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6" data-testid="register-nav-btn">
                  Aloita ilmaiseksi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Hallitse talouttasi
                <span className="text-emerald-500"> helposti</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-xl">
                Walleta auttaa sinua ymmärtämään, hallitsemaan ja parantamaan talouttasi arjessa – ilman stressiä tai monimutkaisuutta.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 h-14 text-lg" data-testid="hero-cta-btn">
                    Aloita nyt – 4,99€/kk
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-slate-300" data-testid="hero-login-btn">
                    Kirjaudu sisään
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Ei piilokuluja
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Peru milloin vain
                </span>
              </div>
            </div>
            
            {/* Hero Image/Card Preview */}
            <div className="relative animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Kuukauden kulut</p>
                    <p className="text-white text-sm">Aktiiviset kiinteät menot</p>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-white tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    991,88
                  </span>
                  <span className="text-2xl text-slate-400 ml-2">€ /kk</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Budjetista käytetty</span>
                  <span className="text-amber-400 font-semibold">83%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div className="bg-amber-400 h-3 rounded-full progress-animate" style={{ width: '83%' }}></div>
                </div>
                <p className="text-slate-500 text-sm mt-3">Budjetti: 1 200,00 € / kk</p>
              </div>
              
              {/* Floating alert card */}
              <div className="absolute -top-4 -right-4 bg-amber-500 text-white rounded-2xl p-4 shadow-lg max-w-xs">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Lähestyt budjettirajaa</p>
                    <p className="text-sm text-amber-100">Olet käyttänyt 83% budjetistasi.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Kaikki mitä tarvitset
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Walleta kokoaa taloustietosi yhteen paikkaan ja näyttää ne ymmärrettävässä muodossa
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-slate-50 rounded-2xl p-6 card-hover border border-slate-100"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Paranna taloudellista tilannettasi
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Walleta auttaa vastaamaan tärkeisiin kysymyksiin ja tekemään parempia päätöksiä rahasi suhteen.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Income preview card */}
            <div className="bg-emerald-500 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium">Tulot & Käteen jäävä</span>
                </div>
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  + Lisää tulo
                </Button>
              </div>
              <div>
                <p className="text-emerald-100 text-sm mb-1">Nettotulot yhteensä</p>
                <p className="text-4xl font-bold text-white tabular-nums" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  3 250,00 €
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-emerald-100 text-sm mb-1">Käteen jää</p>
                <p className="text-2xl font-bold text-white tabular-nums">
                  +1 058,12 €
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="pricing">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Yksinkertainen hinnoittelu
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Yksi hinta, kaikki ominaisuudet. Ei piilomaksuja.
          </p>
          
          <div className="mt-12 bg-slate-900 rounded-3xl p-8 sm:p-12 text-left">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div>
                <p className="text-slate-400 text-sm uppercase tracking-wider">Kuukausitilaus</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>4,99</span>
                  <span className="text-xl text-slate-400">€ / kk</span>
                </div>
              </div>
              <Link to="/register">
                <Button size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-full px-8 h-14" data-testid="pricing-cta-btn">
                  Aloita nyt
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-700">
              <p className="text-white font-medium mb-4">Sisältää:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Rajaton menoseuranta",
                  "Budjetointi & raportit",
                  "Lainojen hallinta",
                  "Säästötavoitteet",
                  "Turvallinen tietojen tallennus",
                  "Peru milloin tahansa"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Ota taloutesi haltuun tänään
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Liity tuhansien suomalaisten joukkoon, jotka jo hallitsevat talouttaan Walletalla.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-12 h-14 text-lg" data-testid="final-cta-btn">
                Aloita ilmainen kokeilu
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">Walleta</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2024 Walleta. Kaikki oikeudet pidätetään.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
