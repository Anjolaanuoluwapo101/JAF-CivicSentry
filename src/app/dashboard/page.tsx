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
import { Lock, ShieldAlert, LogIn, UserPlus, Loader2 } from "lucide-react"

const DashboardMap = dynamic(() => import("@/components/DashboardMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
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
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            You need to sign in to access the election safety dashboard. Citizen reports and risk data are available to authenticated users only.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
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
