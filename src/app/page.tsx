export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <header className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center font-bold text-green-900">
              CS
            </div>
            <span className="text-lg sm:text-xl font-bold">CivicSentry AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="/login" className="text-sm hover:text-emerald-300 transition-colors hidden sm:inline">
              Login
            </a>
            <a
              href="/signup"
              className="bg-emerald-500 hover:bg-emerald-400 text-green-900 font-semibold px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Sign Up
            </a>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Know Before<br />
            <span className="text-emerald-400">You Go Vote</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-emerald-100 max-w-2xl leading-relaxed">
            When citizens lose access to polling units because of violence or
            voter suppression, the world goes dark. CivicSentry AI illuminates
            election safety using real satellite data, historical violence records,
            and AI-powered risk narratives for every Nigerian polling unit.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/dashboard"
              className="bg-emerald-400 hover:bg-emerald-300 text-green-900 font-bold px-8 py-3 rounded-lg text-lg transition-colors"
            >
              View Dashboard
            </a>
            <a
              href="/archive"
              className="border border-emerald-400 text-emerald-400 hover:bg-emerald-400/10 font-semibold px-8 py-3 rounded-lg text-lg transition-colors"
            >
              Evidence Archive
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="flex-1 bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Multi-Signal Election Intelligence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              title="Historical Risk Mapping"
              description="ACLED violence data from 2020-2025 matched to polling units by coordinate proximity. Risk scores computed from incident count and fatalities."
              icon="🗺️"
            />
            <FeatureCard
              title="Satellite Imagery"
              description="Real Sentinel-2 captures with SHA-256 hashes for tamper-proof evidence. Every image timestamped and verified."
              icon="🛰️"
            />
            <FeatureCard
              title="Live News Signals"
              description="GDELT and NewsMCP feeds aggregated with sentiment analysis. Real-time news monitoring for each polling unit area."
              icon="📰"
            />
            <FeatureCard
              title="AI Risk Narratives"
              description="Gemini-powered analysis combining all data sources into actionable intelligence. Swap to DeepSeek anytime via adapter pattern."
              icon="🤖"
            />
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Power Infrastructure"
              description="60,000+ outage records mapped to polling unit areas. Power disruption correlation with election day incidents."
              icon="⚡"
            />
            <FeatureCard
              title="Election History (1999-2023)"
              description="Six presidential elections of data. Turnout trends, party performance, and margin analysis per polling unit."
              icon="🗳️"
            />
            <FeatureCard
              title="Citizen Incident Reports"
              description="Authenticated voters can submit real-time incident reports with photo evidence. All reports hashed and archived."
              icon="📋"
            />
          </div>
        </div>
      </section>

      {/* 25 Years Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            25 Years of Election Data. One Dashboard.
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            From 1999 to 2023, CivicSentry AI aggregates presidential election results,
            violence incidents, satellite imagery, and news signals into a single
            intelligence layer. Powered by public data. Verified by AI. Open to all.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">✅ ACLED violence data</span>
            <span className="flex items-center gap-1">✅ Sentinel-2 imagery</span>
            <span className="flex items-center gap-1">✅ GDELT + NewsMCP feeds</span>
            <span className="flex items-center gap-1">✅ 46,000+ health facilities</span>
            <span className="flex items-center gap-1">✅ Power outage tracking</span>
            <span className="flex items-center gap-1">✅ Population density</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>CivicSentry AI — Built for the 2027 Nigerian Elections</p>
          <p className="mt-2">
            Data sources:{' '}
            <a href="https://acleddata.com" className="underline hover:text-white">ACLED</a>,{' '}
            <a href="https://www.inecnigeria.org" className="underline hover:text-white">INEC</a>,{' '}
            <a href="https://dataspace.copernicus.eu" className="underline hover:text-white">Copernicus</a>,{' '}
            <a href="https://www.gdeltproject.org" className="underline hover:text-white">GDELT</a>,{' '}
            <a href="https://newsmcp.io" className="underline hover:text-white">NewsMCP</a>,{' '}
            <a href="https://grid3.org" className="underline hover:text-white">GRID3</a>,{' '}
            <a href="https://www.worldpop.org" className="underline hover:text-white">WorldPop</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
