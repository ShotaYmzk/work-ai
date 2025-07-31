import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, provider = 'gemini' } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      )
    }

    let text = ''

    if (provider === 'anthropic') {
      // Use Anthropic Claude
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      })

      text = response.content[0].type === 'text' ? response.content[0].text : ''
    } else {
      // Use Gemini (default)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
      const result = await model.generateContent(message)
      const response = await result.response
      text = response.text()
    }

    return NextResponse.json({
      response: text,
      success: true
    })
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json(
      { error: 'AI応答の生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 