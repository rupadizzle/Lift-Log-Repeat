import { useEffect } from 'react';
import { getNotifPermission, presentNotification, requestNotifPermission } from '../notifications';
import { useStore } from '../store/store';

/** 30s reminder check (plus an initial 1.5s one) — ported from the
 * prototype's componentDidMount reminder interval. */
export function useReminder() {
  useEffect(() => {
    getNotifPermission().then((p) => useStore.getState().setNotifPerm(p));

    const fire = async () => {
      const hit = useStore.getState().checkReminder();
      if (!hit) return;
      useStore.getState().markNotified(hit.iso);
      const body = hit.name + ' is on your plan for today.';
      if (useStore.getState().notifPerm === 'granted') {
        await presentNotification('Time to train', body, 'wt-' + hit.iso);
      } else {
        useStore.getState().toast_(body);
      }
    };
    const t0 = setTimeout(fire, 1500);
    const id = setInterval(fire, 30000);
    return () => { clearTimeout(t0); clearInterval(id); };
  }, []);
}

/** Ported from the prototype's askNotifPermission(): branches on the
 * current permission rather than always prompting. */
export async function askNotifPermission() {
  const store = useStore.getState();
  const current = await getNotifPermission();
  if (current === 'granted') { store.setNotifPerm('granted'); return; }
  if (current === 'denied') {
    store.setNotifPerm('denied');
    store.toast_('Notifications are blocked in your device settings');
    return;
  }
  const p = await requestNotifPermission();
  store.setNotifPerm(p);
  if (p === 'granted') store.toast_("Reminders on — we'll nudge you on training days");
  else store.toast_('Reminders will show in-app only');
}
