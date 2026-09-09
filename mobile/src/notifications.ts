import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import type { NotifPermission } from './types';

// expo-notifications ships a module-level side-effect file that
// unconditionally registers a push-token listener as soon as the package is
// imported — and that listener hard-throws on Android inside Expo Go (push
// support was removed there in SDK 53). A *static* top-level import would
// evaluate that side effect immediately, crashing the whole app on Android
// Expo Go before any of our own code runs. Loading the module dynamically,
// gated behind this check, defers the require() to call time — so on
// Android Expo Go we simply never touch the package, and local (in-app)
// reminders still work everywhere else (iOS Expo Go, and any real dev/prod
// build on both platforms, where push isn't the only thing this module does).
function pushUnsupported() {
  return Platform.OS === 'android' && isRunningInExpoGo();
}

let modPromise: Promise<typeof import('expo-notifications')> | null = null;
let handlerSet = false;

async function loadNotifications() {
  if (pushUnsupported()) return null;
  if (!modPromise) modPromise = import('expo-notifications');
  const m = await modPromise;
  if (!handlerSet) {
    handlerSet = true;
    m.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return m;
}

function mapStatus(status: string): NotifPermission {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'default';
}

export async function getNotifPermission(): Promise<NotifPermission> {
  try {
    const m = await loadNotifications();
    if (!m) return 'denied';
    const res = await m.getPermissionsAsync();
    return mapStatus(res.status);
  } catch {
    return 'default';
  }
}

export async function requestNotifPermission(): Promise<NotifPermission> {
  try {
    const m = await loadNotifications();
    if (!m) return 'denied';
    const res = await m.requestPermissionsAsync();
    return mapStatus(res.status);
  } catch {
    return 'default';
  }
}

/** Fires a real system notification while the app is running — mirrors the
 * prototype's `new Notification(...)`. No background delivery is promised
 * (that would need a scheduled trigger + a dedicated permission story). */
export async function presentNotification(title: string, body: string, tag: string) {
  try {
    const m = await loadNotifications();
    if (!m) return;
    await m.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
      identifier: tag,
    });
  } catch {
    // swallow — caller falls back to an in-app toast
  }
}
