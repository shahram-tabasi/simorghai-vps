#!/usr/bin/env bash
# =============================================================================
# Download Delta Chat binaries for offline serving
# =============================================================================
# Downloads the latest Delta Chat APK (Android), AppImage (Linux), and
# Windows installer into the delta-chat/ directory so nginx can serve them.
#
# Usage:
#   ./scripts/download-deltachat.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEST_DIR="$PROJECT_ROOT/delta-chat"

mkdir -p "$DEST_DIR"

echo "=== Downloading Delta Chat binaries ==="

# --- Android APK ---
echo ""
echo "--- Android APK ---"
ANDROID_RELEASE=$(curl -sL https://api.github.com/repos/deltachat/deltachat-android/releases/latest)
APK_URL=$(echo "$ANDROID_RELEASE" | grep -oP '"browser_download_url":\s*"\K[^"]+\.apk' | head -1)
ANDROID_VERSION=$(echo "$ANDROID_RELEASE" | grep -oP '"tag_name":\s*"\K[^"]+')

if [ -n "$APK_URL" ] && [ "$APK_URL" != "null" ]; then
  echo "Downloading Android $ANDROID_VERSION: $APK_URL"
  curl -L -o "$DEST_DIR/deltachat-android.apk" "$APK_URL"
  echo "Saved: delta-chat/deltachat-android.apk"
else
  echo "WARNING: Could not find Android APK URL, trying fallback..."
  curl -L -o "$DEST_DIR/deltachat-android.apk" \
    "https://download.delta.chat/android/deltachat-android-latest.apk"
  echo "Saved (fallback): delta-chat/deltachat-android.apk"
fi

# --- Desktop AppImage (Linux) ---
echo ""
echo "--- Desktop AppImage (Linux) ---"
DESKTOP_RELEASE=$(curl -sL https://api.github.com/repos/deltachat/deltachat-desktop/releases/latest)
APPIMAGE_URL=$(echo "$DESKTOP_RELEASE" | grep -oP '"browser_download_url":\s*"\K[^"]+\.AppImage' | head -1)
DESKTOP_VERSION=$(echo "$DESKTOP_RELEASE" | grep -oP '"tag_name":\s*"\K[^"]+')

if [ -n "$APPIMAGE_URL" ] && [ "$APPIMAGE_URL" != "null" ]; then
  echo "Downloading Desktop AppImage $DESKTOP_VERSION: $APPIMAGE_URL"
  curl -L -o "$DEST_DIR/deltachat-desktop.AppImage" "$APPIMAGE_URL"
  echo "Saved: delta-chat/deltachat-desktop.AppImage"
else
  echo "WARNING: Could not find AppImage URL, trying fallback..."
  curl -L -o "$DEST_DIR/deltachat-desktop.AppImage" \
    "https://download.delta.chat/desktop/deltachat-desktop-latest.AppImage"
  echo "Saved (fallback): delta-chat/deltachat-desktop.AppImage"
fi

# --- Windows Installer ---
echo ""
echo "--- Windows Installer ---"
EXE_URL=$(echo "$DESKTOP_RELEASE" | grep -oP '"browser_download_url":\s*"\K[^"]+\.exe' | head -1)

if [ -n "$EXE_URL" ] && [ "$EXE_URL" != "null" ]; then
  echo "Downloading Windows installer $DESKTOP_VERSION: $EXE_URL"
  curl -L -o "$DEST_DIR/deltachat-desktop.exe" "$EXE_URL"
  echo "Saved: delta-chat/deltachat-desktop.exe"
else
  echo "WARNING: Could not find Windows .exe URL, trying fallback..."
  curl -L -o "$DEST_DIR/deltachat-desktop.exe" \
    "https://download.delta.chat/desktop/deltachat-desktop-latest.exe" || \
    echo "ERROR: Windows installer not available from fallback either"
fi

echo ""
echo "=== Done ==="
ls -lh "$DEST_DIR"
