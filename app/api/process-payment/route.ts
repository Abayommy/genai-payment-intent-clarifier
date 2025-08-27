// app/api/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentIntentProcessor } from '@/lib/ai-processor';

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();
    
    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payment instruction' },
        { status: 400 }
      );
    }

    const processor = new PaymentIntentProcessor();
    const result = await processor.processPaymentIntent(userInput);
    
    // Format based on payment type
    let formattedPayment = null;
    if (result.intent.suggestedPaymentType === 'SEPA') {
      formattedPayment = processor.formatSEPA(result.intent);
    } else if (result.intent.suggestedPaymentType === 'FasterPayments') {
      formattedPayment = processor.formatFasterPayments(result.intent);
    }

    return NextResponse.json({
      success: true,
      data: {
        originalInput: userInput,
        parsedIntent: result.intent,
        fraudAnalysis: result.fraudAnalysis,
        formattedPayment,
        processingTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment intent' },
      { status: 500 }
    );
  }
}
