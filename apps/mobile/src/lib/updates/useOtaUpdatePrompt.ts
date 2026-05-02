import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useTranslation } from "react-i18next";

import { logger } from "@/src/lib/logger";
import { showErrorToast } from "@/src/shared/toast";

/**
 * Détecte les mises à jour EAS Update (OTA), propose une modale racine
 * (« Mettre à jour » / « Plus tard »). « Plus tard » masque l’invite jusqu’au
 * prochain passage de l’app en arrière-plan (retour au premier plan = nouveau check).
 */
export function useOtaUpdatePrompt(): {
  visible: boolean;
  isApplying: boolean;
  applyUpdate: () => Promise<void>;
  dismissLater: () => void;
} {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  /** Après « Plus tard », ne pas re-proposer tant que l’app n’est pas passée en arrière-plan. */
  const snoozeUntilBackgroundRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const runCheck = useCallback(async () => {
    if (!Updates.isEnabled) {
      return;
    }
    if (snoozeUntilBackgroundRef.current) {
      return;
    }
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        setVisible(true);
      }
    } catch (error) {
      logger.warn("[ota] checkForUpdate failed", { error });
    }
  }, []);

  useEffect(() => {
    if (!Updates.isEnabled) {
      return;
    }

    void runCheck();

    const subscription = AppState.addEventListener("change", (next) => {
      const prev = appStateRef.current;
      if (next === "background") {
        snoozeUntilBackgroundRef.current = false;
      }
      if (prev.match(/inactive|background/) && next === "active") {
        void runCheck();
      }
      appStateRef.current = next;
    });

    return () => {
      subscription.remove();
    };
  }, [runCheck]);

  const dismissLater = useCallback(() => {
    snoozeUntilBackgroundRef.current = true;
    setVisible(false);
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!Updates.isEnabled) {
      return;
    }
    setIsApplying(true);
    try {
      const fetchResult = await Updates.fetchUpdateAsync();
      if (fetchResult.isNew) {
        await Updates.reloadAsync();
        return;
      }
      if (fetchResult.isRollBackToEmbedded) {
        await Updates.reloadAsync();
        return;
      }
      setVisible(false);
    } catch (error) {
      logger.warn("[ota] fetchUpdate or reload failed", { error });
      showErrorToast({
        title: t("otaUpdate.fetchFailedTitle"),
        message: t("otaUpdate.fetchFailedMessage"),
      });
    } finally {
      setIsApplying(false);
    }
  }, [t]);

  return {
    visible,
    isApplying,
    applyUpdate,
    dismissLater,
  };
}
