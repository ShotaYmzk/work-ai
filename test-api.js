// Simple test script to verify API endpoints
const testChatAPI = async () => {
  console.log('Testing Chat API...')
  
  try {
    // Test Gemini
    console.log('\n--- Testing Gemini ---')
    const geminiResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Hello, how are you?',
        provider: 'gemini'
      })
    })
    const geminiData = await geminiResponse.json()
    console.log('Gemini response:', geminiData.success ? '✅ Success' : '❌ Failed')
    
    // Test Anthropic
    console.log('\n--- Testing Anthropic ---')
    const anthropicResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Hello, how are you?',
        provider: 'anthropic'
      })
    })
    const anthropicData = await anthropicResponse.json()
    console.log('Anthropic response:', anthropicData.success ? '✅ Success' : '❌ Failed')
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

// Wait for server to start, then run test
setTimeout(testChatAPI, 3000) 