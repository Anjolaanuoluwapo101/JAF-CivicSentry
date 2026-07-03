"use client"

import { useState, useEffect, useRef } from "react"
import { searchPollingUnits, PollingUnit } from "@/lib/queries"
import { MapView } from "./DashboardMap"

const STATES = ["ALL", "LAGOS", "OGUN", "OYO", "OSUN", "ONDO", "EKITI"] as const

interface MapToolbarProps {
  selectedState: string
  onStateChange: (state: string) => void
  view: MapView
  onViewChange: (view: MapView) => void
  onSelectPU: (pu: PollingUnit) => void
  onZoomIn: () => void
  onZoomOut: () => void
}

export default function MapToolbar({
  selectedState,
  onStateChange,
  view,
  onViewChange,
  onSelectPU,
  onZoomIn,
  onZoomOut,
}: MapToolbarProps) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PollingUnit[]>([])
  const [searching, setSearching] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const data = await searchPollingUnits(query, selectedState)
      setResults(data)
      setSearching(false)
      setHighlightIdx(-1)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, selectedState])

  function handleSelect(pu: PollingUnit) {
    setQuery(pu.name)
    setResults([])
    onSelectPU(pu)
    setExpanded(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault()
      handleSelect(results[highlightIdx])
    } else if (e.key === "Escape") {
      setExpanded(false)
    }
  }

  return (
    <div ref={wrapperRef} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
      {/* Expanded toolbar */}
      {expanded && (
        <div className="mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 w-[calc(100vw-2rem)] max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Search */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searching ? (
                <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search polling unit..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {query.length > 0 && !searching && (
              <button
                onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus() }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search results */}
          {results.length > 0 && (
            <div className="mb-3 bg-gray-50 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
              {results.map((pu, idx) => (
                <button
                  key={pu.id}
                  onClick={() => handleSelect(pu)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-100 last:border-b-0 transition-colors ${
                    idx === highlightIdx ? "bg-emerald-50" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pu.name}</p>
                      <p className="text-[10px] text-gray-500">{pu.ward} • {pu.lga} • {pu.state}</p>
                    </div>
                    <span className={`ml-2 flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      pu.risk_score === "high" ? "bg-red-100 text-red-700" :
                      pu.risk_score === "medium" ? "bg-orange-100 text-orange-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {pu.risk_score}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Controls row */}
          <div className="flex items-center gap-2">
            {/* State filter */}
            <select
              value={selectedState}
              onChange={(e) => onStateChange(e.target.value)}
              className="flex-shrink-0 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All States" : s}</option>
              ))}
            </select>

            {/* View toggle */}
            <div className="flex flex-1 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => onViewChange("risk")}
                className={`flex-1 px-3 py-2 text-[10px] sm:text-xs font-medium transition-colors ${
                  view === "risk" ? "bg-emerald-500 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Risk
              </button>
              <button
                onClick={() => onViewChange("imagery")}
                className={`flex-1 px-3 py-2 text-[10px] sm:text-xs font-medium transition-colors border-l border-gray-200 ${
                  view === "imagery" ? "bg-emerald-500 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Imagery
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={onZoomOut}
                className="px-2.5 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={onZoomIn}
                className="px-2.5 py-2 text-gray-600 hover:bg-gray-100 transition-colors border-l border-gray-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed pill */}
      <button
        onClick={() => {
          setExpanded(!expanded)
          if (!expanded) {
            setTimeout(() => inputRef.current?.focus(), 100)
          }
        }}
        className="mx-auto flex items-center gap-2 bg-white hover:bg-gray-50 rounded-full shadow-lg border border-gray-200 px-4 py-2.5 transition-all hover:shadow-xl"
      >
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="text-xs font-medium text-gray-700">
          {expanded ? "Close" : "Tools"}
        </span>
        {selectedState !== "ALL" && !expanded && (
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
            {selectedState}
          </span>
        )}
      </button>
    </div>
  )
}
