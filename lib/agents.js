/**
 * KiteFlow Agent Definitions — used by all Next.js API routes.
 * Each agent has distinct tools, pricing logic, and system prompts.
 * This is what makes agents genuinely different, not just relabeled.
 */

export const AGENTS = {
  "kiteflow-data-alpha-v1": {
    id: "kiteflow-data-alpha-v1",
    name: "DataAlpha",
    category: "data",
    icon: "D",
    colorClass: "blue",
    tools: ["web_search", "rss_reader", "sentiment_api"],
    pricingLogic: "flat",
    priceUsdc: 0.5,
    reputationSeed: 92,
    description: "Multi-source research. Cross-references 3+ sources with confidence scoring.",
    systemPrompt: `You are DataAlpha, a professional research agent.
You simulate using three tools: web_search, rss_reader, and sentiment_api.
Always cross-reference at least 3 angles before concluding.
Return ONLY valid JSON — no markdown, no preamble, no trailing text:
{
  "summary": "2-3 sentence synthesis",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "sentiment": { "positive": 0, "neutral": 0, "negative": 0 },
  "confidence": 0,
  "sources": ["Source A", "Source B", "Source C"]
}
All sentiment and confidence values are integers 0-100. They must sum to 100 for sentiment.`,
  },

  "kiteflow-copy-prime-v1": {
    id: "kiteflow-copy-prime-v1",
    name: "CopyPrime",
    category: "copy",
    icon: "C",
    colorClass: "teal",
    tools: ["brand_voice_api", "readability_scorer", "ab_variant_gen"],
    pricingLogic: "per_word",
    priceUsdc: 0.35,
    reputationSeed: 88,
    description: "3-variant A/B copywriter with readability and conversion scoring.",
    systemPrompt: `You are CopyPrime, a conversion-focused copywriting agent.
You simulate: brand_voice_api, readability_scorer, ab_variant_gen.
Generate exactly 3 copy variants. Score each on readability (0-100) and estimated conversion rate (0-100).
Return ONLY valid JSON — no markdown, no preamble:
{
  "selectedVariant": {
    "headline": "string",
    "body": "string",
    "cta": "string",
    "readabilityScore": 0,
    "conversionScore": 0
  },
  "alternativeVariants": [
    { "headline": "string", "body": "string", "readabilityScore": 0, "conversionScore": 0 },
    { "headline": "string", "body": "string", "readabilityScore": 0, "conversionScore": 0 }
  ],
  "wordCount": 0,
  "brandVoice": "brief description of detected brand voice"
}`,
  },

  "kiteflow-image-fx-v1": {
    id: "kiteflow-image-fx-v1",
    name: "ImageFX",
    category: "image",
    icon: "I",
    colorClass: "amber",
    tools: ["dalle_prompt_optimizer", "style_transfer", "aspect_ratio_gen"],
    pricingLogic: "per_image_batch",
    priceUsdc: 0.8,
    reputationSeed: 79,
    description: "Batched image direction — 3 aspect ratios with negative prompts in 1 call.",
    systemPrompt: `You are ImageFX, a visual direction agent.
You simulate: dalle_prompt_optimizer, style_transfer, aspect_ratio_gen.
Generate image prompts for 3 aspect ratios: 1:1 (square), 4:5 (portrait), 16:9 (landscape).
Return ONLY valid JSON — no markdown, no preamble:
{
  "prompts": {
    "square": { "positive": "string", "negative": "string", "style": "string" },
    "portrait": { "positive": "string", "negative": "string", "style": "string" },
    "landscape": { "positive": "string", "negative": "string", "style": "string" }
  },
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "moodKeywords": ["word1", "word2", "word3"],
  "batchSavings": "Batched 3 outputs in 1 API call"
}`,
  },

  "kiteflow-action-x-v1": {
    id: "kiteflow-action-x-v1",
    name: "ActionX",
    category: "action",
    icon: "A",
    colorClass: "coral",
    tools: ["shopify_api", "stripe_api", "inventory_check"],
    pricingLogic: "success_fee",
    priceUsdc: 0.4,
    reputationSeed: 95,
    description: "Commerce executor. Inventory check + dynamic pricing + live listing. Success-fee only.",
    systemPrompt: `You are ActionX, a commerce execution agent.
You simulate: shopify_api, inventory_check, stripe_api.
Always check inventory first. Apply dynamic pricing. Create draft + live versions.
Return ONLY valid JSON — no markdown, no preamble:
{
  "inventoryCheck": {
    "units": 0,
    "warehouseId": "WH-001",
    "status": "available"
  },
  "pricingStrategy": {
    "basePrice": 0,
    "recommendedPrice": 0,
    "margin": 0,
    "rationale": "string"
  },
  "listing": {
    "title": "string",
    "description": "string",
    "tags": ["tag1", "tag2"],
    "draftUrl": "https://shop.example.com/products/draft-123",
    "liveUrl": "https://shop.example.com/products/live-123",
    "publishedAt": "ISO date string"
  },
  "pricingModel": "success_fee"
}`,
  },
};

export function getAgent(id) {
  return AGENTS[id] || null;
}

export function getAllAgents() {
  return Object.values(AGENTS);
}

export function getBestAgentForCategory(category, excludeId = null) {
  const candidates = Object.values(AGENTS).filter(
    (a) => a.category === category && a.id !== excludeId
  );
  if (!candidates.length) return null;
  return candidates.sort((a, b) => b.reputationSeed - a.reputationSeed)[0];
}
