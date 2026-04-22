import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useGame } from "@/lib/game-context";

function MenuButton({
  label,
  emoji,
  color,
  onPress,
}: {
  label: string;
  emoji: string;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withTiming(0.95, { duration: 80 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Animated.View style={[animStyle, { flex: 1 }]}>
      <Pressable
        onPress={handlePress}
        style={[styles.menuButton, { backgroundColor: color }]}
      >
        <Text style={styles.menuEmoji}>{emoji}</Text>
        <Text style={styles.menuLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state } = useGame();

  const clearedDans = state.records.filter((r) => r.bestStars >= 1).length;
  const totalCorrect = state.totalCorrect;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titleEmoji}>⭐</Text>
          <Text style={[styles.title, { color: colors.primary }]}>九九マスター</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            たのしく九九をおぼえよう！
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{clearedDans}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>クリアした段</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{totalCorrect}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>せいかいすう</Text>
          </View>
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuGrid}>
          <View style={styles.menuRow}>
            <MenuButton
              label="れんしゅう"
              emoji="📚"
              color="#FF6B35"
              onPress={() => router.push("/select-dan" as any)}
            />
            <MenuButton
              label="チャレンジ"
              emoji="🏆"
              color="#4ECDC4"
              onPress={() => router.push({ pathname: "/game" as any, params: { dan: "0", mode: "challenge" } })}
            />
          </View>
          <View style={styles.menuRow}>
            <MenuButton
              label="九九表"
              emoji="📋"
              color="#A29BFE"
              onPress={() => router.push("/table" as any)}
            />
            <MenuButton
              label="きろく"
              emoji="⭐"
              color="#FD79A8"
              onPress={() => router.push("/records" as any)}
            />
          </View>
        </View>

        {/* Mascot */}
        <View style={styles.mascotArea}>
          <Text style={styles.mascotEmoji}>🐼</Text>
          <View style={[styles.speechBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.speechText, { color: colors.foreground }]}>
              {clearedDans === 0
                ? "いっしょに九九をおぼえよう！"
                : clearedDans < 5
                ? `${clearedDans}だんクリア！すごいね！`
                : clearedDans < 9
                ? "もうすぐ九九マスターだ！"
                : "九九マスターおめでとう！🎉"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
  },
  titleEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  menuGrid: {
    gap: 12,
    marginBottom: 24,
  },
  menuRow: {
    flexDirection: "row",
    gap: 12,
  },
  menuButton: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  menuEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  mascotArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingBottom: 8,
  },
  mascotEmoji: {
    fontSize: 56,
  },
  speechBubble: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  speechText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
