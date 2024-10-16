import * as ProgressPrimitive from '@radix-ui/react-progress';

import type { CSS } from '@/styles';
import { colors, space, styled } from '@/styles';

const Progress = styled(ProgressPrimitive.Root, {
  position: 'relative',
  overflow: 'hidden',
  background: colors.sand1,
  borderRadius: space.sm,
  width: '25em',
  height: '1.5em',
});

const Indicator = styled(ProgressPrimitive.Indicator, {
  height: '100%',
  transition: 'transform 400ms cubic-bezier(0.65, 0, 0.35, 1)',
});

export function ProgressBar({
  progress,
  className,
  children,
  css,
  color = colors.bgBrightOrange.toString(),
}: {
  css?: CSS;
  progress: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Progress css={css} className={className} value={progress} max={1}>
      {children}
      <Indicator style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: color }} />
    </Progress>
  );
}
