// lib/ai-processor.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PaymentIntent {
  recipientName?: string;
  iban?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  confidence: number;
  suggestedPaymentType: 'SEPA' | 'FasterPayments' | 'Unknown';
}

export interface FraudFlags {
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
  score: number;
}

export class PaymentIntentProcessor {
  async processPaymentIntent(userInput: string): Promise<{
    intent: PaymentIntent;
    fraudAnalysis: FraudFlags;
  }> {
    try {
      // Main AI processing
      const intentResult = await this.extractPaymentIntent(userInput);
      
      // Fraud detection
      const fraudAnalysis = await this.analyzeFraudRisk(userInput, intentResult);
      
      return {
        intent: intentResult,
        fraudAnalysis
      };
    } catch (error) {
      console.error('AI processing error:', error);
      throw new Error('Failed to process payment intent');
    }
  }

  private async extractPaymentIntent(userInput: string): Promise<PaymentIntent> {
    const prompt = `
    Analyze this payment instruction and extract structured data:
    "${userInput}"
    
    Extract the following information and respond in JSON format:
    {
      "recipientName": "extracted name or null",
      "amount": "extracted amount as number or null", 
      "currency": "extracted currency (EUR, GBP, etc.) or null",
      "reference": "extracted payment reference or suggested reference",
      "confidence": "confidence score 0-1",
      "suggestedPaymentType": "SEPA for EUR transactions, FasterPayments for GBP, Unknown otherwise",
      "iban": "if IBAN detected or null",
      "reasoning": "brief explanation of extraction"
    }
    
    Rules:
    - If amount contains currency symbol, extract both
    - For names like "John", suggest full reference like "Payment to John"
    - SEPA for EUR/European banks, FasterPayments for UK banks
    - Be conservative with confidence scores
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are a payment processing expert. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No AI response received');
    }

    try {
      // Strip markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      return {
        recipientName: parsed.recipientName,
        iban: parsed.iban,
        amount: parsed.amount,
        currency: parsed.currency || 'EUR',
        reference: parsed.reference,
        confidence: parsed.confidence,
        suggestedPaymentType: parsed.suggestedPaymentType
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      throw new Error('Invalid AI response format');
    }
  }

  private async analyzeFraudRisk(
    userInput: string, 
    intent: PaymentIntent
  ): Promise<FraudFlags> {
    const fraudPrompt = `
    Analyze this payment for fraud risk:
    Input: "${userInput}"
    Parsed: ${JSON.stringify(intent)}
    
    Check for:
    - Unusually high amounts
    - Suspicious language patterns
    - Urgent payment requests
    - Missing critical information
    - Social engineering indicators
    
    Respond in JSON:
    {
      "riskLevel": "low|medium|high",
      "score": 0-100,
      "flags": ["array of specific risk factors found"],
      "recommendation": "brief recommendation"
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a fraud detection specialist. Always respond with valid JSON."
        },
        {
          role: "user", 
          content: fraudPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return { riskLevel: 'medium', flags: ['Analysis unavailable'], score: 50 };
    }

    try {
      // Strip markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      return {
        riskLevel: parsed.riskLevel,
        flags: parsed.flags || [],
        score: parsed.score || 50
      };
    } catch (parseError) {
      return { riskLevel: 'medium', flags: ['Analysis error'], score: 50 };
    }
  }

  // SEPA payment formatting
  formatSEPA(intent: PaymentIntent): any {
    return {
      paymentType: 'SEPA',
      creditorName: intent.recipientName,
      creditorIBAN: intent.iban,
      amount: intent.amount,
      currency: intent.currency || 'EUR',
      remittanceInformation: intent.reference,
      executionDate: new Date().toISOString().split('T')[0]
    };
  }

  // Faster Payments formatting  
  formatFasterPayments(intent: PaymentIntent): any {
    return {
      paymentType: 'FasterPayments',
      payeeName: intent.recipientName,
      payeeAccountNumber: intent.iban?.replace(/[^0-9]/g, '').slice(-8), // Extract account number
      sortCode: intent.iban?.replace(/[^0-9]/g, '').slice(-14, -8), // Extract sort code
      amount: intent.amount,
      currency: 'GBP',
      reference: intent.reference?.slice(0, 18), // FP reference limit
      paymentDateTime: new Date().toISOString()
    };
  }
}
