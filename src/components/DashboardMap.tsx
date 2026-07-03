"use client"

import React, { useEffect, useState, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import {
  PollingUnit,
  AcledIncident,
  SatelliteCapture,
  fetchPollingUnitsInBounds,
} from "@/lib/queries"
import MapToolbar from "./MapToolbar"

const RISK_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f97316",
  low: "#22c55e",
}

const RISK_RADIUS: Record<string, number> = {
  high: 9,
  medium: 8,
  low: 7,
}

const SW_CENTER: [number, number] = [7.5, 4.0]
const SW_BOUNDS: [[number, number], [number, number]] = [
  [4.3, 2.7],
  [14.7, 15.0],
]

export type MapView = "risk" | "imagery"

function MapViewController({
  centerOn,
}: {
  centerOn: [number, number] | null
}) {
  const map = useMap()
  useEffect(() => {
    if (centerOn) {
      map.flyTo(centerOn, 16, { duration: 1.2 })
    }
  }, [centerOn, map])
  return null
}

function FitBounds() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(SW_BOUNDS)
  }, [map])
  return null
}

function ZoomController({
  zoomInTrigger,
  zoomOutTrigger,
}: {
  zoomInTrigger: number
  zoomOutTrigger: number
}) {
  const map = useMap()
  useEffect(() => {
    if (zoomInTrigger > 0) map.zoomIn()
  }, [zoomInTrigger, map])
  useEffect(() => {
    if (zoomOutTrigger > 0) map.zoomOut()
  }, [zoomOutTrigger, map])
  return null
}

function ViewportLoader({
  onBoundsChange,
  selectedState,
}: {
  onBoundsChange: (bounds: {
    north: number
    south: number
    east: number
    west: number
  }) => void
  selectedState: string
}) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds()
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      })
    },
  })

  useEffect(() => {
    const b = map.getBounds()
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    })
  }, [map, selectedState, onBoundsChange])

  return null
}

