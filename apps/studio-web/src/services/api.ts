/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Scenario,
  AnalyzePayload,
  AnalyzeResponse,
  ReplayPayload,
  ReplayResponse
} from '../types';
import { MOCK_SCENARIOS, MOCK_ANALYSIS, MOCK_REPLAY, MOCK_ANALYSES, MOCK_REPLAYS } from './mockData';

// Determine if we should default to mock mode.
// We also expose a dynamic switcher so users can test both flows live.
const IS_MOCK_ENV = (import.meta as unknown as { env: { VITE_USE_MOCK_API?: string } }).env?.VITE_USE_MOCK_API !== 'false';

// Simple delay helper to simulate real-world API latency for a realistic UI flow.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ApiClient {
  private static useMock = IS_MOCK_ENV;

  public static isMockMode(): boolean {
    return this.useMock;
  }

  public static setMockMode(enabled: boolean): void {
    this.useMock = enabled;
    console.log(`[ContextMeter API] Mock mode set to: ${enabled}`);
  }

  /**
   * GET /api/health
   */
  public static async checkHealth(): Promise<{ status: string; mode: string }> {
    if (this.useMock) {
      await delay(300);
      return { status: 'ok', mode: 'mock' };
    }

    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, falling back to mock environment.', err);
      return { status: 'ok', mode: 'fallback-mock' };
    }
  }

  /**
   * GET /api/scenarios
   */
  public static async getScenarios(): Promise<Scenario[]> {
    if (this.useMock) {
      await delay(600);
      return MOCK_SCENARIOS;
    }

    try {
      const res = await fetch('/api/scenarios');
      if (!res.ok) {
        throw new Error(`Failed to load scenarios (${res.status})`);
      }
      return await res.json();
    } catch (err) {
      console.error('API Error in getScenarios, using mock fallback', err);
      // Fallback gracefully so the UI doesn't crash
      return MOCK_SCENARIOS;
    }
  }

  /**
   * GET /api/scenarios/:id
   */
  public static async getScenario(scenarioId: string): Promise<Scenario> {
    if (this.useMock) {
      await delay(500);
      const found = MOCK_SCENARIOS.find((s) => s.id === scenarioId);
      if (!found) {
        throw new Error(`Scenario '${scenarioId}' not found.`);
      }
      return found;
    }

    try {
      const res = await fetch(`/api/scenarios/${scenarioId}`);
      if (!res.ok) {
        throw new Error(`Failed to load scenario ${scenarioId} (${res.status})`);
      }
      return await res.json();
    } catch (err) {
      console.error(`API Error in getScenario(${scenarioId}), using mock fallback`, err);
      const found = MOCK_SCENARIOS.find((s) => s.id === scenarioId);
      if (!found) throw new Error(`Scenario '${scenarioId}' not found in fallbacks.`);
      return found;
    }
  }

  private static detectScenario(task: string): string {
    const t = (task || '').toLowerCase();
    if (t.includes('dti') || t.includes('mortgage') || t.includes('underwriting') || t.includes('income')) {
      return 'mortgage-underwriting-conflict';
    }
    if (t.includes('london') || t.includes('flight') || t.includes('business class') || t.includes('travel')) {
      return 'corporate-policy-conflict';
    }
    return 'banking-policy-conflict';
  }

  /**
   * POST /api/analyze
   */
  public static async analyzeContext(payload: AnalyzePayload): Promise<AnalyzeResponse> {
    const scenarioId = this.detectScenario(payload.task);
    const mockResponse = MOCK_ANALYSES[scenarioId] || MOCK_ANALYSIS;

    if (this.useMock) {
      // Simulate analysis latency to represent heavy processing
      await delay(1200);
      return mockResponse;
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`Analysis request failed with status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error('API Error in analyzeContext, using mock fallback', err);
      return mockResponse;
    }
  }

  /**
   * POST /api/replay
   */
  public static async replayAgent(payload: ReplayPayload): Promise<ReplayResponse> {
    const scenarioId = this.detectScenario(payload.task);
    const mockResponse = MOCK_REPLAYS[scenarioId] || MOCK_REPLAY;

    if (this.useMock) {
      // Simulate agent replay latency to model pipeline re-execution
      await delay(1400);
      return mockResponse;
    }

    try {
      const res = await fetch('/api/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`Replay request failed with status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error('API Error in replayAgent, using mock fallback', err);
      return mockResponse;
    }
  }
}
