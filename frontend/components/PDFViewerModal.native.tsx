import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import WebView from "react-native-webview";
import { colors, fonts, spacing } from "../constants/theme";

interface Props {
  visible: boolean;
  title: string;
  asset: number;
  webPath: string;
  onClose: () => void;
}

export function PDFViewerModal({ visible, title, asset, onClose }: Props) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setUri(null);
    Asset.fromModule(asset)
      .downloadAsync()
      .then((a) => setUri(a.localUri ?? a.uri));
  }, [visible, asset]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {uri ? (
          <WebView
            source={{ uri }}
            style={styles.webview}
            originWhitelist={["*"]}
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
          />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.softPink} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.body700, fontSize: 16, color: colors.text, flex: 1, marginRight: spacing.md },
  webview: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
