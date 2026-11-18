import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { LAYOUT_MESSAGES } from './layout.const';
import { useTheme } from './use-theme.hook';

export function ThemeToggle() {
  const layout = useText(LAYOUT_MESSAGES);
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? layout.themeToLight : layout.themeToDark;
  return (
    <Button size="icon" onClick={toggle} aria-label={label} title={label}>
      <span aria-hidden="true">◐</span>
    </Button>
  );
}
