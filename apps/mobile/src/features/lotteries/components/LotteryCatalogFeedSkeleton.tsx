import { StyleSheet, View } from "react-native";

import { theme } from "@/src/theme";

import {
  LOTTERY_CATALOG_SKELETON_VARIANT_CYCLE,
  LOTTERY_VARIANT_IMAGE_ASPECT_RATIO,
} from "../utils/lotteryCatalogMasonryLayout";

function SkeletonCard({
  aspect,
  topOffset,
}: {
  aspect: number;
  topOffset: number;
}) {
  return (
    <View style={[styles.card, topOffset > 0 && { marginTop: topOffset }]}>
      <View style={[styles.media, { aspectRatio: aspect }]} />
      <View style={styles.body}>
        <View style={styles.titleLine} />
        <View style={styles.metaRow}>
          <View style={styles.metaDot} />
          <View style={styles.metaDotWide} />
        </View>
        <View style={styles.cta} />
      </View>
    </View>
  );
}

export function LotteryCatalogFeedSkeleton() {
  return (
    <View
      style={styles.root}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <View style={styles.columns}>
        <View style={styles.col}>
          {[0, 1, 2].map((i) => {
            const variant = LOTTERY_CATALOG_SKELETON_VARIANT_CYCLE[i % 3];
            return (
              <SkeletonCard
                key={`l-${i}`}
                aspect={LOTTERY_VARIANT_IMAGE_ASPECT_RATIO[variant]}
                topOffset={[0, 5, 10][i % 3]}
              />
            );
          })}
        </View>
        <View style={[styles.col, styles.colRight]}>
          {[0, 1, 2].map((i) => {
            const variant =
              LOTTERY_CATALOG_SKELETON_VARIANT_CYCLE[(i + 1) % 3];
            return (
              <SkeletonCard
                key={`r-${i}`}
                aspect={LOTTERY_VARIANT_IMAGE_ASPECT_RATIO[variant]}
                topOffset={[5, 10, 0][i % 3]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  columns: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  col: {
    flex: 1,
  },
  colRight: {
    paddingTop: 12,
  },
  card: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  media: {
    width: "100%",
    backgroundColor: theme.colors.surfaceSoft,
  },
  body: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  titleLine: {
    height: 16,
    borderRadius: theme.radius.xs,
    width: "90%",
    backgroundColor: theme.colors.surfaceSoft,
  },
  metaRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  metaDot: {
    height: 12,
    width: 48,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surfaceSoft,
  },
  metaDotWide: {
    height: 12,
    width: 64,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surfaceSoft,
  },
  cta: {
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentMuted,
    marginTop: theme.spacing.xs,
  },
});
