import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useGame } from "@/lib/game-context";

const DAN_COLORS = [
  "#FF6B35", "#FF8E53", "#FFA07A",
  "#4ECDC4", "#45B7D1", "#3498DB",
  "#A29BFE", "#FD79A8", "#FDCB6E",
];

function StarRow({ stars }: { stars: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3].map((i) => (
        <Text key={i} style={{ fontSize: 14, opacity: i <= stars ? 1 : 0.2 }}>⭐</Text>
      ))}
    </View>
  );
}

export default function RecordsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useGame();

  const clearedDans = state.records.filter((r) => r.bestStars >= 1).length;
  const perfectDans = state.records.filter((r) => r.bestStars >= 3).length;
  const totalPlayed = state.totalPlayed;
  const totalCorrect = state.totalCorrect;
  const accuracy = totalPlayed > 0 ? Math.round((totalCorrect / totalPlayed) * 100) : 0;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>きろく</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            これまでのせいせき
          </Text>
        </View>

        {/* Overall Stats */}
        <View style={[styles.overallCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.overallTitle, { color: colors.foreground }]}>📊 そうごうせいせき</Text>
          <View style={styles.overallGrid}>
            <View style={styles.overallItem}>
              <Text style={[styles.overallValue, { color: colors.primary }]}>{clearedDans}/9</Text>
              <Text style={[styles.overallLabel, { color: colors.muted }]}>クリアした段</Text>
            </View>
            <View style={styles.overallItem}>
              <Text style={[styles.overallValue, { color: "#FFE66D" }]}>{perfectDans}</Text>
              <Text style={[styles.overallLabel, { color: colors.muted }]}>⭐⭐⭐だん</Text>
            </View>
            <View style={styles.overallItem}>
              <Text style={[styles.overallValue, { color: colors.success }]}>{accuracy}%</Text>
              <Text style={[styles.overallLabel, { color: colors.muted }]}>せいかいりつ</Text>
            </View>
            <View style={styles.overallItem}>
              <Text style={[styles.overallValue, { color: colors.warning }]}>{totalCorrect}</Text>
              <Text style={[styles.overallLabel, { color: colors.muted }]}>せいかいすう</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <Text style={[styles.progressLabel, { color: colors.muted }]}>
              クリア進捗: {clearedDans}/9だん
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${(clearedDans / 9) * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Challenge Best */}
        {state.challengeBestScore > 0 && (
          <View style={[styles.challengeCard, { backgroundColor: "#4ECDC4" + "20", borderColor: "#4ECDC4" }]}>
            <Text style={styles.challengeEmoji}>🏆</Text>
            <View>
              <Text style={[styles.challengeTitle, { color: colors.foreground }]}>チャレンジ ベストスコア</Text>
              <Text style={[styles.challengeScore, { color: "#4ECDC4" }]}>
                {state.challengeBestScore} てん
              </Text>
            </View>
          </View>
        )}

        {/* Dan Records */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>だんべつのきろく</Text>
        {state.records.map((record, idx) => (
          <Pressable
            key={record.dan}
            onPress={() => router.push({ pathname: "/game" as any, params: { dan: String(record.dan), mode: "practice" } })}
            style={({ pressed }) => [
              styles.danRecord,
              {
                backgroundColor: colors.surface,
                borderColor: record.bestStars > 0 ? DAN_COLORS[idx] : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.danBadge, { backgroundColor: DAN_COLORS[idx] }]}>
              <Text style={styles.danBadgeText}>{record.dan}</Text>
            </View>
            <View style={styles.danInfo}>
              <Text style={[styles.danName, { color: colors.foreground }]}>
                {record.dan} のだん
              </Text>
              <StarRow stars={record.bestStars} />
            </View>
            <View style={styles.danStats}>
              {record.playCount > 0 ? (
                <>
                  <Text style={[styles.danBestScore, { color: DAN_COLORS[idx] }]}>
                    {record.bestScore}てん
                  </Text>
                  <Text style={[styles.danPlayCount, { color: colors.muted }]}>
                    {record.playCount}かい
                  </Text>
                </>
              ) : (
                <Text style={[styles.notPlayed, { color: colors.muted }]}>みプレイ</Text>
              )}
            </View>
          </Pressable>
        ))}

        {/* Motivational message */}
        <View style={[styles.motivationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.motivationEmoji}>🐼</Text>
          <Text style={[styles.motivationText, { color: colors.foreground }]}>
            {clearedDans === 0
              ? "さあ、れんしゅうをはじめよう！"
              : clearedDans < 3
              ? "いいちょうし！つづけよう！"
              : clearedDans < 6
              ? "はんぶんいじょうクリア！すごい！"
              : clearedDans < 9
              ? "もうすぐ九九マスター！"
              : "九九マスター！かんぺき！🎉"}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  overallCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 16,
  },
  overallTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  overallGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  overallItem: {
    width: "45%",
    alignItems: "center",
  },
  overallValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  overallLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  progressSection: {
    gap: 6,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  challengeEmoji: {
    fontSize: 36,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  challengeScore: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  danRecord: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  danBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  danBadgeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  danInfo: {
    flex: 1,
    gap: 4,
  },
  danName: {
    fontSize: 16,
    fontWeight: "600",
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
  },
  danStats: {
    alignItems: "flex-end",
  },
  danBestScore: {
    fontSize: 16,
    fontWeight: "700",
  },
  danPlayCount: {
    fontSize: 11,
    marginTop: 2,
  },
  notPlayed: {
    fontSize: 13,
  },
  motivationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  motivationEmoji: {
    fontSize: 36,
  },
  motivationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
});
