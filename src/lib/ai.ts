/**
 * Optional AI import with the user's own key. Nothing here runs unless the user configured it in Settings → AI.
 * - Anthropic: official SDK, structured JSON output (output_config.format).
 * - OpenAI-compatible: any /chat/completions endpoint (OpenAI, Mistral, OpenRouter, a local Ollama…).
 * The model returns raw ingredient lines and steps; Popote's own parser turns them into quantities and units,
 * so AI imports behave exactly like every other import.
 */
import Anthropic from '@anthropic-ai/sdk';
import { parseIngredient } from './parse/ingredient';
import { findDurationSeconds } from './parse/duration';
import { uid } from './text';
import { DISH_TYPES, type AiSettings, type DishType, type RecipeDraft, type SourceType } from './types';

export const DEFAULT_MODELS: Record<AiSettings['provider'], string> = {
  anthropic: 'claude-opus-5-5',
  openai: 'gpt-4o-mini',
};

/** Claude models that accept the server-side refusal fallback ("default" routing). */
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5']);

export interface AiInput {
  text?: string;
  /** base64 images (no data: prefix) */
  images?: { data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[];
  /** base64 PDF */
  pdf?: string;
}

interface AiRecipe {
  title: string;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  dish_type: DishType;
  ingredients: string[];
  steps: string[];
  tags: string[];
}

const SCHEMA = {
  type: 'object',
  properties: {
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          servings: { type: 'integer' },
          prep_minutes: { type: 'integer' },
          cook_minutes: { type: 'integer' },
          dish_type: { type: 'string', enum: DISH_TYPES },
          ingredients: { type: 'array', items: { type: 'string' } },
          steps: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'servings', 'prep_minutes', 'cook_minutes', 'dish_type', 'ingredients', 'steps', 'tags'],
        additionalProperties: false,
      },
    },
  },
  required: ['recipes'],
  additionalProperties: false,
} as const;

function instructions(lang: 'fr' | 'en') {
  const language = lang === 'fr' ? 'French' : 'English';
  return `You read recipes from photos (cookbook pages, handwritten cards, screenshots), PDFs or messy text, and return them as data.
Rules:
- One entry in "recipes" per distinct recipe. If there is no recipe at all, return an empty list.
- "ingredients": one string per ingredient, quantity and unit first, exactly as a cook would write it, e.g. "200 g de farine", "2 c. à soupe d'huile d'olive", "3 eggs". Keep the original quantities.
- "steps": one string per step, in order, without numbering. If the source gives no steps but the dish is clear, write short sensible steps.
- Unknown numbers are 0 (servings 0 means unknown).
- Write titles, ingredients and steps in ${language}, translating if needed.
- "tags": at most 4 short lowercase words (diet, cuisine, occasion).`;
}

function toDrafts(json: unknown, sourceType: SourceType): RecipeDraft[] {
  const list = (json as { recipes?: AiRecipe[] })?.recipes;
  if (!Array.isArray(list)) throw new Error('bad response');
  return list
    .filter((r) => r && r.title && (r.ingredients?.length || r.steps?.length))
    .map((r) => ({
      title: r.title.trim(),
      sourceType,
      servings: r.servings > 0 ? r.servings : 2,
      prepMinutes: r.prep_minutes || undefined,
      cookMinutes: r.cook_minutes || undefined,
      totalMinutes: r.prep_minutes + r.cook_minutes || undefined,
      dishType: DISH_TYPES.includes(r.dish_type) ? r.dish_type : 'main',
      tags: (r.tags ?? []).slice(0, 4),
      ingredients: (r.ingredients ?? []).filter(Boolean).map(parseIngredient),
      steps: (r.steps ?? []).filter(Boolean).map((text) => ({ id: uid(), text, timerSeconds: findDurationSeconds(text) })),
    }));
}

async function anthropicExtract(ai: AiSettings, input: AiInput, lang: 'fr' | 'en'): Promise<unknown> {
  // The key belongs to the user and lives on their own device; this is a bring-your-own-key client.
  const client = new Anthropic({ apiKey: ai.apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.pdf) content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: input.pdf } });
  for (const img of input.images ?? []) content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } });
  content.push({ type: 'text', text: input.text?.trim() ? `Source:\n${input.text}` : 'Read the recipe(s) in the attached file(s).' });

  const withFallback = FALLBACK_MODELS.has(ai.model);
  const response = await client.beta.messages.create({
    model: ai.model || DEFAULT_MODELS.anthropic,
    max_tokens: 16000,
    system: instructions(lang),
    messages: [{ role: 'user', content }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA as unknown as Record<string, unknown> } },
    ...(withFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
  });
  if (response.stop_reason === 'refusal') throw new Error('refused');
  if (response.stop_reason === 'max_tokens') throw new Error('too long');
  const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  return JSON.parse(text);
}

async function openaiExtract(ai: AiSettings, input: AiInput, lang: 'fr' | 'en'): Promise<unknown> {
  const base = (ai.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const parts: unknown[] = [
    { type: 'text', text: `${input.text?.trim() ? `Source:\n${input.text}\n\n` : ''}Answer with JSON only, matching: ${JSON.stringify(SCHEMA)}` },
  ];
  for (const img of input.images ?? []) parts.push({ type: 'image_url', image_url: { url: `data:${img.mediaType};base64,${img.data}` } });
  if (input.pdf) throw new Error('PDF needs the Anthropic provider');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(ai.apiKey ? { Authorization: `Bearer ${ai.apiKey}` } : {}) },
    body: JSON.stringify({
      model: ai.model || DEFAULT_MODELS.openai,
      messages: [
        { role: 'system', content: instructions(lang) },
        { role: 'user', content: parts },
      ],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no JSON in answer');
  return JSON.parse(m[0]);
}

export async function aiExtract(ai: AiSettings, input: AiInput, lang: 'fr' | 'en', sourceType: SourceType): Promise<RecipeDraft[]> {
  const json = ai.provider === 'anthropic' ? await anthropicExtract(ai, input, lang) : await openaiExtract(ai, input, lang);
  return toDrafts(json, sourceType);
}

/** Small round trip to check the key and model. */
export async function aiTest(ai: AiSettings, lang: 'fr' | 'en'): Promise<void> {
  const drafts = await aiExtract(ai, { text: '2 eggs, 1 pinch of salt. Beat the eggs, cook 2 min in a hot pan.' }, lang, 'text');
  if (!drafts.length) throw new Error('empty answer');
}

export function aiErrorMessage(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'invalid API key (401)';
  if (e instanceof Anthropic.PermissionDeniedError) return 'key not allowed (403)';
  if (e instanceof Anthropic.NotFoundError) return 'unknown model (404)';
  if (e instanceof Anthropic.RateLimitError) return 'rate limited, try again later (429)';
  if (e instanceof Anthropic.BadRequestError) return `request refused: ${e.message}`;
  if (e instanceof Anthropic.APIConnectionError) return 'no connection';
  if (e instanceof Anthropic.APIError) return `API error ${e.status ?? ''}`.trim();
  return e instanceof Error ? e.message : String(e);
}
