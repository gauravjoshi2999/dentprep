# Android build configuration

This is a Trusted Web Activity wrapper around the existing HTTPS DentPrep app. It uses the browser's existing login/session and the same SSR application. No second frontend or bundled server is created. Java 17, Gradle 8.13, Android Gradle Plugin 8.13.2 and Android Browser Helper 2.7.4 are pinned. Minimum Android API is 24, matching the published helper artifact; target/compile API is 36.

Run `gradle --no-daemon :app:assembleDebug :app:lintDebug -PdentprepUrl=https://YOUR_VERIFIED_DENTPREP_HOST/dashboard` from this folder after installing Android SDK platform 36. The GitHub Android workflow performs the same checks. Without a URL it builds against `https://example.invalid/` strictly to verify configuration; this APK is not a usable DentPrep release.

Before a release, verify the deployed app's exact Git SHA, all real signed-in candidate/admin flows and its PWA on a physical Android device. Choose and securely keep the release signing key. Publish a valid `/.well-known/assetlinks.json` on the app's verified HTTPS origin containing package `in.dentprep.app` and the release certificate's SHA-256 fingerprint. No signing secret is committed here and no certificate fingerprint is fabricated. Until ownership verification succeeds, supporting browsers show a Custom Tab with the address bar.

Web changes appear through the deployed site; native wrapper changes require a new signed APK. A real production URL, signing and ownership verification are still required. No Play Store release, working production APK or physical-device acceptance is claimed.

References: [Google Trusted Web Activity guide](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start), [Android Browser Helper](https://github.com/GoogleChrome/android-browser-helper), [AGP compatibility](https://developer.android.com/build/releases/agp-8-13-0-release-notes).
