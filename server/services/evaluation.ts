import { db } from "../db";
import { evaluations } from "../../drizzle/schema";

export interface EvaluationMetrics {
  relevance: number;
  accuracy: number;
  clarity: number;
  completeness: number;
}

export async function evaluateResponse(
  messageId: number, 
  prompt: string, 
  response: string, 
  modelUsed: string
): Promise<EvaluationMetrics> {
  // In a real system, you might use another LLM (e.g., GPT-4) as a judge here.
  // For now, we use a heuristic simulation based on length and keywords to generate metrics
  
  const wordCount = response.split(/\s+/).length;
  const hasCitations = /\[\d+\]/.test(response);
  
  // Simulated evaluation logic
  let relevance = 0.7 + (Math.random() * 0.3); // 0.7 to 1.0
  let accuracy = 0.8 + (Math.random() * 0.2); // 0.8 to 1.0
  let clarity = 0.75 + (Math.random() * 0.25); // 0.75 to 1.0
  let completeness = Math.min(1.0, wordCount / 200) * 0.9 + 0.1; // Longer is more complete, up to 1.0

  if (hasCitations) {
    accuracy = Math.min(1.0, accuracy + 0.1);
    completeness = Math.min(1.0, completeness + 0.1);
  }

  // Cap values
  relevance = parseFloat(Math.min(1.0, relevance).toFixed(2));
  accuracy = parseFloat(Math.min(1.0, accuracy).toFixed(2));
  clarity = parseFloat(Math.min(1.0, clarity).toFixed(2));
  completeness = parseFloat(Math.min(1.0, completeness).toFixed(2));

  // Save to database
  await db.insert(evaluations).values({
    messageId,
    modelId: modelUsed,
    relevanceScore: relevance.toString(),
    accuracyScore: accuracy.toString(),
    clarityScore: clarity.toString(),
    completenessScore: completeness.toString(),
    createdAt: new Date(),
  });

  return { relevance, accuracy, clarity, completeness };
}

export async function getModelPerformanceStats() {
  const allEvaluations = await db.query.evaluations.findMany();
  
  const statsByModel: Record<string, {
    count: number;
    avgRelevance: number;
    avgAccuracy: number;
    avgClarity: number;
    avgCompleteness: number;
  }> = {};

  for (const ev of allEvaluations) {
    if (!statsByModel[ev.modelId]) {
      statsByModel[ev.modelId] = {
        count: 0,
        avgRelevance: 0,
        avgAccuracy: 0,
        avgClarity: 0,
        avgCompleteness: 0,
      };
    }
    
    const stats = statsByModel[ev.modelId];
    stats.count++;
    stats.avgRelevance += parseFloat(ev.relevanceScore || "0");
    stats.avgAccuracy += parseFloat(ev.accuracyScore || "0");
    stats.avgClarity += parseFloat(ev.clarityScore || "0");
    stats.avgCompleteness += parseFloat(ev.completenessScore || "0");
  }

  // Calculate averages
  for (const modelId in statsByModel) {
    const stats = statsByModel[modelId];
    if (stats.count > 0) {
      stats.avgRelevance = stats.avgRelevance / stats.count;
      stats.avgAccuracy = stats.avgAccuracy / stats.count;
      stats.avgClarity = stats.avgClarity / stats.count;
      stats.avgCompleteness = stats.avgCompleteness / stats.count;
    }
  }

  return Object.entries(statsByModel).map(([modelId, stats]) => ({
    modelId,
    ...stats
  }));
}
