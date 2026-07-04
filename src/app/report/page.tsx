"use client"

import { useAuth } from "@/lib/auth"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import ReportForm from "@/components/ReportForm"
import OnboardingOverlay, { OnboardingStep } from "@/components/OnboardingOverlay"
import { Loader2 } from "lucide-react"

const REPORT_ONBOARDING: OnboardingStep[] = [
  {
    title: "Find Your Polling Unit",
    description: "Search by name or use the state/LGA/ward dropdowns to locate the exact polling unit where the incident occurred. The form will auto-fill the coordinates.",
  },
  {
    title: "Describe What Happened",
    description: "Write a clear description of the incident — what you saw, when it happened, and who was involved. Be specific. Your report becomes part of the public record and helps protect voters.",
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
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-sm text-gray-500 mb-6">
            You need an account to submit an incident report.
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
    <div className="min-h-screen bg-gray-50">
      <OnboardingOverlay pageKey="report" steps={REPORT_ONBOARDING} />
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Report an Incident</h1>
          <p className="text-sm text-gray-500 mb-6">Help keep your community safe</p>
          <ReportForm />
        </div>
      </div>
    </div>
  )
}
