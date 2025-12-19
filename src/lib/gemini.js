import { GoogleGenAI } from "@google/genai";

/**
 * AI Service for analyzing guitar lesson notes using Gemini 3.
 * Focusing on extracting nuanced technical themes, focus areas, and bottlenecks.
 */

export async function analyzeLessonNotes(apiKey, lessons) {
  if (!apiKey) throw new Error("Missing Gemini API Key");
  if (!lessons || lessons.length === 0) return null;

  // Sort lessons by date descending (newest first)
  const sortedLessons = [...lessons].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Take last 10 for detailed recency focus
  const recentLessons = sortedLessons.slice(0, 10);

  // Initialize new @google/genai SDK
  const ai = new GoogleGenAI({ apiKey });

  const notesText = recentLessons.map(l => `Date: ${l.date}\nNotes: ${l.notes}`).join("\n---\n");

  const prompt = `Instructions:
1. Analyze the last 10 guitar lesson notes.
2. Return a JSON object with this exact structure:
{
  "summary": "1-2 sentences in Russian summarizing progress.",
  "bottlenecks": ["3-4 specific technical issues in Russian"]
}

Notes:
${notesText}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });

    let text = response.text;

    // Support both the direct text and potentially nested response structures
    if (typeof text !== 'string') {
      text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Clean up markdown markers
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini 3 Analysis Error:", error);
    throw error;
  }
}
