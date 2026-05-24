import { useState, useLayoutEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { useNavigation } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react-native";
import { COLORS } from "@/lib/theme/colors";
import { api } from "@/lib/api/client";
import Toast from "react-native-toast-message";

export default function MessagePastorScreen() {
  const navigation = useNavigation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Message Pastor" });
  }, [navigation]);

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: () => api.contact.pastor(subject.trim(), message.trim()),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Message sent", text2: "The pastoral team will be in touch." });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Could not send message", text2: "Please try again." });
    },
  });

  const canSubmit = subject.trim().length >= 3 && message.trim().length >= 10 && !isPending && !isSuccess;

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>✉️</Text>
        <Text style={styles.successTitle}>Message Sent</Text>
        <Text style={styles.successBody}>
          Your message has been delivered to the pastoral team. They will get back to you.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          Have a question, prayer request, or need to speak with pastoral care? Send a message below and we'll respond as soon as possible.
        </Text>

        {/* Subject */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Prayer request, Counselling, Question…"
            placeholderTextColor={COLORS.ink.muted}
            value={subject}
            onChangeText={setSubject}
            maxLength={150}
            returnKeyType="next"
          />
        </View>

        {/* Message */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Write your message here…"
            placeholderTextColor={COLORS.ink.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{message.length}/2000</Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Your message is confidential and will only be seen by the pastoral team. Please allow up to 3 business days for a response.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, !canSubmit && styles.sendBtnDisabled]}
          onPress={() => mutate()}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          <Send size={18} color={canSubmit ? COLORS.bg.page : COLORS.ink.muted} />
          <Text style={[styles.sendBtnText, !canSubmit && styles.sendBtnTextDisabled]}>
            {isPending ? "Sending…" : "Send Message"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.page },
  content: { padding: 20, paddingBottom: 60 },
  intro: {
    fontSize: 14,
    color: COLORS.ink.secondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  fieldGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.ink.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bg.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.ink.primary,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  textarea: { minHeight: 160, paddingTop: 12 },
  charCount: {
    fontSize: 11,
    color: COLORS.ink.muted,
    textAlign: "right",
    marginTop: 4,
  },
  disclaimer: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  disclaimerText: { fontSize: 12, color: COLORS.ink.secondary, lineHeight: 18 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.brand.primary,
    borderRadius: 12,
    paddingVertical: 15,
  },
  sendBtnDisabled: { backgroundColor: COLORS.bg.card, borderWidth: 1, borderColor: COLORS.border.subtle },
  sendBtnText: { fontSize: 16, fontWeight: "700", color: COLORS.bg.page },
  sendBtnTextDisabled: { color: COLORS.ink.muted },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: COLORS.bg.page,
    gap: 16,
  },
  successEmoji: { fontSize: 56 },
  successTitle: { fontSize: 22, fontWeight: "800", color: COLORS.ink.primary },
  successBody: { fontSize: 15, color: COLORS.ink.secondary, textAlign: "center", lineHeight: 24 },
});
