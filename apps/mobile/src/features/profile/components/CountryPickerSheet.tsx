import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/src/theme/colors";
import {
  getResidenceCountriesForPicker,
  getResidenceCountryLabel,
  type ResidenceCountryCode,
  type ResidenceCountryOption,
} from "../constants/residenceCountries";

export type CountryPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (countryCode: ResidenceCountryCode) => void;
  initialCountryCode?: string | null;
};

export function CountryPickerSheet({
  visible,
  onClose,
  onConfirm,
  initialCountryCode,
}: CountryPickerSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleSelect = useCallback(
    (option: ResidenceCountryOption) => {
      onConfirm(option.code);
      onClose();
    },
    [onClose, onConfirm],
  );

  const initialLabel = getResidenceCountryLabel(initialCountryCode, t);
  const pickerCountries = getResidenceCountriesForPicker(initialCountryCode);

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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
            style={styles.keyboardAvoidSheet}
          >
            <View
              style={[
                styles.sheet,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title}>
                    {t("profile.countryPicker.title")}
                  </Text>
                  {initialLabel ? (
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {t("profile.countryPicker.current", {
                        value: initialLabel,
                      })}
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

              <View style={styles.list}>
                {pickerCountries.map((item, index) => {
                  const isLast = index === pickerCountries.length - 1;
                  return (
                    <Pressable
                      key={item.code}
                      onPress={() => handleSelect(item)}
                      style={({ pressed }) => [
                        styles.row,
                        !isLast && styles.rowDivider,
                        pressed && styles.rowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t(item.labelKey)}
                    >
                      <Text style={styles.rowName} numberOfLines={1}>
                        {t(item.labelKey)}
                      </Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color="#94A3B8"
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </KeyboardAvoidingView>
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
  keyboardAvoidSheet: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
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
  list: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  rowPressed: {
    backgroundColor: colors.accentSurfaceTint,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
  },
});
