import * as Notifications from 'expo-notifications';
import type { NotifPermission } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function mapStatus(status: Notifications.PermissionStatus | string): NotifPermission {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'default';
}

export async function getNotifPermission(): Promise<NotifPermission> {
  try {
    const res = await Notifications.getPermissionsAsync();
    return mapStatus(res.status);
  } catch {
    return 'default';
  }
}

export async function requestNotifPermission(): Promise<NotifPermission> {
  try {
    const res = await Notifications.requestPermissionsAsync();
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
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
      identifier: tag,
    });
  } catch {
    // swallow — caller falls back to an in-app toast
  }
}
