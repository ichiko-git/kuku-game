import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import type { QuestionRecord } from "@/lib/game-context";

function StarDisplay({ stars, total = 3 }: { stars: number; total?: number }) {
  return (
    <View style={styles.starDisplay}>
      {Array.from({ length: total }).map((_, i) => {
        const delay = i * 120;
        const opacity = useSharedValue(0);

        useEffect(() => {
          opacity.value = withDelay(delay, withTiming(1, { duration: 250 }));
        }, []);

        const animStyle = useAnimatedStyle(() => ({
          opacity: opacity.value,
          // 揺れなし：星は静止表示、獲得していない星は薄く
        }));

        return (
          <Animated.Text key={i} style={[styles.starEmoji, animStyle, { opacity: i < stars ? 1 : 0.25 }]}>
            ⭐
          </Animated.Text>
        );
      })}
    </View>
  );
}

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score: string;
    correct: string;
    total: string;
    stars: string;
    dan: string;
    mode: string;
    records: string;
  }>();

  const colors = useColors();

  const score = parseInt(params.score ?? "0", 10);
  const correct = parseInt(params.correct ?? "0", 10);
  const total = parseInt(params.total ?? "10", 10);
  const stars = parseInt(params.stars ?? "0", 10);
  const dan = parseInt(params.dan ?? "0", 10);
  const mode = params.mode ?? "practice";

  let records: QuestionRecord[] = [];
  try {
    records = JSON.parse(params.records ?? "[]");
  } catch {
    records = [];
  }

  const wrongRecords = records.filter((r) => !r.isCorrect);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // 揺れなし：シンプルなフェードイン
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 350 });

    if (Platform.OS !== "web") {
      if (stars >= 3) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (stars >= 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const getMessage = () => {
    if (stars === 3) return "かんぺき！すごい！🎉";
    if (stars === 2) return "よくできました！👏";
    if (stars === 1) return "もうすこし！がんばれ！💪";
    return "れんしゅうしよう！📚";
  };

  const getScoreColor = () => {
    if (stars === 3) return colors.success;
    if (stars === 2) return colors.primary;
    if (stars === 1) return colors.warning;
    return colors.error;
  };

  const handleRetry = () => {
    router.replace({
      pathname: "/game" as any,
      params: { dan: String(dan), mode },
    });
  };

  const handleBack = () => {
    if (mode === "challenge" || dan === 0) {
      router.replace("/" as any);
    } else {
      router.replace("/select-dan" as any);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={cardAnimStyle}>
          {/* Result Card */}
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.resultEmoji}>
              {stars === 3 ? "🏆" : stars === 2 ? "🎖️" : stars === 1 ? "🥉" : "📚"}
            </Text>
            <Text style={[styles.message, { color: colors.foreground }]}>{getMessage()}</Text>

            <StarDisplay stars={stars} />

            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: getScoreColor() }]}>{score}</Text>
              <Text style={[styles.scoreLabel, { color: colors.muted }]}>てん</Text>
            </View>

            <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>{correct}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>せいかい</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.error }]}>{total - correct}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>まちがい</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{accuracy}%</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>せいかいりつ</Text>
              </View>
            </View>
          </View>

          {/* Wrong Answers Review */}
          {wrongRecords.length > 0 && (
            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewTitle, { color: colors.foreground }]}>
                ❌ まちがえた もんだい
              </Text>
              {wrongRecords.map((r, idx) => (
                <View key={idx} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.reviewQuestion, { color: colors.foreground }]}>
                    {r.question} = ?
                  </Text>
                  <View style={styles.reviewAnswers}>
                    <Text style={[styles.reviewWrong, { color: colors.error }]}>
                      {r.userAnswer}
                    </Text>
                    <Text style={[styles.reviewArrow, { color: colors.muted }]}>→</Text>
                    <Text style={[styles.reviewCorrect, { color: colors.success }]}>
                      {r.correct}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                {mode === "challenge" || dan === 0 ? "ホームへ" : "だんをえらぶ"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.primaryButtonText}>もういちど</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  resultCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  message: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  starDisplay: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  starEmoji: {
    fontSize: 40,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: "800",
    lineHeight: 64,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    alignSelf: "center",
  },
  reviewCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  reviewQuestion: {
    fontSize: 18,
    fontWeight: "600",
  },
  reviewAnswers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewWrong: {
    fontSize: 18,
    fontWeight: "700",
    textDecorationLine: "line-through",
  },
  reviewArrow: {
    fontSize: 14,
  },
  reviewCorrect: {
    fontSize: 20,
    fontWeight: "800",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
