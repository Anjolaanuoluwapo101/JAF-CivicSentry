"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth"
import {
  PollingUnit,
  AcledIncident,
  DashboardStats,
  SatelliteCapture,
  fetchPollingUnits,
  fetchIncidents,
  fetchDashboardStats,
  fetchSatelliteCaptures,
} from "@/lib/queries"
import Navbar from "@/components/Navbar"
import StatsSidebar from "@/components/StatsSidebar"
import DetailPanel from "@/components/DetailPanel"
import OnboardingOverlay, { OnboardingStep } from "@/components/OnboardingOverlay"
import { Lock, Map, BarChart3, MousePointerClick, Loader2 } from "lucide-react"

const DashboardMap = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  ),
})

const DASHBOARD_ONBOARDING: OnboardingStep[] = [
  {
    title: "Interactive Risk Map",
    description: "This map shows all polling units across Nigeria's 6 South West states. Each dot is color-coded by risk level — red for high risk, orange for medium, and green for low. Zoom in to explore specific areas.",
    icon: <Map className="w-5 h-5 text-emerald-600" />,
  },
  {
    title: "Stats Sidebar",
    description: "The sidebar shows aggregate data — total polling units, incidents, fatalities, and risk distribution. Use the state filter and search in the toolbar to narrow down to a specific area.",
    icon: <BarChart3 className="w-5 h-5 text-emerald-600" />,
  },
  {
    title: "Click to Explore",
    description: "Click any colored dot on the map to open the detail panel. You'll see conflict history, news signals, satellite imagery, election results, and an AI-powered risk narrative for that polling unit.",
    icon: <MousePointerClick className="w-5 h-5 text-emerald-600" />,
  },
]

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [selectedState, setSelectedState] = useState("ALL")
  const [pollingUnits, setPollingUnits] = useState<PollingUnit[]>([])
  const [incidents, setIncidents] = useState<AcledIncident[]>([])
  const [satelliteCaptures, setSatelliteCaptures] = useState<SatelliteCapture[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalPUs: 0,
    totalIncidents: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    statesWithIncidents: 0,
    totalFatalities: 0,
  })
  const [loading, setLoading] = useState(true)
  const [centerOn, setCenterOn] = useState<[number, number] | null>(null)
  const [selectedPU, setSelectedPU] = useState<PollingUnit | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return

    async function load() {
      setLoading(true)
      try {
        const [pus, incs, s, caps] = await Promise.all([
          fetchPollingUnits(selectedState),
          fetchIncidents(selectedState),
          fetchDashboardStats(selectedState),
          fetchSatelliteCaptures(selectedState),
        ])
        setPollingUnits(pus)
        setIncidents(incs)
        setStats(s)
        setSatelliteCaptures(caps)
      } catch (err) {
        console.error("Failed to load dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading, selectedState])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-sm text-gray-500 mb-6">
            You need an account to access the election safety dashboard.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <OnboardingOverlay pageKey="dashboard" steps={DASHBOARD_ONBOARDING} />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <StatsSidebar
          stats={stats}
          selectedState={selectedState}
          pollingUnits={pollingUnits}
          incidents={incidents}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 relative">
          {loading ? (
            <div className="flex-1 bg-gray-100 flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  Loading {selectedState === "ALL" ? "all states" : selectedState}...
                </p>
              </div>
            </div>
          ) : (
            <DashboardMap
              initialPollingUnits={pollingUnits}
              incidents={incidents}
              satelliteCaptures={satelliteCaptures}
              selectedState={selectedState}
              centerOn={centerOn}
              onSelectPU={(pu) => {
                setSelectedPU(pu)
                setCenterOn([pu.lat, pu.lng])
              }}
              onStateChange={setSelectedState}
            />
          )}

          {selectedPU && (
            <DetailPanel pu={selectedPU} onClose={() => setSelectedPU(null)} />
          )}
        </div>
      </div>
    </div>
  )
}
