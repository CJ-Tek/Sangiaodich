import { Box } from '@mantine/core';
import { layout } from '@/config/design-tokens';

/** Caps line length inside role shells so lists don't stretch edge to edge on wide screens. */
export function ShellContent({ children }: { children: React.ReactNode }) {
  return (
    <Box maw={layout.appContentMax} mx="auto" w="100%">
      {children}
    </Box>
  );
}
