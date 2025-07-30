import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'


// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI('AIzaSyCr1mI5VNZDcofTRW7hlEIGjKDPtE8ew6o')

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      )
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Generate response
    const result = await model.generateContent(message)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      response: text,
      success: true
    })
  } catch (error) {
    console.error('Gemini API error:', error)
    return NextResponse.json(
      { error: 'AI応答の生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 