function MapLegend({ view, puCount }: { view: MapView; puCount: number }) {
  return (
    <div className="absolute bottom-24 sm:bottom-20 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-3 py-2 hidden sm:block">
      {view === "risk" ? (
        <div className="space-y-1">
          {[
            { label: "High", color: RISK_COLORS.high },
            { label: "Medium", color: RISK_COLORS.medium },
            { label: "Low", color: RISK_COLORS.low },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-gray-500">Imagery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="text-[10px] text-gray-500">None</span>
          </div>
        </div>
      )}
      <div className="mt-1.5 pt-1.5 border-t border-gray-200">
        <p className="text-[10px] text-gray-400">{puCount} visible</p>
      </div>
    </div>
  )
}

interface DashboardMapProps {
  initialPollingUnits: PollingUnit[]
  incidents: AcledIncident[]
  satelliteCaptures: SatelliteCapture[]
  selectedState: string
  centerOn: [number, number] | null
  onSelectPU?: (pu: PollingUnit) => void
  onStateChange?: (state: string) => void
}

export default function DashboardMap({
  initialPollingUnits,
  incidents,
  satelliteCaptures,
  selectedState,
  centerOn,
  onSelectPU,
  onStateChange,
}: DashboardMapProps) {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<MapView>("risk")
  const [viewportPUs, setViewportPUs] = useState<PollingUnit[]>([])
  const [zoomInTrigger, setZoomInTrigger] = useState(0)
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0)
  const puMapRef = useRef(new Map<string, PollingUnit>())

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    puMapRef.current.clear()
    setViewportPUs([])
    for (const pu of initialPollingUnits) {
      puMapRef.current.set(pu.id, pu)
    }
    setViewportPUs([...initialPollingUnits])
  }, [initialPollingUnits])

  const handleBoundsChange = useCallback(
    async (bounds: {
      north: number
      south: number
      east: number
      west: number
    }) => {
      const newPUs = await fetchPollingUnitsInBounds(bounds, selectedState)
      let added = 0
      for (const pu of newPUs) {
        if (!puMapRef.current.has(pu.id)) {
          puMapRef.current.set(pu.id, pu)
          added++
        }
      }
      if (added > 0) {
        setViewportPUs([...puMapRef.current.values()])
      }
    },
    [selectedState]
  )

  const incidentMap = useMemo(() => {
    const map = new Map<string, AcledIncident[]>()
    for (const inc of incidents) {
      if (!inc.polling_unit_id) continue
      const arr = map.get(inc.polling_unit_id) || []
      arr.push(inc)
      map.set(inc.polling_unit_id, arr)
    }
    return map
  }, [incidents])

  const captureMap = useMemo(() => {
    const map = new Map<string, SatelliteCapture>()
    for (const cap of satelliteCaptures) {
      if (!cap.polling_unit_id) continue
      map.set(cap.polling_unit_id, cap)
    }
    return map
  }, [satelliteCaptures])

  function getMarkerColor(pu: PollingUnit): string {
    if (view === "imagery") {
      return captureMap.has(pu.id) ? "#22c55e" : "#d1d5db"
    }
    return RISK_COLORS[pu.risk_score]
  }

  function getMarkerRadius(pu: PollingUnit): number {
    if (view === "imagery") {
      return captureMap.has(pu.id) ? 6 : 4
    }
    return RISK_RADIUS[pu.risk_score]
  }

  if (!mounted) {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <MapLegend view={view} puCount={viewportPUs.length} />
      <MapToolbar
        selectedState={selectedState}
        onStateChange={onStateChange || (() => {})}
        view={view}
        onViewChange={setView}
        onSelectPU={(pu) => onSelectPU?.(pu)}
        onZoomIn={() => setZoomInTrigger((n) => n + 1)}
        onZoomOut={() => setZoomOutTrigger((n) => n + 1)}
      />
      <MapContainer
        center={SW_CENTER}
        zoom={7}
        className="flex-1 h-full"
        zoomControl={false}
        maxBounds={SW_BOUNDS}
        minZoom={6}
        maxZoom={18}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds />
        <MapViewController centerOn={centerOn} />
        <ZoomController zoomInTrigger={zoomInTrigger} zoomOutTrigger={zoomOutTrigger} />
        <ViewportLoader
          onBoundsChange={handleBoundsChange}
          selectedState={selectedState}
        />

        {viewportPUs.map((pu) => {
          const puIncidents = incidentMap.get(pu.id) || []
          const hasCapture = captureMap.has(pu.id)
          const capture = captureMap.get(pu.id)

          return (
            <React.Fragment key={pu.id}>
              {/* Invisible hit area — larger radius for easy tapping */}
              <CircleMarker
                center={[pu.lat, pu.lng]}
                radius={14}
                fillColor="transparent"
                color="transparent"
                weight={0}
                fillOpacity={0}
                eventHandlers={{
                  click: () => onSelectPU?.(pu),
                }}
              />
              {/* Visible marker */}
              <CircleMarker
                center={[pu.lat, pu.lng]}
                radius={getMarkerRadius(pu)}
                fillColor={getMarkerColor(pu)}
                color={getMarkerColor(pu)}
                weight={1}
                opacity={0.85}
                fillOpacity={0.75}
                eventHandlers={{
                  click: () => onSelectPU?.(pu),
                }}
              >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {pu.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {pu.ward} • {pu.lga} • {pu.state}
                  </p>

                  {view === "risk" ? (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          pu.risk_score === "high"
                            ? "bg-red-100 text-red-700"
                            : pu.risk_score === "medium"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {pu.risk_score.toUpperCase()} RISK
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2">
                      {hasCapture ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          IMAGERY
                          {capture?.captured_at && (
                            <span className="font-normal ml-1">
                              {new Date(capture.captured_at).toLocaleDateString("en-NG", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          NO IMAGERY
                        </span>
                      )}
                    </div>
                  )}

                  {puIncidents.length > 0 ? (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      <p className="text-[10px] font-semibold text-gray-700 uppercase">
                        Nearby Incidents ({puIncidents.length})
                      </p>
                      {puIncidents.slice(0, 3).map((inc) => (
                        <p key={inc.id} className="text-[10px] text-gray-500">
                          {inc.event_type}
                          {inc.fatalities > 0 && (
                            <span className="text-red-600 font-semibold">
                              {" "}• {inc.fatalities}
                            </span>
                          )}
                        </p>
                      ))}
                      {puIncidents.length > 3 && (
                        <p className="text-[10px] text-gray-400">
                          +{puIncidents.length - 3} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-green-600">
                      No incidents within 5km
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
            </React.Fragment>
          )
        })}
      </MapContainer>
    </>
  )
}
