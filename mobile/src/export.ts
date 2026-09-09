import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildCsv } from './csv';
import type { AppState } from './types';
import { iso, todayDate } from './utils';

/** Builds the CSV, writes it to a cache file, and opens the native share
 * sheet — the mobile equivalent of the prototype's browser download. */
export async function exportCsv(state: AppState, toast: (msg: string) => void) {
  const { csv, rowCount } = buildCsv(state);
  if (rowCount === 0) {
    toast('Nothing logged yet to export');
    return;
  }
  const filename = `workout-log-${iso(todayDate())}.csv`;
  try {
    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(csv);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export workout log', UTI: 'public.comma-separated-values-text' });
    }
    toast(rowCount + ' sets exported');
  } catch (e) {
    toast('Could not export — try again');
  }
}
