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
  if (ENV === "production") return "Winlab";
  if (ENV === "preview") return "Winlab (Preview)";
  return "Winlab (Dev)";
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
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: getBundleIdentifier(),
      buildNumber: "5",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          "Winlab accède à vos photos pour définir votre photo de profil.",
      },
      googleServicesFile: getGoogleServicesPlist(),
    },
    android: {
      versionCode: 4,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
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
            "Winlab accède à vos photos pour définir votre photo de profil.",
        },
      ],
      "./plugins/withAsyncStorageLocalRepo",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
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
    build: {
      production: {
        autoIncrement: "versionCode",
      },
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
