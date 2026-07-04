"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import { useAuth } from "@/lib/auth"
import { fetchUserSubscription, upgradeSubscription, Subscription } from "@/lib/subscription-queries"
import OnboardingOverlay, { OnboardingStep } from "@/components/OnboardingOverlay"
import { Check, X, Zap, Shield, Loader2, ArrowRight, LogIn } from "lucide-react"

const UPGRADE_ONBOARDING: OnboardingStep[] = [
  {
    title: "Choose Your Tier",
    description: "CivicSentry offers a free tier with core risk data and a premium tier with live satellite monitoring and real-time alerts. Pick what fits your needs.",
    icon: <Zap className="w-5 h-5 text-emerald-600" />,
  },
  {
    title: "What Changes with Live Monitoring",
    description: "Premium gives you daily satellite revisit updates (vs 5-day on free), real-time ACLED conflict alerts, and priority AI risk narratives refreshed every 6 hours.",
    icon: <Shield className="w-5 h-5 text-emerald-600" />,
  },
]

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "₦0",
    period: "forever",
    description: "Core election safety data for every polling unit",
    features: [
      { text: "33,802 polling units with risk scores", included: true },
      { text: "5-day satellite revisit interval", included: true },
      { text: "Historical conflict data (ACLED)", included: true },
      { text: "Election results (1999–2023)", included: true },
      { text: "AI risk narratives", included: true },
      { text: "Citizen incident reporting", included: true },
      { text: "Evidence archive & verification", included: true },
      { text: "Live satellite monitoring", included: false },
      { text: "Real-time conflict alerts", included: false },
      { text: "Priority AI refresh (6hr)", included: false },
    ],
  },
  {
    id: "live_monitoring",
    name: "Live Monitoring",
    price: "₦5,000",
    period: "/month",
    description: "Real-time satellite and conflict monitoring for serious observers",
    badge: "Recommended",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Daily satellite revisit updates", included: true },
      { text: "Real-time ACLED conflict alerts", included: true },
      { text: "Priority AI refresh (every 6 hours)", included: true },
      { text: "Early access to new features", included: true },
      { text: "Dedicated support channel", included: true },
    ],
  },
]

export default function UpgradePage() {
  const { user, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserSubscription(user.id).then(setSubscription)
    }
  }, [user])

  const handleUpgrade = async () => {
    if (!user) return
    setUpgrading(true)
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade", tier: "live_monitoring" }),
      })
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch (err) {
      console.error("Upgrade failed:", err)
    } finally {
      setUpgrading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingOverlay pageKey="upgrade" steps={UPGRADE_ONBOARDING} />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Upgrade Your Monitoring
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Get real-time satellite imagery and conflict alerts to stay ahead of election violence.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          {TIERS.map((tier) => {
            const isCurrentTier = subscription?.tier === tier.id
            const isPaid = tier.id === "live_monitoring"

            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl border p-6 transition-all ${
                  isPaid
                    ? "border-emerald-200 shadow-lg shadow-emerald-500/5"
                    : "border-gray-200"
                } ${isCurrentTier ? "ring-2 ring-emerald-500" : ""}`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-sm text-gray-500">{tier.period}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{tier.description}</p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${f.included ? "text-gray-700" : "text-gray-400"}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrentTier ? (
                  <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Current Plan
                  </div>
                ) : isPaid ? (
                  user ? (
                    <button
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
                    >
                      {upgrading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      {upgrading ? "Upgrading..." : "Upgrade Now"}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign in to Upgrade
                    </Link>
                  )
                ) : (
                  <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium text-gray-500 border border-gray-200">
                    Free Forever
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">Why Upgrade?</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Faster Satellite Updates</h3>
              <p className="text-sm text-gray-500">
                Free tier uses Sentinel-2 which revisits every 5 days. Live Monitoring gets you daily updates
                so you can spot changes faster.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Real-Time Conflict Alerts</h3>
              <p className="text-sm text-gray-500">
                Get notified the moment ACLED reports a new political violence event near any polling unit
                you&apos;re monitoring.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">AI Refresh Every 6 Hours</h3>
              <p className="text-sm text-gray-500">
                Free tier AI narratives are generated once. Premium refreshes every 6 hours with the latest
                data signals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
