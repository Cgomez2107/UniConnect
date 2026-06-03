import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import type { PollData } from "@/types";

interface PollMessageItemProps {
  poll: PollData;
  currentUserId?: string;
  senderId: string;
  onVote: (optionIndex: number) => void;
}

function getTotalVotes(options: PollData["options"]): number {
  return options.reduce((sum, o) => sum + o.votes.length, 0);
}

function getPercentage(options: PollData["options"], index: number): number {
  const total = getTotalVotes(options);
  if (total === 0) return 0;
  return Math.round((options[index].votes.length / total) * 100);
}

export function PollMessageItem({
  poll,
  currentUserId,
  senderId,
  onVote,
}: PollMessageItemProps) {
  const hasVoted = useMemo(
    () => currentUserId && poll.options.some((o) => o.votes.includes(currentUserId)),
    [poll.options, currentUserId],
  );

  const isCreator = currentUserId === senderId;
  const isClosed = !poll.is_open;
  const showResults = isClosed || hasVoted || isCreator;
  const total = getTotalVotes(poll.options);
  const scheme = "light";
  const C = Colors[scheme];

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{poll.question}</Text>

      <View style={styles.optionsContainer}>
        {poll.options.map((option, index) => {
          const pct = getPercentage(poll.options, index);
          const voted = currentUserId && option.votes.includes(currentUserId);

          if (showResults) {
            return (
              <View
                key={index}
                style={[
                  styles.resultBar,
                  voted && styles.resultBarVoted,
                ]}
              >
                <View
                  style={[
                    styles.resultFill,
                    { width: `${pct}%` },
                  ]}
                />
                <View style={styles.resultContent}>
                  <Text
                    style={[
                      styles.resultText,
                      voted && styles.resultTextVoted,
                    ]}
                    numberOfLines={1}
                  >
                    {option.text}
                  </Text>
                  <Text
                    style={[
                      styles.resultCount,
                      voted && styles.resultTextVoted,
                    ]}
                  >
                    {option.votes.length} ({pct}%)
                  </Text>
                </View>
              </View>
            );
          }

          return (
            <Pressable
              key={index}
              onPress={() => onVote(index)}
              disabled={isClosed}
              style={({ pressed }) => [
                styles.voteButton,
                pressed && styles.voteButtonPressed,
              ]}
            >
              <Text style={styles.voteButtonText}>{option.text}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {total} voto{total !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.footerText}>
          {isClosed
            ? "Cerrada"
            : `Cierra ${poll.closes_at ? new Date(poll.closes_at).toLocaleDateString("es-CO") : "—"}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fafafa",
    marginTop: 8,
  },
  question: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  optionsContainer: {
    gap: 8,
  },
  voteButton: {
    borderWidth: 1.5,
    borderColor: "#0047AB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  voteButtonPressed: {
    backgroundColor: "#f0f5ff",
  },
  voteButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0047AB",
    textAlign: "center",
  },
  resultBar: {
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
    overflow: "hidden",
    position: "relative",
    minHeight: 36,
    justifyContent: "center",
  },
  resultBarVoted: {
    backgroundColor: "#dbeafe",
  },
  resultFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 71, 171, 0.1)",
    borderRadius: 8,
  },
  resultContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resultText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#404040",
    flex: 1,
    marginRight: 8,
  },
  resultTextVoted: {
    color: "#0047AB",
  },
  resultCount: {
    fontSize: 11,
    fontWeight: "500",
    color: "#737373",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  footerText: {
    fontSize: 10,
    color: "#a3a3a3",
  },
});

export default PollMessageItem;
