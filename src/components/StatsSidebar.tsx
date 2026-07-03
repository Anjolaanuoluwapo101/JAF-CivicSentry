import { PollingUnit, AcledIncident, DashboardStats } from "@/lib/queries"

interface StatsSidebarProps {
  stats: DashboardStats
  selectedState: string
  pollingUnits: PollingUnit[]
  incidents: AcledIncident[]
  open: boolean
  onToggle: () => void
}

const STATE_COLORS: Record<string, string> = {
  LAGOS: "bg-blue-500",
  OGUN: "bg-purple-500",
  OYO: "bg-amber-500",
  OSUN: "bg-teal-500",
  ONDO: "bg-rose-500",
  EKITI: "bg-indigo-500",
}

export default function StatsSidebar({
  stats,
  selectedState,
  pollingUnits,
  incidents,
  open,
  onToggle,
}: StatsSidebarProps) {
  const stateBreakdown = Object.entries(
    pollingUnits.reduce((acc, pu) => {
      acc[pu.state] = (acc[pu.state] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])

  const incidentTypes = Object.entries(
    incidents.reduce((acc, inc) => {
      acc[inc.event_type] = (acc[inc.event_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
    .slice(0, 5)

  const avgFatalities =
    stats.totalIncidents > 0
      ? (stats.totalFatalities / stats.totalIncidents).toFixed(1)
      : "0"

  return (
    <>
      {/* Mobile toggle button - only when closed */}
      {!open && (
        <button
          onClick={onToggle}
          className="md:hidden fixed top-32 left-3 z-[1001] bg-white rounded-xl shadow-lg border border-gray-200 p-3.5 hover:bg-gray-50 transition-colors"
          aria-label="Open stats"
        >
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </button>
      )}

      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-[999]"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-y-auto
          fixed md:relative z-[1000] md:z-auto
          w-80 md:w-80
          transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedState === "ALL"
                ? "6 South West States Overview"
                : selectedState}
            </p>
          </div>
          {open && (
            <button
              onClick={onToggle}
              className="md:hidden p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Close stats"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Polling Units</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                {stats.totalPUs.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Incidents</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                {stats.totalIncidents.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Fatalities</p>
              <p className="text-xl font-bold text-red-600 mt-0.5">
                {stats.totalFatalities.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Avg Fatalities/Incident</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{avgFatalities}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
              Risk Distribution
            </p>
            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs font-medium text-gray-700">High Risk</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">
                    {stats.highRisk.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-red-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${stats.totalPUs > 0 ? (stats.highRisk / stats.totalPUs) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Multiple incidents or fatalities nearby
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs font-medium text-gray-700">Medium Risk</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">
                    {stats.mediumRisk.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${stats.totalPUs > 0 ? (stats.mediumRisk / stats.totalPUs) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Some incidents reported in the area
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-gray-700">Low Risk</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">
                    {stats.lowRisk.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${stats.totalPUs > 0 ? (stats.lowRisk / stats.totalPUs) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  No significant incidents within 5km
                </p>
              </div>
            </div>
          </div>

          {stateBreakdown.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Polling Units by State
              </p>
              <div className="space-y-2">
                {stateBreakdown.map(([state, count]) => (
                  <div key={state} className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${STATE_COLORS[state] || "bg-gray-400"}`}
                    />
                    <span className="text-xs text-gray-700 flex-1">{state}</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incidentTypes.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Top Incident Types
              </p>
              <div className="space-y-2">
                {incidentTypes.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-xs text-gray-700 truncate flex-1 mr-2">{type}</span>
                    <span className="text-xs font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentIncidents.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Recent Incidents
              </p>
              <div className="space-y-3">
                {recentIncidents.map((inc) => (
                  <div key={inc.id} className="border-b border-gray-100 last:border-b-0 pb-2 last:pb-0">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-medium text-gray-900 truncate flex-1 mr-2">
                        {inc.event_type}
                      </p>
                      {inc.fatalities > 0 && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1 rounded">
                          {inc.fatalities} {inc.fatalities === 1 ? "death" : "deaths"}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {inc.state || "Unknown"} •{" "}
                      {new Date(inc.event_date).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto p-4 border-t border-gray-200">
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Sources: ACLED • WarScope • War-Tracker
            <br />
            Risk = incidents within 5km of polling unit
          </p>
        </div>
      </div>
    </>
  )
}
