import type { AIResponse, LocationInfo } from '@/types';
import { processWithRADE, type RADEContext } from './radeEngine';

export interface AIAssistantContext {
  location: LocationInfo | null;
  language: string;
  demoMode: boolean;
}

export async function processAIQuery(query: string, context: AIAssistantContext): Promise<AIResponse> {
  const radeContext: RADEContext = {
    location: context.location,
    language: context.language,
    demoMode: context.demoMode,
  };

  const result = await processWithRADE(query, radeContext);
  return result.response;
}

export async function processAIQueryWithRADE(query: string, context: AIAssistantContext) {
  const radeContext: RADEContext = {
    location: context.location,
    language: context.language,
    demoMode: context.demoMode,
  };

  return processWithRADE(query, radeContext);
}
