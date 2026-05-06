import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  filterFrenchDepartments,
  getFrenchDepartmentLabel,
  type FrenchDepartment,
} from "../constants/frenchDepartments";

const ACCENT = "#FF8C00";

export type DepartmentPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (departmentCode: string) => void;
  initialDepartmentCode?: string | null;
};

export function DepartmentPickerSheet({
  visible,
  onClose,
  onConfirm,
  initialDepartmentCode,
}: DepartmentPickerSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");

  const results = useMemo(
    () => filterFrenchDepartments(query),
    [query],
  );

  useEffect(() => {
    if (!visible) return;
    setQuery("");
  }, [visible]);

  const handleSelect = useCallback(
    (dep: FrenchDepartment) => {
      onConfirm(dep.code);
      onClose();
    },
    [onClose, onConfirm],
  );

  const initialLabel = useMemo(
    () => getFrenchDepartmentLabel(initialDepartmentCode ?? undefined),
    [initialDepartmentCode],
  );

  const renderItem = useCallback(
    ({ item }: { item: FrenchDepartment }) => (
      <Pressable
        onPress={() => handleSelect(item)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={getFrenchDepartmentLabel(item.code)}
      >
        <Text style={styles.rowCode}>{item.code}</Text>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color="#94A3B8"
        />
      </Pressable>
    ),
    [handleSelect],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          style={[styles.backdrop, StyleSheet.absoluteFillObject]}
          onPress={onClose}
        />

        <View pointerEvents="box-none" style={styles.foreground}>
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {t("profile.departmentPicker.title")}
                </Text>
                {initialLabel ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {t("profile.departmentPicker.current", { value: initialLabel })}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
              >
                <MaterialIcons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <MaterialIcons name="search" size={18} color="#64748B" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("profile.departmentPicker.searchPlaceholder")}
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={t("profile.departmentPicker.searchA11y")}
              />
              {query ? (
                <Pressable
                  onPress={() => setQuery("")}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.clear")}
                >
                  <MaterialIcons name="close" size={18} color="#64748B" />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={results}
              keyExtractor={(item) => item.code}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {t("profile.departmentPicker.empty")}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  foreground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: "82%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
  },
  list: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  listContent: {
    paddingVertical: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  rowPressed: {
    backgroundColor: "#FFF7ED",
  },
  rowCode: {
    width: 36,
    fontSize: 14,
    fontWeight: "800",
    color: ACCENT,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
  },
  empty: {
    paddingVertical: 24,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
  },
});
