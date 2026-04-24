import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const DAN_COLORS = [
  "#FF6B35", "#FF8E53", "#FFA07A",
  "#4ECDC4", "#45B7D1", "#3498DB",
  "#A29BFE", "#FD79A8", "#FDCB6E",
];

export default function TableScreen() {
  const colors = useColors();
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

  const toggleAnswer = (key: string) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const revealAllForDan = (dan: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      for (let b = 1; b <= 9; b++) {
        next.add(`${dan}-${b}`);
      }
      return next;
    });
  };

  const hideAllForDan = (dan: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      for (let b = 1; b <= 9; b++) {
        next.delete(`${dan}-${b}`);
      }
      return next;
    });
  };

  const isDanAllRevealed = (dan: number) => {
    for (let b = 1; b <= 9; b++) {
      if (!revealedAnswers.has(`${dan}-${b}`)) return false;
    }
    return true;
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>九九表</Text>
        <Text style={[styles.headerSub, { color: colors.muted }]}>
          タップしてこたえをかくにん
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: 9 }, (_, i) => i + 1).map((dan) => {
          const allRevealed = isDanAllRevealed(dan);
          return (
            <View
              key={dan}
              style={[styles.danSection, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {/* Dan Header */}
              <View style={styles.danHeader}>
                <View style={[styles.danBadge, { backgroundColor: DAN_COLORS[dan - 1] }]}>
                  <Text style={styles.danBadgeText}>{dan}</Text>
                </View>
                <Text style={[styles.danTitle, { color: DAN_COLORS[dan - 1] }]}>
                  {dan} のだん
                </Text>
                <Pressable
                  onPress={() => allRevealed ? hideAllForDan(dan) : revealAllForDan(dan)}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: allRevealed ? colors.muted + "20" : DAN_COLORS[dan - 1] + "20",
                      borderColor: allRevealed ? colors.border : DAN_COLORS[dan - 1],
                    },
                  ]}
                >
                  <Text style={[styles.toggleBtnText, { color: allRevealed ? colors.muted : DAN_COLORS[dan - 1] }]}>
                    {allRevealed ? "かくす" : "ぜんぶみる"}
                  </Text>
                </Pressable>
              </View>

              {/* Formula Rows */}
              {Array.from({ length: 9 }, (_, j) => j + 1).map((b) => {
                const key = `${dan}-${b}`;
                const revealed = revealedAnswers.has(key);
                const answer = dan * b;
                return (
                  <Pressable
                    key={b}
                    onPress={() => toggleAnswer(key)}
                    style={[
                      styles.formulaRow,
                      {
                        backgroundColor: revealed ? DAN_COLORS[dan - 1] + "15" : "transparent",
                        borderColor: revealed ? DAN_COLORS[dan - 1] : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.formulaText, { color: colors.foreground }]}>
                      {dan} × {b} =
                    </Text>
                    <View style={[styles.answerBubble, { backgroundColor: revealed ? DAN_COLORS[dan - 1] : colors.border + "40" }]}>
                      <Text style={[styles.answerBubbleText, { color: revealed ? "#FFFFFF" : "transparent" }]}>
                        {answer}
                      </Text>
                    </View>
                    {!revealed && (
                      <Text style={[styles.tapHint, { color: colors.muted }]}>タップ</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  danSection: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    overflow: "hidden",
  },
  danHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  danBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  danBadgeText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  danTitle: {
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  toggleBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  formulaRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
  },
  formulaText: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  answerBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  answerBubbleText: {
    fontSize: 20,
    fontWeight: "800",
  },
  tapHint: {
    fontSize: 11,
    marginLeft: 8,
  },
});
