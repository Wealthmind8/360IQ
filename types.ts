
export enum GameState {
  WELCOME = 'WELCOME',
  LEVEL_ACTIVE = 'LEVEL_ACTIVE',
  COACHING = 'COACHING',
  SUMMARY = 'SUMMARY',
  DASHBOARD = 'DASHBOARD'
}

export interface DomainScores {
  logicalReasoning: number;
  executiveFunction: number;
  innovationIndex: number;
  emotionalRegulation: number;
  strategicThinking: number;
  decisionConsistency: number;
}

export interface CognitiveProfile {
  cii: number;
  scores: DomainScores;
  thinkingStyle: string;
}

export interface Question {
  id: string;
  text: string;
  type: string; // logic, scenario, executive, innovation, psychological, life_business
}

export interface Level {
  id: number;
  title: string;
  scenarioIntroduction: string;
  questions: Question[];
}

export interface CoachingFeedback {
  thinkingInsight: string;
  lifeApplication: string;
  businessApplication: string;
  coachRecommendation: string;
  levelProgressSummary: string;
  updatedProfile?: CognitiveProfile;
}

export interface UserResponse {
  questionId: string;
  answer: string;
}
