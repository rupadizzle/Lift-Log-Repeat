import { useStore } from '../store/store';
import { tokensFor } from '../theme';

export function useTheme() {
  const theme = useStore((s) => s.theme);
  return { theme, c: tokensFor(theme) };
}
