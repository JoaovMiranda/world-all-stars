import { Button } from './button.component';
import { LAYOUT_TEXT } from './layout.const';
import { useTheme } from './use-theme.hook';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? LAYOUT_TEXT.themeToLight : LAYOUT_TEXT.themeToDark;
  return (
    <Button size="icon" onClick={toggle} aria-label={label} title={label}>
      <span aria-hidden="true">◐</span>
    </Button>
  );
}
