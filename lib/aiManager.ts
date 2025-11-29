/**
 * AI Service Manager
 * Manages multiple AI providers (OpenAI, Anthropic, Gemini)
 * Provides fallback mechanism and unified interface
 * API Keys loaded from admin_settings database table
 */

import { getAIApiKeys, getAIConfig } from './getAdminSettings';

export interface AIProvider {
  name: 'openai' | 'anthropic' | 'gemini';
  available: boolean;
  priority: number;
}

export interface AIDetectionResult {
  anomalyScore: number;
  confidence: number;
  provider: string;
  detectedPatterns: string[];
  reasoning: string;
}

class AIServiceManager {
  private providers: AIProvider[] = [
    { name: 'gemini', available: false, priority: 1 }, // Free & fast
    { name: 'openai', available: false, priority: 2 }, // Most accurate
    { name: 'anthropic', available: false, priority: 3 } // Best reasoning
  ];
  
  private apiKeys: { gemini: string | null; openai: string | null; anthropic: string | null } | null = null;
  private aiConfig: { geminiModel: string; openaiModel: string; enableAI: boolean } | null = null;

  constructor() {
    // Don't check availability in constructor (async operations not allowed)
    // Will be checked on first use
  }

  /**
   * Check which AI providers are available from database settings
   */
  private async checkAvailability() {
    // Get API keys from admin_settings table
    this.apiKeys = await getAIApiKeys();
    this.aiConfig = await getAIConfig();

    const hasOpenAI = !!this.apiKeys.openai && this.apiKeys.openai.length > 10;
    const hasAnthropic = !!this.apiKeys.anthropic && this.apiKeys.anthropic.length > 10;
    const hasGemini = !!this.apiKeys.gemini && this.apiKeys.gemini.length > 10;

    this.providers = this.providers.map(p => ({
      ...p,
      available: 
        (p.name === 'openai' && hasOpenAI) ||
        (p.name === 'anthropic' && hasAnthropic) ||
        (p.name === 'gemini' && hasGemini)
    }));

    console.log('[AI Manager] API Keys loaded from database (admin_settings table)');
    console.log('[AI Manager] Available providers:', 
      this.providers.filter(p => p.available).map(p => p.name).join(', ') || 'NONE'
    );
    console.log('[AI Manager] AI Enabled:', this.aiConfig?.enableAI);
  }

  /**
   * Get the best available AI provider
   */
  async getBestProvider(): Promise<AIProvider | null> {
    // Ensure availability is checked
    if (!this.apiKeys) {
      await this.checkAvailability();
    }
    
    const available = this.providers
      .filter(p => p.available)
      .sort((a, b) => a.priority - b.priority);
    
    return available[0] || null;
  }

  /**
   * Analyze attendance patterns using AI
   */
  async analyzeAttendancePatterns(params: {
    userId: string;
    currentData: {
      location: { lat: number; lng: number };
      wifi: string;
      fingerprint: string;
      networkInfo?: any;
      timestamp: number;
    };
    historicalData: Array<{
      location: { lat: number; lng: number };
      wifi: string;
      fingerprint: string;
      created_at: string;
    }>;
  }): Promise<AIDetectionResult> {
    // Ensure availability is checked
    if (!this.apiKeys) {
      await this.checkAvailability();
    }
    
    // Check if AI is enabled
    if (this.aiConfig && !this.aiConfig.enableAI) {
      console.log('[AI Manager] AI features disabled in settings, using rule-based detection');
      return this.fallbackRuleBasedDetection(params);
    }
    
    const provider = await this.getBestProvider();

    if (!provider) {
      console.warn('[AI Manager] No AI providers available (check admin_settings table), using rule-based detection');
      return this.fallbackRuleBasedDetection(params);
    }

    try {
      console.log(`[AI Manager] Using ${provider.name} for pattern analysis`);

      switch (provider.name) {
        case 'gemini':
          return await this.analyzeWithGemini(params);
        case 'openai':
          return await this.analyzeWithOpenAI(params);
        case 'anthropic':
          return await this.analyzeWithAnthropic(params);
        default:
          return this.fallbackRuleBasedDetection(params);
      }
    } catch (error) {
      console.error(`[AI Manager] Error with ${provider.name}:`, error);
      // Try next provider
      return this.fallbackRuleBasedDetection(params);
    }
  }

