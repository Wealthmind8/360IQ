
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { Level, CoachingFeedback, UserResponse, CognitiveProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLevelContent = async (levelNumber: number, currentProfile: CognitiveProfile): Promise<Level> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate Level ${levelNumber} for IQ360. The user's current profile is: ${JSON.stringify(currentProfile)}. 
    Ensure it aligns with the tier architecture (Tier ${Math.ceil(levelNumber / 3)}).
    Return the response in JSON format.`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.NUMBER },
          title: { type: Type.STRING },
          scenarioIntroduction: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ["id", "text", "type"]
            }
          }
        },
        required: ["id", "title", "scenarioIntroduction", "questions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const processLevelResponses = async (
  levelId: number,
  responses: UserResponse[],
  currentProfile: CognitiveProfile
): Promise<CoachingFeedback> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze user responses for Level ${levelId}. 
    Responses: ${JSON.stringify(responses)}. 
    Current Profile: ${JSON.stringify(currentProfile)}. 
    
    Provide coaching feedback and update the cognitive profile.
    Return the response in JSON format.`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          thinkingInsight: { type: Type.STRING },
          lifeApplication: { type: Type.STRING },
          businessApplication: { type: Type.STRING },
          coachRecommendation: { type: Type.STRING },
          levelProgressSummary: { type: Type.STRING },
          updatedProfile: {
            type: Type.OBJECT,
            properties: {
              cii: { type: Type.NUMBER },
              thinkingStyle: { type: Type.STRING },
              scores: {
                type: Type.OBJECT,
                properties: {
                  logicalReasoning: { type: Type.NUMBER },
                  executiveFunction: { type: Type.NUMBER },
                  innovationIndex: { type: Type.NUMBER },
                  emotionalRegulation: { type: Type.NUMBER },
                  strategicThinking: { type: Type.NUMBER },
                  decisionConsistency: { type: Type.NUMBER }
                }
              }
            }
          }
        },
        required: ["thinkingInsight", "lifeApplication", "businessApplication", "coachRecommendation", "levelProgressSummary", "updatedProfile"]
      }
    }
  });

  return JSON.parse(response.text);
};
