import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useGame, generateQuestions, calcStars, calcScore, QuestionRecord } from "@/lib/game-context";

const TOTAL_QUESTIONS = 10;
const CHALLENGE_QUESTIONS = 20;
const CHALLENGE_TIME = 60; // seconds

type Question = { a: number; b: number; answer: number };

// 効果音プレイヤーフック
function useSoundEffects() {
  const tapPlayer = useAudioPlayer(require("@/assets/sounds/tap.mp3"));
  const correctPlayer = useAudioPlayer(require("@/assets/sounds/correct.mp3"));
  const wrongPlayer = useAudioPlayer(require("@/assets/sounds/wrong.mp3"));

  useEffect(() => {
    if (Platform.OS !== "web") {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
  }, []);

  const playTap = useCallback(() => {
    try { tapPlayer.seekTo(0); tapPlayer.play(); } catch {}
  }, [tapPlayer]);

  const playCorrect = useCallback(() => {
    try { correctPlayer.seekTo(0); correctPlayer.play(); } catch {}
  }, [correctPlayer]);

  const playWrong = useCallback(() => {
    try { wrongPlayer.seekTo(0); wrongPlayer.play(); } catch {}
  }, [wrongPlayer]);

  return { playTap, playCorrect, playWrong };
}

function NumberButton({ num, onPress, disabled }: { num: number; onPress: () => void; disabled: boolean }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.88, { duration: 70 }),
      withSpring(1, { damping: 10 })
    );
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Animated.View style={[animStyle, styles.numBtnWrapper]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.numButton,
          { opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.numButtonText}>{num}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dan: string; mode: string }>();
  const dan = parseInt(params.dan ?? "1", 10);
  const mode = params.mode ?? "practice";
  const isChallenge = mode === "challenge";

  const colors = useColors();
  const { dispatch } = useGame();
  const { playTap, playCorrect, playWrong } = useSoundEffects();

  const totalQ = isChallenge ? CHALLENGE_QUESTIONS : TOTAL_QUESTIONS;
  const [questions] = useState<Question[]>(() => generateQuestions(dan, totalQ));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputDigits, setInputDigits] = useState<number[]>([]);
  // feedback: 表示中かどうか（null=非表示）
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  // feedbackType: 最後に表示したフィードバックの種別（フェードアウト中も保持）
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong">("correct");
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_TIME);

  // stale closure 対策：最新の値をrefで保持
  const recordsRef = useRef<QuestionRecord[]>([]);
  const currentIdxRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const timeLeftRef = useRef(CHALLENGE_TIME);
  // Web対応：isSubmittingをstateでも管理してUIに反映
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const feedbackOpacity = useSharedValue(0);
  const feedbackScale = useSharedValue(0.5);
  const progressWidth = useSharedValue(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer for challenge mode
  useEffect(() => {
    if (!isChallenge) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        timeLeftRef.current = next;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          navigateToResult();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [isChallenge]);

  // Update progress bar
  useEffect(() => {
    progressWidth.value = withTiming((currentIdx / totalQ) * 100, { duration: 300 });
  }, [currentIdx]);

  // refとstateを同期
  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  // 結果画面へ遷移（最新のrefを使うため stale closure なし）
  const navigateToResult = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    clearInterval(timerRef.current!);

    const latestRecords = recordsRef.current;
    const correct = latestRecords.filter((r) => r.isCorrect).length;
    const stars = calcStars(correct, latestRecords.length || 1);
    const timeBonus = isChallenge ? timeLeftRef.current * 5 : 0;
    const score = calcScore(correct, latestRecords.length || 1, timeBonus);

    if (dan === 0 || isChallenge) {
      dispatch({ type: "SAVE_CHALLENGE", score, correct, total: latestRecords.length });
    } else {
      dispatch({ type: "SAVE_RESULT", dan, score, stars, correct, total: latestRecords.length });
    }

    router.replace({
      pathname: "/result" as any,
      params: {
        score: String(score),
        correct: String(correct),
        total: String(latestRecords.length),
        stars: String(stars),
        dan: String(dan),
        mode,
        records: JSON.stringify(latestRecords),
      },
    });
  }, [dan, mode, isChallenge, dispatch, router]);

  const currentQuestion = questions[currentIdxRef.current] ?? questions[currentIdx];
  const inputValue = inputDigits.length === 0 ? "" : inputDigits.join("");

  const handleNumberPress = (num: number) => {
    if (isSubmittingRef.current || isSubmitting) return;
    playTap();

    const newDigits = [...inputDigits, num];
    setInputDigits(newDigits);

    const currentAnswer = parseInt(newDigits.join(""), 10);
    const q = questions[currentIdxRef.current];
    if (!q) return;

    const correctDigitCount = String(q.answer).length;
    if (newDigits.length >= correctDigitCount) {
      submitAnswer(currentAnswer, q);
    }
  };

  const handleDelete = () => {
    if (isSubmittingRef.current || isSubmitting) return;
    playTap();
    setInputDigits((prev) => prev.slice(0, -1));
  };

  const submitAnswer = (answer: number, q: Question) => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const isCorrect = answer === q.answer;

    // feedbackTypeを先に確定
    const feedbackKind: "correct" | "wrong" = isCorrect ? "correct" : "wrong";
    setFeedbackType(feedbackKind);

    // フィードバックアニメーション
    feedbackOpacity.value = withTiming(1, { duration: 150 });
    feedbackScale.value = withSpring(1, { damping: 8 });
    setFeedback(feedbackKind);

    // 効果音とハプティクス
    if (isCorrect) {
      playCorrect();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      playWrong();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    const record: QuestionRecord = {
      question: `${q.a} × ${q.b}`,
      a: q.a,
      b: q.b,
      correct: q.answer,
      userAnswer: answer,
      isCorrect,
    };

    // refに即時追加（stale closure対策）
    recordsRef.current = [...recordsRef.current, record];

    // Move to next after delay
    setTimeout(() => {
      feedbackOpacity.value = withTiming(0, { duration: 200 });
      feedbackScale.value = withTiming(0.5, { duration: 200 });
      setFeedback(null);
      setInputDigits([]);
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      const nextIdx = currentIdxRef.current + 1;
      if (nextIdx >= totalQ) {
        // 全問完了 → 結果画面へ
        navigateToResult();
      } else {
        currentIdxRef.current = nextIdx;
        setCurrentIdx(nextIdx);
      }
    }, 900);
  };

  const feedbackAnimStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ scale: feedbackScale.value }],
  }));

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!currentQuestion) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, backgroundColor: '#FFF9F0' }} />
      </ScreenContainer>
    );
  }

  const timerColor = timeLeft <= 10 ? colors.error : timeLeft <= 20 ? colors.warning : colors.success;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.muted }]}>やめる</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.questionCount, { color: colors.muted }]}>
            {currentIdx + 1} / {totalQ}
          </Text>
        </View>
        {isChallenge ? (
          <View style={[styles.timerBadge, { backgroundColor: timerColor + "20", borderColor: timerColor }]}>
            <Text style={[styles.timerText, { color: timerColor }]}>⏱ {timeLeft}s</Text>
          </View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[styles.progressFill, { backgroundColor: colors.primary }, progressAnimStyle]}
        />
      </View>

      {/* Question Area */}
      <View style={styles.questionArea}>
        <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            {currentQuestion.a} × {currentQuestion.b} = ?
          </Text>
          <View style={[styles.answerBox, { borderColor: inputDigits.length > 0 ? colors.primary : colors.border }]}>
            <Text style={[styles.answerText, { color: inputDigits.length > 0 ? colors.foreground : colors.muted }]}>
              {inputValue || "　"}
            </Text>
          </View>
        </View>

        {/* Feedback overlay */}
        <Animated.View style={[styles.feedbackOverlay, feedbackAnimStyle]}>
          <Text style={styles.feedbackEmoji}>
            {feedbackType === "correct" ? "⭕" : "❌"}
          </Text>
          {feedbackType === "wrong" && (
            <Text style={[styles.correctAnswerText, { color: colors.foreground }]}>
              こたえ: {currentQuestion.answer}
            </Text>
          )}
        </Animated.View>
      </View>

      {/* Number Pad */}
      <View style={styles.numPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <NumberButton
            key={num}
            num={num}
            onPress={() => handleNumberPress(num)}
            disabled={isSubmitting}
          />
        ))}
        <View style={styles.numBtnWrapper}>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.numButton, styles.deleteButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.deleteButtonText}>⌫</Text>
          </Pressable>
        </View>
        <NumberButton
          num={0}
          onPress={() => handleNumberPress(0)}
          disabled={isSubmitting}
        />
        <Pressable
          onPress={() => {
            if (inputDigits.length > 0 && !isSubmittingRef.current && !isSubmitting) {
              const q = questions[currentIdxRef.current];
              if (q) {
                playTap();
                submitAnswer(parseInt(inputValue, 10), q);
              }
            }
          }}
          style={({ pressed }) => [
            styles.numBtnWrapper,
            styles.numButton,
            styles.enterButton,
            { opacity: inputDigits.length === 0 || isSubmitting ? 0.4 : pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.enterButtonText}>OK</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  questionCount: {
    fontSize: 16,
    fontWeight: "700",
  },
  timerBadge: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressBar: {
    height: 6,
    marginHorizontal: 16,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  questionArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 24,
  },
  questionCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 2,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  questionText: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 24,
  },
  answerBox: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
    minWidth: 100,
    alignItems: "center",
  },
  answerText: {
    fontSize: 36,
    fontWeight: "700",
  },
  feedbackOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackEmoji: {
    fontSize: 80,
  },
  correctAnswerText: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  numPad: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
    justifyContent: "center",
  },
  numBtnWrapper: {
    width: "28%",
  },
  numButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  numButtonText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2D3436",
  },
  deleteButton: {
    backgroundColor: "#FFE0E0",
  },
  deleteButtonText: {
    fontSize: 24,
    color: "#E74C3C",
  },
  enterButton: {
    backgroundColor: "#FF6B35",
  },
  enterButtonText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
