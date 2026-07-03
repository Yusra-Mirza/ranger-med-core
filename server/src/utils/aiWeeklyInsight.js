import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
import { retryWithBackoff } from "./retryHelper.js";
// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Strict output JSON format
const JSON_SCHEMA_INSTRUCTION = `
Return your analysis EXCLUSIVELY as a JSON object adhering to this structure:
{
  "summary": "A 2-3 sentence supportive, professional, and clinical summary of the patient's weekly logs",
  "insights": [
    {
      "category": "medication" | "symptoms" | "wellness" | "alert" | "success",
      "priority": "high" | "medium" | "low",
      "title": "A short, engaging title",
      "message": "A detailed, supportive, and clinical message describing the insight and why it matters",
      "actionable": true or false,
      "action": "A suggested next step (e.g. 'Try setting a morning reminder' or 'Schedule a check-up') or an empty string if not actionable"
    }
  ]
}
`;

/**
 * Sends weekly stats to Gemini to generate supportive summaries and recommendations.
 */
export const analyzeWeeklyHealthAI = async (stats) => {
  const prompt = `
  Analyze the following patient health statistics for the past 7 days:
  - Medication Adherence Rate: ${stats.adherenceRate}%
  - Missed Doses: ${stats.missedDoses}
  - Current Streak: ${stats.streak} days
  - Active Symptoms Count: ${stats.activeSymptoms}
  - Average Symptom Severity: ${stats.averageSeverity}
  - Most Common Symptom: ${stats.mostCommonSymptom}
  - Overall Health Score: ${stats.overallHealthScore}/100
  - Achievements Earned: ${stats.achievements || "None"}

  Generate a personalized, clinically supportive weekly summary and actionable health insights.
  ${JSON_SCHEMA_INSTRUCTION}
  `;

  try {
    const result = await retryWithBackoff(()=>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2, // Low temperature keeps JSON schema structure deterministic
      },
      
    })
  );

    let jsonString = result.text.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.substring(0, jsonString.length - 3).trim();
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error in analyzeWeeklyHealthAI:", error);
    // Return a clean fallback object so the backend does not crash if Gemini fails
    return {
      summary: `Your weekly medication adherence rate was ${stats.adherenceRate}% with ${stats.activeSymptoms} active symptoms reported.`,
      insights: [
        {
          category: "wellness",
          priority: "medium",
          title: "Weekly Summary Generated",
          message:
            "We compiled your stats. Maintain your medication schedule and log symptoms daily.",
          actionable: false,
          action: "",
        },
      ],
    };
  }
};
