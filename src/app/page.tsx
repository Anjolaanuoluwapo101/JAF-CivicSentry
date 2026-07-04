import { MapPin, Satellite, Newspaper, Bot, Zap, Vote, ShieldAlert } from "lucide-react"
import Link from "next/link"

const FEATURES = [
  {
    title: "Historical Risk Mapping",
    description: "ACLED violence data from 2020-2025 matched to polling units by coordinate proximity. Risk scores computed from incident count and fatalities.",
    icon: MapPin,
  },
  {
    title: "Satellite Imagery",
    description: "Real Sentinel-2 captures with SHA-256 hashes for tamper-proof evidence. Every image timestamped and verified.",
    icon: Satellite,
  },
  {
    title: "Live News Signals",
    description: "GDELT and NewsMCP feeds aggregated with sentiment analysis. Real-time news monitoring for each polling unit area.",
    icon: Newspaper,
  },
  {
    title: "AI Risk Narratives",
    description: "Groq-powered analysis combining all data sources into actionable intelligence. Swappable AI provider via adapter pattern.",
    icon: Bot,
  },
  {
    title: "Power Infrastructure",
    description: "60,000+ outage records mapped to polling unit areas. Power disruption correlation with election day incidents.",
    icon: Zap,
  },
  {
    title: "Election History (1999-2023)",
    description: "Six presidential elections of data. Turnout trends, party performance, and margin analysis per polling unit.",
    icon: Vote,
  },
  {
    title: "Citizen Incident Reports",
    description: "Authenticated voters can submit real-time incident reports. All reports hashed and archived.",
    icon: ShieldAlert,
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 20% 80%, rgba(16, 185, 129, 0.15), transparent),
              radial-gradient(ellipse 60% 50% at 80% 20%, rgba(5, 150, 105, 0.1), transparent),
              radial-gradient(ellipse 100% 80% at 50% 50%, rgba(2, 44, 34, 0.8), transparent),
              linear-gradient(180deg, #022c22 0%, #064e3b 40%, #065f46 70%, #047857 100%)
            `,
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <nav className="flex items-center justify-between mb-20 sm:mb-32">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CivicSentry AI</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/login"
                className="text-sm text-gray-300 hover:text-white transition-colors hidden sm:inline"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25"
              >
                Sign Up
              </Link>
            </div>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-300">Live • 6 South West States</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
              Know Before{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                You Go Vote
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl leading-relaxed">
              When citizens lose access to polling units because of violence or
              voter suppression, the world goes dark. CivicSentry AI illuminates
              election safety using real satellite data, historical violence records,
              and AI-powered risk narratives for every Nigerian polling unit.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
              >
                View Dashboard
              </Link>
              <Link
                href="/archive"
                className="border border-gray-500 text-gray-300 hover:bg-white/10 hover:text-white font-semibold px-8 py-3 rounded-xl text-lg transition-all"
              >
                Evidence Archive
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="flex-1 bg-gray-950 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Multi-Signal Election Intelligence
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Seven data layers converge into a single intelligence dashboard.
              Everything you need to assess polling unit safety.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900 hover:border-emerald-500/30 transition-all hover:-translate-y-0.5"
                >
                  <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 25 Years */}
      <section className="bg-gray-900 border-t border-gray-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Vote className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            25 Years of Election Data. One Dashboard.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            From 1999 to 2023, CivicSentry AI aggregates presidential election results,
            violence incidents, satellite imagery, and news signals into a single
            intelligence layer. Powered by public data. Verified by AI. Open to all.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {["ACLED violence data", "Sentinel-2 imagery", "GDELT + NewsMCP feeds",
              "46,000+ health facilities", "Power outage tracking", "Population density"].map((item) => (
              <span key={item} className="flex items-center gap-1.5 bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-500 py-10 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gray-400">CivicSentry AI</span>
            </div>
            <p className="text-xs text-center sm:text-left">
              Built for the 2027 Nigerian Elections • Data:{" "}
              <a href="https://acleddata.com" className="underline hover:text-gray-300">ACLED</a>,{" "}
              <a href="https://www.inecnigeria.org" className="underline hover:text-gray-300">INEC</a>,{" "}
              <a href="https://dataspace.copernicus.eu" className="underline hover:text-gray-300">Copernicus</a>,{" "}
              <a href="https://www.gdeltproject.org" className="underline hover:text-gray-300">GDELT</a>,{" "}
              <a href="https://grid3.org" className="underline hover:text-gray-300">GRID3</a>,{" "}
              <a href="https://www.worldpop.org" className="underline hover:text-gray-300">WorldPop</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
