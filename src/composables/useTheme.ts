import { useDark, useToggle } from '@vueuse/core'

interface UseThemeReturn {
  isDark: ReturnType<typeof useDark>
  toggleDark: (value?: boolean) => boolean
}

export function useTheme(): UseThemeReturn {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  return {
    isDark,
    toggleDark,
  }
}
