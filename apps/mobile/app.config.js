const ENV = process.env.APP_ENV ?? "development";

const getPackageName = () => {
  if (ENV === "production") return "com.winlab.app";
  if (ENV === "preview") return "com.winlab.app.preview";
  return "com.winlab.app.dev";
};

const getBundleIdentifier = () => {
  if (ENV === "production") return "com.winlab.app";
  if (ENV === "preview") return "com.winlab.app.preview";
  return "com.winlab.app.dev";
};

const getAppName = () => {
  if (ENV === "production") return "Wintix";
  if (ENV === "preview") return "Wintix (Preview)";
  return "Wintix (Dev)";
};

const getGoogleServicesFile = () => {
  if (ENV === "production") return "./google-services.json";
  if (ENV === "preview") return "./google-services.preview.json";
  return "./google-services.dev.json";
};

const getGoogleServicesPlist = () => {
  if (ENV === "production") return "./GoogleService-Info.plist";
  if (ENV === "preview") return "./GoogleService-Info.preview.plist";
  return "./GoogleService-Info.dev.plist";
};

module.exports = {
  expo: {
    name: getAppName(),
    slug: "mobile",
    version: "1.1.2",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: getBundleIdentifier(),
      buildNumber: "9",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          "Wintix accède à vos photos pour définir votre photo de profil.",
      },
      googleServicesFile: getGoogleServicesPlist(),
    },
    android: {
      versionCode: 6,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
      },
      softwareKeyboardLayoutMode: "resize",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: getPackageName(),
      googleServicesFile: getGoogleServicesFile(),
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    autolinking: {
      searchPaths: ["../../node_modules", "./node_modules"],
    },
    plugins: [
      "expo-router",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Wintix accède à vos photos pour définir votre photo de profil.",
        },
      ],
      "./plugins/withAsyncStorageLocalRepo",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageWidth: 128,
          resizeMode: "contain",
          backgroundColor: "#F4F7FC",
          dark: {
            backgroundColor: "#F4F7FC",
          },
        },
      ],
      "expo-secure-store",
      "expo-video",
      // Icône Android barre de statut : PNG 96×96, fond transparent (rebuild natif si modifiée)
      // IMPORTANT: après ces changements, rebuild obligatoire
      // development : eas build --profile development
      // preview     : eas build --profile preview
      // production  : eas build --profile production
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#ffffff",
          sounds: [],
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      autolinkingModuleResolution: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "fc84219c-0345-48ad-97d9-404735942120",
      },
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/fc84219c-0345-48ad-97d9-404735942120",
    },
  },
};

// ÉTAPES MANUELLES RESTANTES :
// 1. Créer l'icône de notification :
//    assets/images/notification-icon.png
//    Format : PNG, 96x96px, fond transparent, couleur blanche
// 2. Supabase Dashboard → Vault → secrets (pour notify_referral_reward) :
//    supabase_url = https://<project-ref>.supabase.co
//    supabase_service_role_key = <service_role_key>
// 3. Déployer l'Edge Function :
//    supabase functions deploy send-push-notification
// 4. Rebuild l'app :
//    development : eas build --profile development
//    preview     : eas build --profile preview
//    production  : eas build --profile production
// 5. Réinstaller l'app sur les devices de test
