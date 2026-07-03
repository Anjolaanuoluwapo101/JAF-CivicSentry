"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"

export default function SignupPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard")
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setSubmitting(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
  }

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left — Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white p-12 flex-col justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-400 rounded-lg flex items-center justify-center font-bold text-green-900">
                CS
              </div>
              <span className="text-2xl font-bold">CivicSentry AI</span>
            </Link>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold leading-tight">
              Know Before<br />
              <span className="text-emerald-400">You Go Vote</span>
            </h1>
          </div>
          <div className="text-sm text-emerald-300/60">
            Built for the 2027 Nigerian Elections
          </div>
        </div>

        {/* Right — Confirmation message */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-white">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h2>
            <p className="text-gray-500 mb-6">
              We sent a confirmation link to <span className="font-medium text-gray-700">{email}</span>.
              Click the link to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-400 rounded-lg flex items-center justify-center font-bold text-green-900">
              CS
            </div>
            <span className="text-2xl font-bold">CivicSentry AI</span>
          </Link>
        </div>

        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Know Before<br />
            <span className="text-emerald-400">You Go Vote</span>
          </h1>
          <p className="mt-6 text-emerald-100 text-lg leading-relaxed max-w-md">
            Access real-time election safety intelligence for every Nigerian
            polling unit. Satellite data, violence records, and AI-powered
            risk narratives.
          </p>
        </div>

        <div className="text-sm text-emerald-300/60">
          Built for the 2027 Nigerian Elections
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                CS
              </div>
              <span className="text-lg font-bold text-gray-900">CivicSentry AI</span>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h2>
          <p className="text-gray-500 mb-8">Join CivicSentry AI</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
