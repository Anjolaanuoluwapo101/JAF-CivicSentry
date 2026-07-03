"use client"

import { useState } from "react"
import { PollingUnit } from "@/lib/queries"
import ConflictFeed from "./ConflictFeed"
import NewsFeed from "./NewsFeed"
import ElectionHistory from "./ElectionHistory"
import SatelliteView from "./SatelliteView"
import AIRiskNarrative from "./AIRiskNarrative"
import CitizenReports from "./CitizenReports"
import {
  PowerStatus,
  HealthAccess,
  PopulationInfo,
  EconomicContext,
} from "./InfrastructureTabs"

const TABS = [
  { id: "ai", label: "AI", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
  { id: "conflict", label: "Conflict", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
  { id: "news", label: "News", icon: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" },
  { id: "elections", label: "Elections", icon: "M9 6.75V15m6-6v8.25m.503 4.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" },
  { id: "satellite", label: "Satellite", icon: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" },
  { id: "health", label: "Health", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" },
  { id: "power", label: "Power", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
  { id: "population", label: "Pop.", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
  { id: "economic", label: "Econ.", icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" },
  { id: "reports", label: "Reports", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
] as const

type TabId = (typeof TABS)[number]["id"]

interface DetailPanelProps {
  pu: PollingUnit
  onClose: () => void
}

export default function DetailPanel({ pu, onClose }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("ai")

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 z-[1100] md:hidden"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-[1200] bg-gray-50 rounded-t-3xl shadow-2xl flex flex-col animate-slide-up"
        style={{ height: "85vh" }}
      >
        {/* Handle + header */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-gray-200 bg-white rounded-t-3xl">
          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate">{pu.name}</h2>
              <p className="text-[10px] text-gray-400">
                {pu.ward} • {pu.lga} • {pu.state}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                pu.risk_score === "high" ? "bg-red-100 text-red-700" :
                pu.risk_score === "medium" ? "bg-orange-100 text-orange-700" :
                "bg-green-100 text-green-700"
              }`}>
                {pu.risk_score.toUpperCase()}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "conflict" && <ConflictFeed pollingUnitId={pu.id} />}
          {activeTab === "news" && <NewsFeed pollingUnitId={pu.id} state={pu.state} />}
          {activeTab === "elections" && <ElectionHistory pollingUnitId={pu.id} />}
          {activeTab === "satellite" && <SatelliteView pollingUnitId={pu.id} />}
          {activeTab === "health" && <HealthAccess pu={pu} />}
          {activeTab === "power" && <PowerStatus state={pu.state} />}
          {activeTab === "population" && <PopulationInfo pollingUnitId={pu.id} />}
          {activeTab === "economic" && <EconomicContext state={pu.state} />}
          {activeTab === "reports" && <CitizenReports pollingUnitId={pu.id} />}
          {activeTab === "ai" && <AIRiskNarrative pu={pu} />}
        </div>
      </div>
    </>
  )
}
