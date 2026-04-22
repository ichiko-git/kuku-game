import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export type GameMode = "practice" | "challenge";

export interface QuestionRecord {
  question: string;
  a: number;
  b: number;
  correct: number;
  userAnswer: number;
  isCorrect: boolean;
}

export interface DanRecord {
  dan: number;
  bestScore: number;
  bestStars: number;
  playCount: number;
  lastPlayed: string | null;
}

export interface GameState {
  records: DanRecord[];
  challengeBestScore: number;
  totalCorrect: number;
  totalPlayed: number;
}

type GameAction =
  | { type: "SAVE_RESULT"; dan: number; score: number; stars: number; correct: number; total: number }
  | { type: "SAVE_CHALLENGE"; score: number; correct: number; total: number }
  | { type: "LOAD_STATE"; state: GameState };

const initialDanRecords: DanRecord[] = Array.from({ length: 9 }, (_, i) => ({
  dan: i + 1,
  bestScore: 0,
  bestStars: 0,
  playCount: 0,
  lastPlayed: null,
}));

const initialState: GameState = {
  records: initialDanRecords,
  challengeBestScore: 0,
  totalCorrect: 0,
  totalPlayed: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD_STATE":
      return action.state;
    case "SAVE_RESULT": {
      const newRecords = state.records.map((r) => {
        if (r.dan === action.dan) {
          return {
            ...r,
            bestScore: Math.max(r.bestScore, action.score),
            bestStars: Math.max(r.bestStars, action.stars),
            playCount: r.playCount + 1,
            lastPlayed: new Date().toISOString(),
          };
        }
        return r;
      });
      return {
        ...state,
        records: newRecords,
        totalCorrect: state.totalCorrect + action.correct,
        totalPlayed: state.totalPlayed + action.total,
      };
    }
    case "SAVE_CHALLENGE": {
      return {
        ...state,
        challengeBestScore: Math.max(state.challengeBestScore, action.score),
        totalCorrect: state.totalCorrect + action.correct,
        totalPlayed: state.totalPlayed + action.total,
      };
    }
    default:
      return state;
  }
}

const STORAGE_KEY = "kuku_game_state";

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as GameState;
          // Merge to ensure all 9 dans exist
          const mergedRecords = initialDanRecords.map((init) => {
            const saved = parsed.records?.find((r) => r.dan === init.dan);
            return saved ? { ...init, ...saved } : init;
          });
          dispatch({
            type: "LOAD_STATE",
            state: { ...initialState, ...parsed, records: mergedRecords },
          });
        } catch {
          // ignore parse errors
        }
      }
    });
  }, []);

  // Persist on state change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

// Helper: generate questions for a dan
export function generateQuestions(dan: number, count: number = 10): { a: number; b: number; answer: number }[] {
  if (dan === 0) {
    // All dans mixed
    const questions: { a: number; b: number; answer: number }[] = [];
    for (let i = 0; i < count; i++) {
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      questions.push({ a, b, answer: a * b });
    }
    return questions;
  }
  // Specific dan: shuffle 1-9
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const shuffled = nums.sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((b) => ({ a: dan, b, answer: dan * b }));
}

// Helper: calculate stars from score
export function calcStars(correct: number, total: number): number {
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

// Helper: calculate score
export function calcScore(correct: number, total: number, timeBonus: number = 0): number {
  return correct * 100 + timeBonus;
}
