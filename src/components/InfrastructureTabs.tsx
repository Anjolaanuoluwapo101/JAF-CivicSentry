"use client"

import { useEffect, useState } from "react"
import {
  fetchPowerOutages,
  fetchNearestHealthFacility,
  fetchPopulationForPU,
  fetchEconomicForState,
  PowerOutage,
  HealthFacility,
  PopulationData,
  EconomicData,
} from "@/lib/detail-queries"
import { PollingUnit } from "@/lib/queries"

export function PowerStatus({ state }: { state: string }) {
  const [outages, setOutages] = useState<PowerOutage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchPowerOutages(state).then((data) => {
      setOutages(data)
      setLoading(false)
    })
  }, [state])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (outages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No outage data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {outages.map((o) => (
        <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900">{o.disco || "Unknown DISCO"}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              o.status === "resolved" ? "bg-green-100 text-green-700" :
              o.status === "ongoing" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {o.status || "unknown"}
            </span>
          </div>
          {o.cause && <p className="text-[10px] text-gray-500 mt-1">Cause: {o.cause}</p>}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
            {o.duration_min !== null && <span>{o.duration_min} min</span>}
            {o.customers_affected !== null && <span>{o.customers_affected.toLocaleString()} affected</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function HealthAccess({ pu }: { pu: PollingUnit }) {
  const [facilities, setFacilities] = useState<HealthFacility[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchNearestHealthFacility(pu.lat, pu.lng, pu.state).then((data) => {
      setFacilities(data)
      setLoading(false)
    })
  }, [pu.lat, pu.lng, pu.state])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (facilities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No health facilities found nearby</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {facilities.map((f) => (
        <div key={f.id} className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-gray-900">{f.name}</p>
              <p className="text-[10px] text-gray-400">{f.type} • {f.category}</p>
            </div>
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex-shrink-0">
              {f.distance_km.toFixed(1)} km
            </span>
          </div>
          {f.functional_status && (
            <p className="text-[10px] text-gray-500 mt-1">Status: {f.functional_status}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export function PopulationInfo({ pollingUnitId }: { pollingUnitId: string }) {
  const [data, setData] = useState<PopulationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchPopulationForPU(pollingUnitId).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [pollingUnitId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No population data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
        <p className="text-2xl font-bold text-gray-900">
          {data.population_count?.toLocaleString() || "—"}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">Population</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
        <p className="text-2xl font-bold text-gray-900">
          {data.density_per_sq_km?.toFixed(0) || "—"}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">per km²</p>
      </div>
    </div>
  )
}

export function EconomicContext({ state }: { state: string }) {
  const [data, setData] = useState<EconomicData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchEconomicForState(state).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [state])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No economic data for this state</p>
      </div>
    )
  }

  const grouped = data.reduce((acc, item) => {
    if (!acc[item.indicator_type]) acc[item.indicator_type] = []
    acc[item.indicator_type].push(item)
    return acc
  }, {} as Record<string, EconomicData[]>)

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="bg-white rounded-xl border border-gray-100 p-4">
          <h4 className="text-xs font-bold text-gray-900 capitalize mb-2">
            {type.replace(/_/g, " ")}
          </h4>
          {items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-xs text-gray-500">
                {item.recorded_at
                  ? new Date(item.recorded_at).toLocaleDateString("en-NG", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </span>
              <span className="text-xs font-medium text-gray-900">
                {item.value?.toLocaleString() || "—"} {item.unit || ""}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
