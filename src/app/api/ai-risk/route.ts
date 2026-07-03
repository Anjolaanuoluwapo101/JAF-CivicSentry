import { NextRequest, NextResponse } from "next/server"
import { getAIProvider } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pu_id, name, state, lga, ward, risk_score } = body

    if (!pu_id || !name) {
      return NextResponse.json({ error: "Missing polling unit data" }, { status: 400 })
    }

    const prompt = `You are a Nigerian election safety intelligence analyst. Generate a concise risk assessment narrative for the following polling unit.

Polling Unit: ${name}
State: ${state}
LGA: ${lga}
Ward: ${ward}
Current Risk Score: ${risk_score}

Provide a 2-3 paragraph analysis covering:
1. Overall safety assessment for election day
2. Key risk factors to watch (based on the risk score and location)
3. Practical safety recommendations for voters and observers

Keep the tone professional, factual, and actionable. Do not speculate beyond what the data suggests.`

    const ai = getAIProvider()
    const narrative = await ai.generateRiskNarrative(prompt)

    return NextResponse.json({ narrative })
  } catch (error: any) {
    console.error("AI risk generation failed:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate narrative" },
      { status: 500 }
    )
  }
}
