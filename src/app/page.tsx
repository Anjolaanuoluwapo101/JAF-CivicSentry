import { MapPin, Satellite, Newspaper, Bot, Zap, Vote, ShieldAlert, ArrowRight, Globe, Lock, Eye } from "lucide-react"
import Link from "next/link"

const FEATURES = [
  {
    title: "Historical Risk Mapping",
    description: "ACLED violence data from 2020-2025 matched to polling units by coordinate proximity. Risk scores computed from incident count and fatalities.",
    icon: MapPin,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    title: "Satellite Imagery",
    description: "Real Sentinel-2 captures with SHA-256 hashes for tamper-proof evidence. Every image timestamped and verified.",
    icon: Satellite,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    title: "Live News Signals",
    description: "GDELT and NewsMCP feeds aggregated with sentiment analysis. Real-time news monitoring for each polling unit area.",
    icon: Newspaper,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    title: "AI Risk Narratives",
    description: "Groq-powered analysis combining all data sources into actionable intelligence. Swappable AI provider via adapter pattern.",
    icon: Bot,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    title: "Power Infrastructure",
    description: "60,000+ outage records mapped to polling unit areas. Power disruption correlation with election day incidents.",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    title: "Election History (1999-2023)",
    description: "Six presidential elections of data. Turnout trends, party performance, and margin analysis per polling unit.",
    icon: Vote,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Citizen Incident Reports",
    description: "Authenticated voters can submit real-time incident reports. All reports hashed and archived for accountability.",
    icon: ShieldAlert,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
]

const STATS = [
  { value: "33,802", label: "Polling Units" },
  { value: "6", label: "States Covered" },
  { value: "1,501", label: "Health Facilities" },
  { value: "25+", label: "Years of Data" },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-emerald-950/80 to-gray-950" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <nav className="flex items-center justify-between mb-20 sm:mb-32">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
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
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
            </div>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6 animate-fade-in-up">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-300">Live • 6 South West States</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] text-white animate-fade-in-up animate-delay-100">
              Know Before{" "}
              <span className="gradient-text">
                You Go Vote
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl leading-relaxed animate-fade-in-up animate-delay-200">
              When citizens lose access to polling units because of violence or
              voter suppression, the world goes dark. CivicSentry AI illuminates
              election safety using real satellite data, historical violence records,
              and AI-powered risk narratives for every Nigerian polling unit.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 animate-fade-in-up animate-delay-300">
              <Link
                href="/dashboard"
                className="group bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3.5 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 flex items-center gap-2"
              >
                View Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/archive"
                className="border border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-all"
              >
                Evidence Archive
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 animate-fade-in-up animate-delay-400">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
              {STATS.map((stat) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-950 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-4">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Transparent & Verifiable</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              How CivicSentry Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From raw data to actionable intelligence in four steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Aggregate", desc: "We pull data from 26 real sources — ACLED, Sentinel-2, GDELT, INEC, and more.", icon: Globe },
              { step: "02", title: "Analyze", desc: "AI combines all signals into a single risk score and narrative for each polling unit.", icon: Bot },
              { step: "03", title: "Verify", desc: "Every piece of evidence is SHA-256 hashed for tamper-proof chain of custody.", icon: Eye },
            ].map((item) => (
              <div key={item.step} className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-emerald-500/30 transition-all">
                <div className="text-6xl font-extrabold text-gray-800 absolute top-4 right-6">{item.step}</div>
                <item.icon className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="flex-1 bg-gray-950 py-24 relative">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`group bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-11 h-11 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-gray-950 to-gray-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Every Vote Deserves Safety
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of Nigerians using data-driven intelligence to protect
            polling units and hold perpetrators accountable.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3.5 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
            <Link
              href="/dashboard"
              className="border border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-all"
            >
              Explore Dashboard
            </Link>
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
