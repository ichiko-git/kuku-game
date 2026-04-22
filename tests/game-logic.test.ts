import { describe, it, expect } from "vitest";
import { generateQuestions, calcStars, calcScore } from "../lib/game-context";

describe("generateQuestions", () => {
  it("指定した段の問題を生成する", () => {
    const questions = generateQuestions(3, 9);
    expect(questions).toHaveLength(9);
    questions.forEach((q) => {
      expect(q.a).toBe(3);
      expect(q.b).toBeGreaterThanOrEqual(1);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(q.answer).toBe(q.a * q.b);
    });
  });

  it("段0のとき全段ランダムで生成する", () => {
    const questions = generateQuestions(0, 20);
    expect(questions).toHaveLength(20);
    questions.forEach((q) => {
      expect(q.a).toBeGreaterThanOrEqual(1);
      expect(q.a).toBeLessThanOrEqual(9);
      expect(q.b).toBeGreaterThanOrEqual(1);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(q.answer).toBe(q.a * q.b);
    });
  });

  it("答えが正しく計算されている", () => {
    const questions = generateQuestions(7, 9);
    questions.forEach((q) => {
      expect(q.answer).toBe(7 * q.b);
    });
  });
});

describe("calcStars", () => {
  it("90%以上で3つ星", () => {
    expect(calcStars(9, 10)).toBe(3);
    expect(calcStars(10, 10)).toBe(3);
  });

  it("70%以上で2つ星", () => {
    expect(calcStars(7, 10)).toBe(2);
    expect(calcStars(8, 10)).toBe(2);
  });

  it("50%以上で1つ星", () => {
    expect(calcStars(5, 10)).toBe(1);
    expect(calcStars(6, 10)).toBe(1);
  });

  it("50%未満で0つ星", () => {
    expect(calcStars(4, 10)).toBe(0);
    expect(calcStars(0, 10)).toBe(0);
  });
});

describe("calcScore", () => {
  it("正解数×100のスコアを計算する", () => {
    expect(calcScore(8, 10)).toBe(800);
    expect(calcScore(10, 10)).toBe(1000);
  });

  it("タイムボーナスが加算される", () => {
    expect(calcScore(8, 10, 50)).toBe(850);
    expect(calcScore(10, 10, 100)).toBe(1100);
  });

  it("0点の場合", () => {
    expect(calcScore(0, 10)).toBe(0);
  });
});
