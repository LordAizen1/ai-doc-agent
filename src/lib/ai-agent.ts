import { AIAnalysis, VMCounter } from '@/types';

export class DocumentReviewAgent {
  private apiKey: string;
  private vmCounter: VMCounter;
  private model = 'anthropic/claude-3.5-haiku';

  constructor(vmCounter: VMCounter) {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.vmCounter = vmCounter;
  }

  async analyzeDocument(text: string, docSource: string): Promise<AIAnalysis | null> {
    console.log('🤖 AI Agent: Starting document analysis...');
    this.vmCounter.increment('ai_agent_analysis_started');

    const prompt = this.buildAnalysisPrompt(text, docSource);
    const response = await this.callLLM(prompt);
    
    if (!response) return null;
    
    const analysis = this.parseResponse(response);
    this.vmCounter.increment('ai_agent_analysis_completed');
    
    return analysis;
  }

  private buildAnalysisPrompt(text: string, docSource: string): string {
    return `You are an AI document review agent. Analyze documents for security risks, sensitive information, and compliance issues.

Document Source: ${docSource}
Document Content:
${text.substring(0, 3000)}

Analyze and provide:

1. **Sensitive Information Found:**
   - Email addresses (any format)
   - Phone numbers (any format)
   - Physical addresses
   - Personal identifiers

2. **Security/Confidentiality Concerns:**
   - Confidential markings
   - Privacy-sensitive content
   - Internal/proprietary information

3. **Context Assessment:**
   - Document type
   - Intended audience
   - Risk level (0-10)

4. **Recommendation:**
   - Requires human approval? (yes/no)
   - Action to take
   - External service to call

Return ONLY valid JSON in this EXACT format:
{
  "sensitive_info": {
    "emails": [],
    "phones": [],
    "addresses": [],
    "other_pii": []
  },
  "security_concerns": {
    "confidential_markers": [],
    "privacy_issues": [],
    "proprietary_info": []
  },
  "context": {
    "document_type": "",
    "intended_audience": "",
    "risk_level": 0
  },
  "recommendation": {
    "requires_human_approval": false,
    "reasoning": "",
    "suggested_action": "",
    "external_service": "logging_service"
  },
  "total_red_flags": 0,
  "summary": ""
}`;
  }

  private async callLLM(prompt: string): Promise<string | null> {
    console.log('🔄 Calling Claude 3.5 Haiku...');
    this.vmCounter.increment('llm_api_called');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      const result = await response.json();
      return result.choices[0].message.content;
    } catch (error) {
      console.error('❌ LLM API Error:', error);
      this.vmCounter.increment('llm_api_error');
      return null;
    }
  }

  private parseResponse(response: string): AIAnalysis | null {
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = response;
      if (response.includes('```json')) {
        const start = response.indexOf('```json') + 7;
        const end = response.indexOf('```', start);
        jsonStr = response.substring(start, end).trim();
      } else if (response.includes('```')) {
        const start = response.indexOf('```') + 3;
        const end = response.indexOf('```', start);
        jsonStr = response.substring(start, end).trim();
      }

      const analysis = JSON.parse(jsonStr);
      this.vmCounter.increment('ai_response_parsed');
      return analysis;
    } catch (error) {
      console.error('⚠️ Could not parse AI response:', error);
      this.vmCounter.increment('ai_response_parse_error');
      return null;
    }
  }

  decideExternalService(analysis: AIAnalysis): string {
    if (!analysis || !analysis.recommendation) {
      return 'logging_service';
    }

    const service = analysis.recommendation.external_service || 'logging_service';
    console.log(`🎯 AI Agent Decision: Call ${service}`);
    this.vmCounter.increment(`ai_decided_${service}`);
    
    return service;
  }
}
