import Link from "next/link"

const FEATURES = [
  {
    title: "Historical Risk Mapping",
    description: "ACLED violence data from 2020-2025 matched to polling units by coordinate proximity. Risk scores computed from incident count and fatalities.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    title: "Satellite Imagery",
    description: "Real Sentinel-2 captures with SHA-256 hashes for tamper-proof evidence. Every image timestamped and verified.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
  },
  {
    title: "Live News Signals",
    description: "GDELT and NewsMCP feeds aggregated with sentiment analysis. Real-time news monitoring for each polling unit area.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
      </svg>
    ),
  },
  {
    title: "AI Risk Narratives",
    description: "Groq-powered analysis combining all data sources into actionable intelligence. Swappable AI provider via adapter pattern.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: "Power Infrastructure",
    description: "60,000+ outage records mapped to polling unit areas. Power disruption correlation with election day incidents.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Election History (1999-2023)",
    description: "Six presidential elections of data. Turnout trends, party performance, and margin analysis per polling unit.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 4.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    title: "Citizen Incident Reports",
    description: "Authenticated voters can submit real-time incident reports. All reports hashed and archived for accountability.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">CivicSentry AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-emerald-700 text-sm font-medium mb-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Live in 6 South West States
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Know before you go vote
          </h1>
          <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-2xl">
            Real-time election safety intelligence for 33,802 polling units across
            Lagos, Ogun, Oyo, Osun, Ondo, and Ekiti. Satellite imagery, violence
            data, and AI-powered risk narratives — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              View Dashboard
            </Link>
            <Link
              href="/archive"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Evidence Archive
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { value: "33,802", label: "Polling Units" },
              { value: "6", label: "States Covered" },
              { value: "1,501", label: "Health Facilities" },
              { value: "25+", label: "Years of Data" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Multi-signal election intelligence
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Seven data layers converge into a single intelligence dashboard.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="border border-gray-200 rounded-xl p-6">
              <div className="text-emerald-600 mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Aggregate", desc: "We pull data from 26 real sources — ACLED, Sentinel-2, GDELT, INEC, and more." },
              { step: "2", title: "Analyze", desc: "AI combines all signals into a single risk score and narrative for each polling unit." },
              { step: "3", title: "Verify", desc: "Every piece of evidence is SHA-256 hashed for tamper-proof chain of custody." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Every vote deserves safety
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Join thousands of Nigerians using data-driven intelligence to protect
          polling units and hold perpetrators accountable.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Create free account
          </Link>
          <Link
            href="/dashboard"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Explore dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              CivicSentry AI
            </div>
            <p className="text-xs text-gray-400">
              Built for the 2027 Nigerian Elections
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
