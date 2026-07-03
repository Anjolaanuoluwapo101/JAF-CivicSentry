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

const DashboardMap = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
    </div>
  ),
})

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-6">You must be logged in to access the dashboard.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
                <p className="text-gray-500">
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

          {/* Detail bottom sheet — scoped to map area */}
          {selectedPU && (
            <DetailPanel pu={selectedPU} onClose={() => setSelectedPU(null)} />
          )}
        </div>
      </div>
    </div>
  )
}
