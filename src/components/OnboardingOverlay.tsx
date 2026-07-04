"use client"

import { useState, useEffect } from "react"
import { X, ChevronRight, ChevronLeft, Eye, EyeOff } from "lucide-react"

export interface OnboardingStep {
  title: string
  description: string
  icon?: React.ReactNode
  highlight?: string // CSS selector to highlight
}

interface OnboardingOverlayProps {
  pageKey: string
  steps: OnboardingStep[]
}

export default function OnboardingOverlay({ pageKey, steps }: OnboardingOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [suppress, setSuppress] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(`onboard_${pageKey}`)
    if (!dismissed) setVisible(true)
  }, [pageKey])

  const finish = () => {
    if (suppress) {
      localStorage.setItem(`onboard_${pageKey}`, "1")
    }
    setVisible(false)
  }

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      finish()
    }
  }

  const prev = () => {
    if (step > 0) setStep(step - 1)
  }

  if (!visible) return null

  const current = steps[step]
  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={finish} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-600">
            Step {step + 1} of {steps.length}
          </span>
          <button
            onClick={finish}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            {current.icon && (
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                {current.icon}
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-900">{current.title}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{current.description}</p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              onClick={() => setSuppress(!suppress)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                suppress ? "bg-emerald-500 border-emerald-500" : "border-gray-300 bg-white"
              }`}
            >
              {suppress && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-xs text-gray-500">Don't show again</span>
          </label>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors shadow-sm"
            >
              {step === steps.length - 1 ? "Get Started" : "Next"}
              {step < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
