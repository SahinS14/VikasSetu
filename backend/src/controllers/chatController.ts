/**
 * backend/src/controllers/chatController.ts
 *
 * Career Sahayak chat handler — RAG-augmented via Gemini 1.5 Flash.
 *
 * Flow:
 *   1. Save the user's message to ChatMessage table.
 *   2. Retrieve the top-3 relevant knowledge snippets (keyword-overlap, no embeddings).
 *   3. Build a structured prompt (system instruction + context + question).
 *   4. Call Gemini 1.5 Flash for the final grounded answer.
 *   5. Save the assistant reply to ChatMessage and return it.
 *
 * Fallback chain (most-reliable-first):
 *   - If GEMINI_API_KEY is not configured → rule-based response (original behaviour).
 *   - If the retriever finds no relevant snippets → Gemini is still called, but
 *     with an explicit instruction to admit it lacks specific information rather
 *     than hallucinating.
 *   - If the Gemini call itself fails → fall through to rule-based response so
 *     the chatbot never returns a 500 error to the user.
 *
 * Upgrade note:
 *   To switch to embedding-based retrieval, replace retrieve.ts only.
 *   This controller's interface (question → answer string) is unchanged.
 */

import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chatRepository } from '../repositories/chatRepository';
import { retrieveRelevant } from '../rag/retrieve';
import { KnowledgeSnippet } from '../rag/knowledgeBase';

// ─── Gemini client (lazily initialised so missing key = graceful degradation) ──
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (geminiClient) return geminiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn('[ChatController] GEMINI_API_KEY not set — falling back to grounded rule-based responses.');
    return null;
  }
  geminiClient = new GoogleGenerativeAI(key);
  return geminiClient;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are Career Sahayak, a helpful career and learning assistant embedded in the VikasSetu platform. VikasSetu is built by NCCT (National Centre for Cooperative Training) to help trainees in the Indian cooperative sector find jobs, earn certificates, and develop skills.

Your job is to answer user questions clearly, concisely, and accurately.

Rules:
- Only use information that is explicitly present in the CONTEXT snippets below.
- If the CONTEXT does not contain enough information to answer the question, say exactly: "I don't have specific information on that topic. Please contact your institute admin or visit the NCCT portal for guidance."
- Do NOT invent figures, scheme names, eligibility criteria, or URLs that are not in the CONTEXT.
- Keep answers focused and under 150 words unless the user explicitly asks for more detail.
- Use plain, approachable language suitable for rural cooperative-sector trainees.`;

function buildPrompt(userQuestion: string, contextSnippets: KnowledgeSnippet[]): string {
  if (contextSnippets.length === 0) {
    // No relevant context — instruct the model to be honest
    return `${SYSTEM_INSTRUCTION}

CONTEXT: (none — no relevant information found in the knowledge base)

USER QUESTION: ${userQuestion}`;
  }

  const contextBlock = contextSnippets
    .map((s, i) => `[${i + 1}] Topic: ${s.topic}\n${s.content}`)
    .join('\n\n');

  return `${SYSTEM_INSTRUCTION}

CONTEXT:
${contextBlock}

USER QUESTION: ${userQuestion}`;
}

// ─── Rule-based / Local grounded fallback ─────────────────────────────────────
function getRuleBasedResponse(message: string, snippets: KnowledgeSnippet[] = []): string {
  // If relevant snippets were retrieved via RAG, ground the response directly on them
  if (snippets.length > 0) {
    return snippets.map(s => s.content).join('\n\n');
  }

  const lower = message.toLowerCase();
  if (lower.includes('certificate') || lower.includes('cert')) {
    return 'Your certificates are listed under the "My Certificates" section. Each has a QR code for public verification. Complete all course quizzes to earn new certificates.';
  }
  if (lower.includes('job') || lower.includes('career') || lower.includes('employ')) {
    return 'Check the "Job Opportunities" section for positions from cooperative sector employers. Express interest in roles that match your skills to notify the employer.';
  }
  if (lower.includes('course') || lower.includes('learn') || lower.includes('module')) {
    return 'Your active courses are under "My Courses". Complete lessons in order, then take the module quiz. Passing all module quizzes earns a course certificate.';
  }
  if (lower.includes('attendance') || lower.includes('qr') || lower.includes('kiosk')) {
    return 'Use the QR scanner or Face Check-in kiosk to mark your session attendance. Make sure you are physically present at the institute for the check-in to succeed.';
  }
  if (lower.includes('pacs') || lower.includes('kcc') || lower.includes('cooperative')) {
    return 'PACS (Primary Agricultural Credit Societies) are the backbone of rural cooperative credit. The PACS Computerization course covers ERP operations, KCC management, and AMCS workflows.';
  }
  return "I don't have specific information on that topic. Please contact your institute admin or visit the NCCT portal for guidance.";
}

// ─── Controller ───────────────────────────────────────────────────────────────
export const chatController = {
  send: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId  = req.user!.userId;
      const userMsg = req.body.message as string;

      // 1. Save the user message first
      await chatRepository.saveMessage({ userId, role: 'user', content: userMsg });

      // 2. Retrieve relevant knowledge snippets (synchronous, no I/O)
      const snippets = retrieveRelevant(userMsg, 3);

      let responseText: string;

      // 3. Attempt Gemini-powered RAG response
      const client = getGeminiClient();
      if (client) {
        try {
          const model  = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const prompt = buildPrompt(userMsg, snippets);

          const result = await model.generateContent(prompt);
          const candidate = result.response.candidates?.[0];
          const rawText = candidate?.content?.parts?.[0]?.text ?? '';

          if (rawText.trim()) {
            responseText = rawText.trim();
          } else {
            // Gemini returned empty — fall back
            console.warn('[ChatController] Gemini returned empty response, using rule-based fallback.');
            responseText = getRuleBasedResponse(userMsg, snippets);
          }
        } catch (geminiErr) {
          // Gemini API error — degrade gracefully, never bubble a 500
          console.error('[ChatController] Gemini API error:', geminiErr);
          responseText = getRuleBasedResponse(userMsg, snippets);
        }
      } else {
        // No API key configured — grounded retrieval fallback
        responseText = getRuleBasedResponse(userMsg, snippets);
      }

      // 4. Save the assistant reply and return it
      const saved = await chatRepository.saveMessage({ userId, role: 'assistant', content: responseText });

      res.json({
        message:   responseText,
        timestamp: saved.timestamp,
        // Surface retrieval metadata in dev mode — useful for debugging
        ...(process.env.NODE_ENV === 'development' && {
          _debug: {
            snippetsRetrieved: snippets.length,
            snippetTopics: snippets.map(s => s.topic),
          },
        }),
      });
    } catch (err) { next(err); }
  },

  history: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages = await chatRepository.getHistory(req.user!.userId);
      res.json(messages);
    } catch (err) { next(err); }
  },
};
