'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, AlertTriangle, XCircle, Brain, Shield, ArrowRight, CreditCard } from 'lucide-react';

interface PaymentIntent {
  recipientName?: string;
  iban?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  confidence: number;
  suggestedPaymentType: 'SEPA' | 'FasterPayments' | 'Unknown';
}

interface FraudFlags {
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
  score: number;
}

interface ProcessingResult {
  originalInput: string;
  parsedIntent: PaymentIntent;
  fraudAnalysis: FraudFlags;
  formattedPayment: any;
  processingTimestamp: string;
}

export default function PaymentIntentClarifier() {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const processPaymentIntent = async () => {
    if (!userInput.trim()) {
      setError('Please enter a payment instruction');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: userInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exampleInputs = [
    "Pay John €50 for dinner tonight",
    "Send £120 to Mary Smith for rent ASAP",
    "Transfer 200 EUR to GB29NWBK60161331926819 for invoice #12345",
    "Pay 75 pounds to cafe receipt"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Brain className="h-10 w-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              GenAI Payment Intent Clarifier
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform ambiguous payment instructions into structured SEPA and Faster Payments formats using advanced AI
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">GenAI Intervention Flow</h2>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                <Send className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">Raw Input</span>
              <span className="text-xs text-gray-500">"Pay John €50"</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-gray-400" />
            
            <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">AI Analysis</span>
              <span className="text-xs text-gray-500">NLP Processing</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-gray-400" />
            
            <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">Fraud Check</span>
              <span className="text-xs text-gray-500">Risk Analysis</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-gray-400" />
            
            <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">Structured Output</span>
              <span className="text-xs text-gray-500">SEPA/FasterPay</span>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Enter Payment Instruction</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Instruction (Natural Language)
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 'Pay John €50 for dinner' or 'Send £120 to Mary for rent'"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Try these examples:</span>
              {exampleInputs.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setUserInput(example)}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>

            <button
              onClick={processPaymentIntent}
              disabled={isProcessing || !userInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  Analyze Payment Intent
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                <XCircle className="h-5 w-5" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Parsed Intent */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Parsed Payment Intent
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recipient</label>
                    <p className="text-lg">{result.parsedIntent.recipientName || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-lg font-semibold text-green-600">
                      {result.parsedIntent.amount 
                        ? `${result.parsedIntent.currency} ${result.parsedIntent.amount}`
                        : 'Not specified'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference</label>
                    <p className="text-lg">{result.parsedIntent.reference || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      result.parsedIntent.suggestedPaymentType === 'SEPA' ? 'bg-blue-100 text-blue-800' :
                      result.parsedIntent.suggestedPaymentType === 'FasterPayments' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {result.parsedIntent.suggestedPaymentType}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">AI Confidence</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${result.parsedIntent.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${getConfidenceColor(result.parsedIntent.confidence)}`}>
                        {Math.round(result.parsedIntent.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  {result.parsedIntent.iban && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">IBAN</label>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                        {result.parsedIntent.iban}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fraud Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Shield className="h-6 w-6 text-orange-600" />
                Fraud Risk Analysis
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                    <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getRiskColor(result.fraudAnalysis.riskLevel)}`}>
                      {result.fraudAnalysis.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Risk Score</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            result.fraudAnalysis.score < 30 ? 'bg-green-500' :
                            result.fraudAnalysis.score < 70 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${result.fraudAnalysis.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{result.fraudAnalysis.score}/100</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Factors</label>
                  {result.fraudAnalysis.flags.length > 0 ? (
                    <div className="space-y-1">
                      {result.fraudAnalysis.flags.map((flag, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">{flag}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-green-600">No risk factors detected</p>
                  )}
                </div>
              </div>
            </div>

            {/* Formatted Payment */}
            {result.formattedPayment && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  Structured Payment Format
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(result.formattedPayment, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
