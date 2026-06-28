import type { AIProvider } from "../interfaces";
import { localProvider } from "./local-provider";
import { openaiProvider } from "./openai-provider";

const REGISTRY = new Map<string, AIProvider>([
  ["local", localProvider],
  ["openai", openaiProvider],
]);

export function getProvider(name: string): AIProvider {
  const provider = REGISTRY.get(name);
  if (!provider) {
    throw new Error(`Unknown AI provider '${name}'. Available: ${[...REGISTRY.keys()].join(", ")}`);
  }
  return provider;
}

export function listProviders(): string[] {
  return [...REGISTRY.keys()];
}

export function registerProvider(provider: AIProvider): void {
  REGISTRY.set(provider.name, provider);
}
