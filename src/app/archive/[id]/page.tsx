"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { useAuth } from "@/lib/auth"
import { fetchEvidenceById, EvidenceItem } from "@/lib/archive-queries"
import { Shield, CheckCircle, AlertTriangle, Clock, ArrowLeft, Copy, Check, Loader2, RefreshCw, MapPin, Calendar, Hash } from "lucide-react"

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: typeof CheckCircle; label: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: Clock, label: "Pending Verification" },
  verified: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: CheckCircle, label: "Verified — Integrity Intact" },
  tampered: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: AlertTriangle, label: "Tampered — Hash Mismatch" },
}

export default function EvidenceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [item, setItem] = useState<EvidenceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{
    match: boolean
    original_hash: string
    current_hash: string
  } | null>(null)

  useEffect(() => {
    fetchEvidenceById(id).then((data) => {
      setItem(data)
      setLoading(false)
    })
  }, [id])

  const handleVerify = async () => {
    if (!user) return
    setVerifying(true)
    try {
      const res = await fetch("/api/evidence/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence_id: id }),
      })
      const data = await res.json()
      if (res.ok) {
        setVerifyResult(data)
        setItem((prev) =>
          prev ? { ...prev, verification_status: data.verification_status, last_verified_at: new Date().toISOString() } : prev
        )
      }
    } catch (err) {
      console.error("Verification failed:", err)
    } finally {
      setVerifying(false)
    }
  }

  const copyHash = () => {
    if (!item) return
    navigator.clipboard.writeText(item.sha256_hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-24">
          <p className="text-gray-500">Evidence not found.</p>
          <Link href="/archive" className="text-emerald-600 hover:underline mt-2 inline-block">
            Back to Archive
          </Link>
        </div>
      </div>
    )
  }

  const status = STATUS_CONFIG[item.verification_status]
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Archive
        </button>

        {/* Status banner */}
        <div className={`rounded-xl border p-4 mb-6 ${status.bg} ${status.border}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-5 h-5 ${status.text}`} />
            <div>
              <p className={`text-sm font-semibold ${status.text}`}>{status.label}</p>
              {item.last_verified_at && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Last verified: {new Date(item.last_verified_at).toLocaleString("en-NG")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-gray-900">
                {item.evidence_type === "satellite" ? "Satellite Capture" : "Citizen Report"}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                {item.evidence_type}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            {/* Polling Unit */}
            {item.pu_name && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.pu_name}</p>
                  <p className="text-xs text-gray-500">{item.pu_state}</p>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Flagged on</p>
                <p className="text-sm text-gray-700">
                  {new Date(item.created_at).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Flag reason */}
            {item.flag_reason && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Flag Reason</p>
                <p className="text-sm text-gray-700">{item.flag_reason}</p>
              </div>
            )}

            {/* Evidence type specific details */}
            {item.evidence_type === "satellite" && item.satellite_image_url && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Satellite Image</p>
                <a
                  href={item.satellite_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-600 hover:underline"
                >
                  View Full Image
                </a>
                {item.satellite_captured_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Captured: {new Date(item.satellite_captured_at).toLocaleDateString("en-NG")}
                  </p>
                )}
              </div>
            )}

            {item.evidence_type === "report" && item.report_description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Report Description</p>
                <p className="text-sm text-gray-700">{item.report_description}</p>
              </div>
            )}

            {/* SHA-256 Hash */}
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wide">SHA-256 Hash</p>
                </div>
                <button
                  onClick={copyHash}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-emerald-400 font-mono break-all leading-relaxed">
                {item.sha256_hash}
              </p>
            </div>

            {/* Verification result */}
            {verifyResult && (
              <div className={`rounded-xl p-4 ${verifyResult.match ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-sm font-semibold mb-2 ${verifyResult.match ? "text-green-700" : "text-red-700"}`}>
                  {verifyResult.match ? "Hash Verified — Integrity Confirmed" : "Hash Mismatch — Evidence May Be Tampered"}
                </p>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-600">
                    <span className="font-medium">Original:</span>{" "}
                    <span className="font-mono">{verifyResult.original_hash.slice(0, 32)}...</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Current:</span>{" "}
                    <span className="font-mono">{verifyResult.current_hash.slice(0, 32)}...</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Verify button */}
          {user && (
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {verifying ? "Verifying..." : "Verify Hash Integrity"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
