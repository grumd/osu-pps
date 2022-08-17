import * as ProgressPrimitive from '@radix-ui/react-progress';

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
  backgroundColor: colors.bgBrightOrange,
  height: '100%',
  transition: 'transform 400ms cubic-bezier(0.65, 0, 0.35, 1)',
});

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <Progress value={progress} max={1}>
      <Indicator style={{ width: `${Math.round(progress * 100)}%` }} />
    </Progress>
  );
}
