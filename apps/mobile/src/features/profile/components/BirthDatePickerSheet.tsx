import {
  format,
  isValid,
  parse,
  startOfDay,
  subYears,
} from "date-fns";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#FF8C00";
const ROW_H = 44;
const LIST_H = 220;

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function defaultYmd(): { y: number; m: number; d: number } {
  const base = subYears(startOfDay(new Date()), 25);
  return {
    y: base.getFullYear(),
    m: base.getMonth() + 1,
    d: base.getDate(),
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parseInitial(
  initialIso: string | undefined,
  minYear: number,
  maxYear: number,
): { y: number; m: number; d: number } {
  if (!initialIso?.trim()) {
    const base = defaultYmd();
    const y = clamp(base.y, minYear, maxYear);
    const dim = daysInMonth(y, base.m);
    return { y, m: base.m, d: clamp(base.d, 1, dim) };
  }
  const p = parse(initialIso, "yyyy-MM-dd", new Date());
  if (!isValid(p)) {
    const base = defaultYmd();
    const y = clamp(base.y, minYear, maxYear);
    const dim = daysInMonth(y, base.m);
    return { y, m: base.m, d: clamp(base.d, 1, dim) };
  }
  let y = clamp(p.getFullYear(), minYear, maxYear);
  let m = clamp(p.getMonth() + 1, 1, 12);
  let d = p.getDate();
  const dim = daysInMonth(y, m);
  d = clamp(d, 1, dim);
  return { y, m, d };
}

export type BirthDatePickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** `YYYY-MM-DD` pour le formulaire / Postgres */
  onConfirm: (isoYyyyMmDd: string) => void;
  initialIso?: string;
  language: string;
};

export function BirthDatePickerSheet({
  visible,
  onClose,
  onConfirm,
  initialIso,
  language,
}: BirthDatePickerSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  void language;

  /** Fixed at mount so `handleConfirm` / effects do not see a new Date reference every render. */
  const { today, maxYear } = useMemo(() => {
    const t = startOfDay(new Date());
    return { today: t, maxYear: t.getFullYear() - 12 };
  }, []);
  const minYear = 1900;

  const [y, setY] = useState(() => parseInitial(initialIso, minYear, maxYear).y);
  const [m, setM] = useState(() => parseInitial(initialIso, minYear, maxYear).m);
  const [d, setD] = useState(() => parseInitial(initialIso, minYear, maxYear).d);

  const dayListRef = useRef<FlatList<number>>(null);
  const monthListRef = useRef<FlatList<{ value: number; label: string }>>(null);
  const yearListRef = useRef<FlatList<number>>(null);

  const maxDay = useMemo(() => daysInMonth(y, m), [y, m]);

  useEffect(() => {
    if (d > maxDay) {
      setD(maxDay);
    }
  }, [d, maxDay]);

  const years = useMemo(
    () =>
      Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => maxYear - i,
      ),
    [maxYear, minYear],
  );

  /** Mois affichés en chiffres 1–12 (sélecteur explicite). */
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: String(i + 1),
      })),
    [],
  );

  const days = useMemo(
    () => Array.from({ length: maxDay }, (_, i) => i + 1),
    [maxDay],
  );

  const handleConfirm = useCallback(() => {
    const candidate = startOfDay(new Date(y, m - 1, d));
    if (!isValid(candidate)) {
      onClose();
      return;
    }
    const lastAllowed = startOfDay(subYears(today, 12));
    const capped =
      candidate > lastAllowed ? lastAllowed : candidate;
    onConfirm(format(capped, "yyyy-MM-dd"));
    onClose();
  }, [d, m, onClose, onConfirm, today, y]);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ROW_H,
      offset: ROW_H * index,
      index,
    }),
    [],
  );

  /** À l’ouverture : applique la date initiale et centre les listes sur jour / mois / année sélectionnés. */
  useLayoutEffect(() => {
    if (!visible) return;
    const next = parseInitial(initialIso, minYear, maxYear);
    setY(next.y);
    setM(next.m);
    setD(next.d);

    const dim = daysInMonth(next.y, next.m);
    const safeD = clamp(next.d, 1, dim);
    const di = safeD - 1;
    const mi = next.m - 1;
    const yi = Math.max(0, years.indexOf(next.y));

    const id = requestAnimationFrame(() => {
      dayListRef.current?.scrollToIndex({
        index: di,
        viewPosition: 0.45,
      });
      monthListRef.current?.scrollToIndex({
        index: mi,
        viewPosition: 0.45,
      });
      yearListRef.current?.scrollToIndex({
        index: yi,
        viewPosition: 0.45,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [visible, initialIso, minYear, maxYear, years]);

  const renderYearItem = useCallback(
    ({ item }: { item: number }) => {
      const selected = item === y;
      return (
        <Pressable
          onPress={() => setY(item)}
          style={[styles.cell, selected && styles.cellSelected]}
        >
          <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
            {String(item)}
          </Text>
        </Pressable>
      );
    },
    [y],
  );

  const renderMonthItem = useCallback(
    ({ item }: { item: { value: number; label: string } }) => {
      const selected = item.value === m;
      return (
        <Pressable
          onPress={() => setM(item.value)}
          style={[styles.cell, selected && styles.cellSelected]}
        >
          <Text
            style={[styles.cellText, selected && styles.cellTextSelected]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </Pressable>
      );
    },
    [m],
  );

  const renderDayItem = useCallback(
    ({ item }: { item: number }) => {
      const selected = item === d;
      return (
        <Pressable
          onPress={() => setD(item)}
          style={[styles.cell, selected && styles.cellSelected]}
        >
          <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
            {String(item).padStart(2, "0")}
          </Text>
        </Pressable>
      );
    },
    [d],
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
            <Text style={styles.sheetTitle}>
              {t("profile.createProfile.screen.birthDateLabel")}
            </Text>
            <View style={styles.columns}>
              <View style={styles.column}>
                <Text style={styles.columnHeader}>
                  {t("profile.createProfile.screen.birthDateColumnDay")}
                </Text>
                <FlatList
                  ref={dayListRef}
                  data={days}
                  keyExtractor={(item) => `d-${item}`}
                  renderItem={renderDayItem}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  getItemLayout={getItemLayout}
                  onScrollToIndexFailed={({ index }) => {
                    dayListRef.current?.scrollToOffset({
                      offset: ROW_H * index,
                      animated: false,
                    });
                  }}
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.columnHeader}>
                  {t("profile.createProfile.screen.birthDateColumnMonth")}
                </Text>
                <FlatList
                  ref={monthListRef}
                  data={months}
                  keyExtractor={(item) => `m-${item.value}`}
                  renderItem={renderMonthItem}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  getItemLayout={getItemLayout}
                  onScrollToIndexFailed={({ index }) => {
                    monthListRef.current?.scrollToOffset({
                      offset: ROW_H * index,
                      animated: false,
                    });
                  }}
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.columnHeader}>
                  {t("profile.createProfile.screen.birthDateColumnYear")}
                </Text>
                <FlatList
                  ref={yearListRef}
                  data={years}
                  keyExtractor={(item) => `y-${item}`}
                  renderItem={renderYearItem}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  getItemLayout={getItemLayout}
                  onScrollToIndexFailed={({ index }) => {
                    yearListRef.current?.scrollToOffset({
                      offset: ROW_H * index,
                      animated: false,
                    });
                  }}
                />
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.secondaryBtnText}>
                  {t("profile.createProfile.screen.birthDatePickerCancel")}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {t("profile.createProfile.screen.birthDatePickerConfirm")}
                </Text>
              </Pressable>
            </View>
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
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#020617",
    marginBottom: 8,
    textAlign: "center",
  },
  columns: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  list: {
    maxHeight: LIST_H,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  cell: {
    minHeight: ROW_H,
    justifyContent: "center",
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  cellSelected: {
    backgroundColor: "#FFF7ED",
  },
  cellText: {
    fontSize: 15,
    color: "#020617",
    textAlign: "center",
  },
  cellTextSelected: {
    fontWeight: "700",
    color: ACCENT,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: ACCENT,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  btnPressed: {
    opacity: 0.9,
  },
});
