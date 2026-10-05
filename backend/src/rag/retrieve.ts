/**
 * backend/src/rag/retrieve.ts
 *
 * Keyword-overlap retriever — intentionally zero-dependency, zero-latency.
 * Algorithm:
 *   1. Tokenize the question and each snippet into lowercase words.
 *   2. Remove a compact English + Hindi-Romanized stopword list.
 *   3. Score each snippet = |intersection of question tokens ∩ snippet tokens|.
 *      Tokens in the topic field get double weight (topic match is stronger signal).
 *   4. Return the topN snippets whose score >= MIN_SCORE_THRESHOLD.
 *      If nothing clears the threshold, return an empty array so the caller
 *      can instruct the model to admit it doesn't know.
 *
 * Upgrade path: swap this file's implementation for one that calls an
 * embeddings API (text-embedding-004, OpenAI, etc.) — the chatController
 * interface (question → KnowledgeSnippet[]) is unchanged.
 */

import { KNOWLEDGE_BASE, KnowledgeSnippet } from './knowledgeBase';

// ─── Stop-word list ───────────────────────────────────────────────────────────
// Compact set covering common English function words + a few Hindi-Romanized ones
// that appear in cooperative-sector questions.
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','not',
  'no','nor','so','yet','both','either','neither','than','as','if','then',
  'that','this','these','those','i','me','my','we','our','you','your','he',
  'she','it','they','them','his','her','its','their','what','which','who',
  'how','when','where','why','about','into','from','by','up','out','over',
  'after','before','just','also','any','all','some','more','most','other',
  'only','such','own','same','too','very','s','t','can','will','don','lt',
  'mujhe','mera','kya','hai','kaise','aur','ke','ka','ki','koi','kuch','bhi',
  'hain','mein','se','ko','par','ek','do',
]);

// Minimum number of overlapping significant tokens to include a snippet in context
const MIN_SCORE_THRESHOLD = 1;

// ─── Tokenizer ────────────────────────────────────────────────────────────────
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s₹%]/g, ' ')   // keep numbers, ₹, %
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  );
}

// ─── Scorer ───────────────────────────────────────────────────────────────────
function scoreSnippet(
  questionTokens: Set<string>,
  snippet: KnowledgeSnippet,
): number {
  const contentTokens = tokenize(snippet.content);
  const topicTokens   = tokenize(snippet.topic);

  let score = 0;
  for (const token of questionTokens) {
    if (contentTokens.has(token)) score += 1;
    if (topicTokens.has(token))   score += 1; // topic match doubles contribution
  }
  return score;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export interface ScoredSnippet extends KnowledgeSnippet {
  score: number;
}

/**
 * Retrieve the topN most relevant knowledge snippets for a given question.
 * Returns an empty array if no snippet meets the minimum relevance threshold.
 */
export function retrieveRelevant(
  question: string,
  topN = 3,
): KnowledgeSnippet[] {
  const qTokens = tokenize(question);

  // Edge case: question is entirely stopwords / too short
  if (qTokens.size === 0) return [];

  const scored: ScoredSnippet[] = KNOWLEDGE_BASE.map(snippet => ({
    ...snippet,
    score: scoreSnippet(qTokens, snippet),
  }));

  return scored
    .filter(s => s.score >= MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ score: _score, ...snippet }) => snippet); // strip score before returning
}
