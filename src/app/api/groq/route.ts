import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

// Valid Groq models
const VALID_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.3-8b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma-7b-it',
  'whisper-large-v3',
  'whisper-large-v3-turbo',
  'qwen-qwq-32b',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'mistral-saba-24b',
  'distil-whisper-large-v3-en',
  'llama-guard-3-8b',
  'playai-tts',
  'playai-tts-arabic',
  'allam-2-7b'
];

export async function POST(request: NextRequest) {
  // Using environment variable for API key
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY environment variable" },
      { status: 500 }
    );
  }
  
  const groq = new Groq({ apiKey });
  
  try {
    const { prompt, model = "llama-3.3-70b-versatile" } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Validate the model
    const selectedModel = VALID_MODELS.includes(model) ? model : "llama-3.3-70b-versatile";

    // Enhanced prompt to generate AI responses about Smart Wallet Sub Accounts
    const enhancedPrompt = `
    Context: You are an AI assistant in an application that showcases Coinbase Smart Wallet Sub Accounts and Spend Limits features.
    These features allow users to perform blockchain transactions without authentication popups.
    
    When responding, include some information on how Smart Wallet Sub Accounts provide a better user experience by:
    1. Allowing popup-less transactions with pre-approved spend limits
    2. Making dapps more user-friendly with fewer interruptions
    3. Maintaining security through onchain relationships with the main wallet
    
    Now, respond to this user query: ${prompt}
    `;

    // For most models, we'll use chat completions
    try {
      const response = await groq.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: "user", content: enhancedPrompt }
        ]
      });
      
      return NextResponse.json({ 
        message: response.choices[0].message.content,
        model: selectedModel
      });
    } catch (error) {
      console.error('Error with specific model, falling back to default:', error);
      
      // Fall back to the default model
      const fallbackResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: enhancedPrompt }
        ]
      });
      
      return NextResponse.json({ 
        message: fallbackResponse.choices[0].message.content,
        model: "llama-3.3-70b-versatile",
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error with Groq API:', error);
    return NextResponse.json(
      { error: "Error processing your request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Using environment variable for API key
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY environment variable" },
      { status: 500 }
    );
  }
  
  const groq = new Groq({ apiKey });
  
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "user", content: "Explain what Smart Wallet Sub Accounts are and how they improve user experience in web3 applications." }
      ]
    });
    
    return NextResponse.json({ 
      message: response.choices[0].message.content,
      model: "llama-3.3-70b-versatile"
    });
  } catch (error) {
    console.error('Error with Groq API:', error);
    return NextResponse.json(
      { error: "Error processing your request" },
      { status: 500 }
    );
  }
} 