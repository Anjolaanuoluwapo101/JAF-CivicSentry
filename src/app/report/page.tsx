"use client"

import { useAuth } from "@/lib/auth"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import ReportForm from "@/components/ReportForm"
import OnboardingOverlay, { OnboardingStep } from "@/components/OnboardingOverlay"
import { Lock, LogIn, UserPlus, Siren, Loader2, MapPin, FileText } from "lucide-react"

const REPORT_ONBOARDING: OnboardingStep[] = [
  {
    title: "Find Your Polling Unit",
    description: "Search by name or use the state/LGA/ward dropdowns to locate the exact polling unit where the incident occurred. The form will auto-fill the coordinates.",
    icon: <MapPin className="w-5 h-5 text-emerald-600" />,
  },
  {
    title: "Describe What Happened",
    description: "Write a clear description of the incident — what you saw, when it happened, and who was involved. Be specific. Your report becomes part of the public record and helps protect voters.",
    icon: <FileText className="w-5 h-5 text-emerald-600" />,
  },
]

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth()

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-8">You must be logged in to submit an incident report.</p>
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
    <div className="min-h-screen bg-gray-50">
      <OnboardingOverlay pageKey="report" steps={REPORT_ONBOARDING} />
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Siren className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Report an Incident</h1>
              <p className="text-sm text-gray-500">Help keep your community safe</p>
            </div>
          </div>
          <ReportForm />
        </div>
      </div>
    </div>
  )
}
