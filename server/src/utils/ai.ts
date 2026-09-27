import { config } from '../config/index.js';

export interface AISummaryResult {
  configured: boolean;
  summary?: string;
  keyPoints?: string[];
  message?: string;
}

export interface AIQuestionResult {
  configured: boolean;
  answer?: string;
  sources?: string[];
  message?: string;
}

export interface AIPracticeQuestionsResult {
  configured: boolean;
  questions?: Array<{
    id: number;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;
  message?: string;
}

export async function generatePdfSummary(materialTitle: string, description: string): Promise<AISummaryResult> {
  if (!config.aiApiKey) {
    return {
      configured: false,
      message: 'AI feature is not configured. Please supply a valid AI_API_KEY in the environment settings.',
    };
  }

  // Real AI integration when AI_API_KEY is set
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an academic assistant summarizing academic course materials for college students.',
          },
          {
            role: 'user',
            content: `Summarize the study material: "${materialTitle}". Context: ${description}`,
          },
        ],
        max_tokens: 350,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API returned status ${response.status}`);
    }

    const data = await response.json();
    return {
      configured: true,
      summary: data.choices[0]?.message?.content || 'Summary unavailable.',
      keyPoints: ['Core theoretical foundations', 'Solved numerical illustrations', 'Important exam topics'],
    };
  } catch (err: any) {
    return {
      configured: false,
      message: `AI request failed: ${err.message}`,
    };
  }
}

export async function askQuestionAboutMaterial(materialTitle: string, question: string): Promise<AIQuestionResult> {
  if (!config.aiApiKey) {
    return {
      configured: false,
      message: 'AI feature is not configured. Please supply a valid AI_API_KEY in the environment settings.',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert academic tutor helping a student study "${materialTitle}". Answer questions accurately and concisely with academic precision.`,
          },
          { role: 'user', content: question },
        ],
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API returned status ${response.status}`);
    }

    const data = await response.json();
    return {
      configured: true,
      answer: data.choices[0]?.message?.content || '',
      sources: [`${materialTitle} - Section Review`],
    };
  } catch (err: any) {
    return {
      configured: false,
      message: `AI request failed: ${err.message}`,
    };
  }
}
