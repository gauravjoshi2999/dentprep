# Android build configuration

This is a Trusted Web Activity wrapper around the existing HTTPS DentPrep app. It uses the browser's existing login/session and the same SSR application. No second frontend or bundled server is created. Java 17, Gradle 8.13, Android Gradle Plugin 8.13.2 and Android Browser Helper 2.7.4 are pinned. Minimum Android API is 24, matching the published helper artifact; target/compile API is 36.

The default launch target is the existing verified live app: `https://dentprep.gauravjoshi2999.workers.dev/dashboard`. Run `gradle --no-daemon :app:assembleDebug :app:lintDebug` from this folder after installing Android SDK platform 36. The GitHub Android workflow verifies the exact existing web revision, builds this debug wrapper and runs Android lint on PRs and matching main changes. It records the launch URL, web/native revision, debug certificate and APK checksum in a seven-day artifact. No second backend or frontend is created. A debug build is for testing, not production acceptance.

Before a release, verify the deployed app's exact Git SHA, all real signed-in candidate/admin flows and its PWA on a physical Android device. Choose and securely keep the release signing key. Publish a valid `/.well-known/assetlinks.json` on the app's verified HTTPS origin containing package `in.dentprep.app` and the release certificate's SHA-256 fingerprint. No signing secret is committed here and no certificate fingerprint is fabricated. Until ownership verification succeeds, supporting browsers show a Custom Tab with the address bar.

Web changes appear through the deployed site; native wrapper changes require a new signed APK. The launch URL is now configured. Production signing, ownership verification and real device/account acceptance are still required. No Play Store release, working production APK or physical-device acceptance is claimed.

References: [Google Trusted Web Activity guide](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start), [Android Browser Helper](https://github.com/GoogleChrome/android-browser-helper), [AGP compatibility](https://developer.android.com/build/releases/agp-8-13-0-release-notes).

The Android workflow allows only the already verified origin and root/dashboard entry route. A custom-domain move requires a reviewed origin/configuration change. Main may be awaiting its web rollout; bounded retries still require the exact expected revision and its assets. A stale/failed web release does not produce a claimed verified debug build.

Each runner creates its standard debug certificate. It is not the owner's stable production signing identity. Do not upload a keystore, publish debug fingerprints as production Digital Asset Links, enable a paid publishing account or call an artifact a tested production APK. Until a stable release key and asset links are configured, the browser may show the address bar. Installed native wrapper changes need a new APK; web updates come from the same live origin.
