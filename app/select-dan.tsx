import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useGame } from "@/lib/game-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

const DAN_COLORS = [
  "#FF6B35", "#FF8E53", "#FFA07A",
  "#4ECDC4", "#45B7D1", "#3498DB",
  "#A29BFE", "#FD79A8", "#FDCB6E",
];

function StarRating({ stars }: { stars: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3].map((i) => (
        <Text key={i} style={[styles.starIcon, { opacity: i <= stars ? 1 : 0.25 }]}>
          ⭐
        </Text>
      ))}
    </View>
  );
}

function DanCard({
  dan,
  color,
  bestStars,
  playCount,
  onPress,
}: {
  dan: number;
  color: string;
  bestStars: number;
  playCount: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withTiming(0.93, { duration: 80 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Animated.View style={[animStyle, styles.danCardWrapper]}>
      <Pressable onPress={handlePress} style={[styles.danCard, { backgroundColor: color }]}>
        <Text style={styles.danNumber}>{dan}</Text>
        <Text style={styles.danLabel}>のだん</Text>
        <StarRating stars={bestStars} />
        {playCount > 0 && (
          <Text style={styles.playCount}>{playCount}かい</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function SelectDanScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state } = useGame();

  const handleSelectDan = (dan: number) => {
    router.push({ pathname: "/game" as any, params: { dan: String(dan), mode: "practice" } });
  };

  const handleAllDan = () => {
    router.push({ pathname: "/game" as any, params: { dan: "0", mode: "practice" } });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>だんをえらぼう</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* All Dans button */}
        <Pressable
          onPress={handleAllDan}
          style={[styles.allDanButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.allDanEmoji}>🎲</Text>
          <View>
            <Text style={styles.allDanTitle}>ぜんぶまぜまぜ</Text>
            <Text style={styles.allDanSub}>1〜9だん ランダム</Text>
          </View>
        </Pressable>

        {/* Dan Grid */}
        <View style={styles.danGrid}>
          {state.records.map((record, idx) => (
            <DanCard
              key={record.dan}
              dan={record.dan}
              color={DAN_COLORS[idx]}
              bestStars={record.bestStars}
              playCount={record.playCount}
              onPress={() => handleSelectDan(record.dan)}
            />
          ))}
        </View>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  allDanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  allDanEmoji: {
    fontSize: 36,
  },
  allDanTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  allDanSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  danGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  danCardWrapper: {
    width: "30%",
  },
  danCard: {
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    minHeight: 100,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  danNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 42,
  },
  danLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 4,
  },
  starRow: {
    flexDirection: "row",
    gap: 1,
  },
  starIcon: {
    fontSize: 12,
  },
  playCount: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
});
