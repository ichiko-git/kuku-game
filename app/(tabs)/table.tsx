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
  const [selectedDan, setSelectedDan] = useState<number | null>(null);
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

  const revealAll = () => {
    if (selectedDan === null) return;
    const keys = new Set<string>();
    for (let b = 1; b <= 9; b++) {
      keys.add(`${selectedDan}-${b}`);
    }
    setRevealedAnswers(keys);
  };

  const hideAll = () => {
    setRevealedAnswers(new Set());
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

      {/* Dan Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.danSelector}
      >
        {Array.from({ length: 9 }, (_, i) => i + 1).map((dan) => (
          <Pressable
            key={dan}
            onPress={() => {
              setSelectedDan(selectedDan === dan ? null : dan);
              setRevealedAnswers(new Set());
            }}
            style={[
              styles.danTab,
              {
                backgroundColor: selectedDan === dan ? DAN_COLORS[dan - 1] : colors.surface,
                borderColor: selectedDan === dan ? DAN_COLORS[dan - 1] : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.danTabText,
                { color: selectedDan === dan ? "#FFFFFF" : colors.foreground },
              ]}
            >
              {dan}のだん
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedDan !== null ? (
          /* Single Dan Detail View */
          <View>
            <View style={styles.danDetailHeader}>
              <Text style={[styles.danDetailTitle, { color: DAN_COLORS[selectedDan - 1] }]}>
                {selectedDan} のだん
              </Text>
              <View style={styles.revealButtons}>
                <Pressable
                  onPress={revealAll}
                  style={[styles.revealBtn, { backgroundColor: colors.success + "20", borderColor: colors.success }]}
                >
                  <Text style={[styles.revealBtnText, { color: colors.success }]}>ぜんぶみる</Text>
                </Pressable>
                <Pressable
                  onPress={hideAll}
                  style={[styles.revealBtn, { backgroundColor: colors.muted + "20", borderColor: colors.border }]}
                >
                  <Text style={[styles.revealBtnText, { color: colors.muted }]}>かくす</Text>
                </Pressable>
              </View>
            </View>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((b) => {
              const key = `${selectedDan}-${b}`;
              const revealed = revealedAnswers.has(key);
              const answer = selectedDan * b;
              return (
                <Pressable
                  key={b}
                  onPress={() => toggleAnswer(key)}
                  style={[
                    styles.formulaRow,
                    {
                      backgroundColor: revealed ? DAN_COLORS[selectedDan - 1] + "15" : colors.surface,
                      borderColor: revealed ? DAN_COLORS[selectedDan - 1] : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.formulaText, { color: colors.foreground }]}>
                    {selectedDan} × {b} =
                  </Text>
                  <View style={[styles.answerBubble, { backgroundColor: revealed ? DAN_COLORS[selectedDan - 1] : colors.border + "40" }]}>
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
        ) : (
          /* Overview Grid */
          <View>
            <Text style={[styles.overviewHint, { color: colors.muted }]}>
              だんをえらんでかくにんしよう
            </Text>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((dan) => (
              <Pressable
                key={dan}
                onPress={() => setSelectedDan(dan)}
                style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.overviewDanBadge, { backgroundColor: DAN_COLORS[dan - 1] }]}>
                  <Text style={styles.overviewDanText}>{dan}</Text>
                </View>
                <View style={styles.overviewFormulas}>
                  {[1, 2, 3].map((b) => (
                    <Text key={b} style={[styles.overviewFormula, { color: colors.muted }]}>
                      {dan}×{b}={dan * b}
                    </Text>
                  ))}
                  <Text style={[styles.overviewMore, { color: colors.muted }]}>...</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
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
  danSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  danTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  danTabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  danDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  danDetailTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  revealButtons: {
    flexDirection: "row",
    gap: 8,
  },
  revealBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  revealBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  formulaRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 8,
  },
  formulaText: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  answerBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  answerBubbleText: {
    fontSize: 22,
    fontWeight: "800",
  },
  tapHint: {
    fontSize: 11,
    marginLeft: 8,
  },
  overviewHint: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  overviewCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 16,
  },
  overviewDanBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewDanText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  overviewFormulas: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    flexWrap: "wrap",
  },
  overviewFormula: {
    fontSize: 13,
    fontWeight: "600",
  },
  overviewMore: {
    fontSize: 13,
  },
});
