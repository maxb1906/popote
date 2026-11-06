import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let ready: Promise<boolean> | null = null;

/** Local notifications only (no push, no server). Used to ring timers when the app is in the background. */
export function ensureNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(false);
  if (!ready) {
    ready = (async () => {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
        });
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('timers', {
            name: 'Timers',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 400, 200, 400],
            sound: 'default',
          });
        }
        const cur = await Notifications.getPermissionsAsync();
        if (cur.granted) return true;
        const req = await Notifications.requestPermissionsAsync();
        return req.granted;
      } catch {
        return false;
      }
    })();
  }
  return ready;
}

export async function scheduleTimer(seconds: number, title: string, body: string): Promise<string | undefined> {
  if (!(await ensureNotifications())) return undefined;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(seconds)), channelId: 'timers' },
    });
  } catch {
    return undefined;
  }
}

export async function cancelTimer(id?: string) {
  if (!id || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    /* already fired */
  }
}
