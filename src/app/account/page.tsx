"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { useAuth } from "@/lib/auth"
import { fetchUserSubscription, downgradeSubscription, Subscription } from "@/lib/subscription-queries"
import OnboardingOverlay, { OnboardingStep } from "@/components/OnboardingOverlay"
import { User, Shield, ArrowRight, LogOut, Loader2, Check, AlertTriangle } from "lucide-react"

const ACCOUNT_ONBOARDING: OnboardingStep[] = [
  {
    title: "Your Account",
    description: "View your current subscription tier, manage your plan, and sign out. Your subscription determines which features you can access on the dashboard.",
    icon: <User className="w-5 h-5 text-emerald-600" />,
  },
]

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [downgrading, setDowngrading] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchUserSubscription(user.id).then((sub) => {
      setSubscription(sub)
      setLoading(false)
    })
  }, [user])

  const handleDowngrade = async () => {
    if (!user) return
    setDowngrading(true)
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "downgrade" }),
      })
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch (err) {
      console.error("Downgrade failed:", err)
    } finally {
      setDowngrading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">No Account Found</h1>
          <p className="text-gray-500 mb-6">Sign in to view your account details.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingOverlay pageKey="account" steps={ACCOUNT_ONBOARDING} />
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Signed in as</p>
                <p className="text-sm font-semibold text-gray-900">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Subscription</h2>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className={`rounded-xl border p-4 ${
                subscription?.tier === "live_monitoring"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${
                      subscription?.tier === "live_monitoring" ? "text-emerald-600" : "text-gray-400"
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {subscription?.tier === "live_monitoring" ? "Live Monitoring" : "Free Tier"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {subscription?.tier === "live_monitoring"
                          ? "Daily satellite + real-time alerts"
                          : "5-day satellite + basic alerts"}
                      </p>
                    </div>
                  </div>
                  {subscription?.tier === "free" && (
                    <Link
                      href="/upgrade"
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Upgrade
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {subscription?.tier === "live_monitoring" && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <button
                      onClick={handleDowngrade}
                      disabled={downgrading}
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      {downgrading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {downgrading ? "Downgrading..." : "Downgrade to Free"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={async () => {
                await signOut()
                window.location.href = "/"
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