  /**
   * Analyze with Google Gemini (Free tier available)
   */
  private async analyzeWithGemini(params: any): Promise<AIDetectionResult> {
    if (!this.apiKeys?.gemini) {
      throw new Error('Gemini API key not found in admin_settings');
    }
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKeys.gemini);
    const modelName = this.aiConfig?.geminiModel || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = this.buildAnalysisPrompt(params);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return this.parseAIResponse(text, 'gemini');
  }

  /**
   * Analyze with OpenAI GPT
   */
  private async analyzeWithOpenAI(params: any): Promise<AIDetectionResult> {
    if (!this.apiKeys?.openai) {
      throw new Error('OpenAI API key not found in admin_settings');
    }
    
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: this.apiKeys.openai });

    const prompt = this.buildAnalysisPrompt(params);
    
    const modelName = this.aiConfig?.openaiModel || 'gpt-4o-mini';
    
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are a security analyst detecting anomalies in attendance patterns. Respond in JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const text = completion.choices[0]?.message?.content || '';
    return this.parseAIResponse(text, 'openai');
  }

  /**
   * Analyze with Anthropic Claude
   */
  private async analyzeWithAnthropic(params: any): Promise<AIDetectionResult> {
    if (!this.apiKeys?.anthropic) {
      throw new Error('Anthropic API key not found in admin_settings');
    }
    
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: this.apiKeys.anthropic });

    const prompt = this.buildAnalysisPrompt(params);

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return this.parseAIResponse(text, 'anthropic');
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(params: any): string {
    const { currentData, historicalData } = params;

    return `Analyze this attendance attempt for suspicious patterns. Respond ONLY with JSON.

CURRENT ATTEMPT:
- Location: ${currentData.location.lat}, ${currentData.location.lng}
- WiFi: ${currentData.wifi}
- Fingerprint: ${currentData.fingerprint.substring(0, 20)}...
- Network: ${JSON.stringify(currentData.networkInfo || {})}
- Time: ${new Date(currentData.timestamp).toISOString()}

HISTORICAL DATA (last ${historicalData.length} records):
${historicalData.map((h: any, i: number) => `
${i + 1}. Location: ${h.location.lat}, ${h.location.lng}
   WiFi: ${h.wifi}
   Fingerprint: ${h.fingerprint.substring(0, 20)}...
   Time: ${h.created_at}
`).join('\n')}

DETECT:
1. Impossible travel (speed > 30 km/h in city)
2. WiFi switching patterns (>3 different networks)
3. Device changes (different fingerprints)
4. Abnormal times (late night, weekends)
5. Network inconsistencies

Respond with JSON:
{
  "anomalyScore": 0-100,
  "confidence": 0-100,
  "detectedPatterns": ["PATTERN1", "PATTERN2"],
  "reasoning": "brief explanation"
}`;
  }

  /**
   * Parse AI response to standard format
   */
  private parseAIResponse(text: string, provider: string): AIDetectionResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          anomalyScore: parsed.anomalyScore || 0,
          confidence: parsed.confidence || 50,
          provider,
          detectedPatterns: parsed.detectedPatterns || [],
          reasoning: parsed.reasoning || 'AI analysis completed'
        };
      }
    } catch (error) {
      console.error('[AI Manager] Failed to parse AI response:', error);
    }

    // Fallback
    return {
      anomalyScore: 0,
      confidence: 0,
      provider: provider + '_fallback',
      detectedPatterns: [],
      reasoning: 'Failed to parse AI response'
    };
  }

  /**
   * Rule-based detection when no AI available
   */
  private fallbackRuleBasedDetection(params: any): AIDetectionResult {
    const { currentData, historicalData } = params;
    let score = 0;
    const patterns: string[] = [];

    // WiFi switching detection
    const uniqueWiFis = new Set(historicalData.map((h: any) => h.wifi));
    if (uniqueWiFis.size > 3) {
      score += 30;
      patterns.push('MULTIPLE_WIFI_NETWORKS');
    }

    // Device changes
    const uniqueFingerprints = new Set(historicalData.map((h: any) => h.fingerprint));
    if (uniqueFingerprints.size > 2) {
      score += 40;
      patterns.push('MULTIPLE_DEVICES');
    }

    // Time analysis
    const hour = new Date(currentData.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      score += 20;
      patterns.push('ABNORMAL_TIME');
    }

    // Weekend check
    const day = new Date(currentData.timestamp).getDay();
    if (day === 0 || day === 6) {
      score += 15;
      patterns.push('WEEKEND_ATTENDANCE');
    }

    // Impossible travel (simplified)
    if (historicalData.length > 0) {
      const lastRecord = historicalData[0];
      const timeDiff = (currentData.timestamp - new Date(lastRecord.created_at).getTime()) / 1000 / 60;
      const distance = this.calculateDistance(
        currentData.location,
        lastRecord.location
      );

      if (distance > 10000 && timeDiff < 60) { // 10km in 60min
        score += 50;
        patterns.push('IMPOSSIBLE_TRAVEL');
      }
    }

    return {
      anomalyScore: Math.min(score, 100),
      confidence: 70,
      provider: 'rule_based',
      detectedPatterns: patterns,
      reasoning: 'Rule-based detection (no AI provider available)'
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}

// Export singleton instance
export const aiManager = new AIServiceManager();
