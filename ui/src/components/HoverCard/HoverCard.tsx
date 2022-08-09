import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

import { colors, keyframes, space, styled } from '@/styles';

const slideUpAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(4px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

const slideRightAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(-4px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
});

const slideDownAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-4px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

const slideLeftAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(4px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
});

const StyledArrow = styled(HoverCardPrimitive.Arrow, {
  fill: colors.sand6,
  transform: 'scale(1.1)',
});

const StyledContent = styled(HoverCardPrimitive.Content, {
  borderRadius: space.sm,
  padding: space.lg,
  width: 'auto',
  backgroundColor: colors.sand6,
  color: colors.textPrimary,
  boxShadow: '0px 0px 15px -5px rgba(0,0,0,0.8)',
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '300ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
    '&[data-state="open"]': {
      '&[data-side="top"]': { animationName: slideDownAndFade },
      '&[data-side="right"]': { animationName: slideLeftAndFade },
      '&[data-side="bottom"]': { animationName: slideUpAndFade },
      '&[data-side="left"]': { animationName: slideRightAndFade },
    },
  },
});

const StyledRoot = styled(HoverCardPrimitive.Root);

function Content({ children, ...props }: React.ComponentPropsWithRef<typeof StyledContent>) {
  return (
    <HoverCardPrimitive.Portal>
      <StyledContent side="top" {...props}>
        {children}
        <StyledArrow height="0.4em" width="0.8em" />
      </StyledContent>
    </HoverCardPrimitive.Portal>
  );
}

export function HoverCard({ children, ...props }: React.ComponentPropsWithRef<typeof StyledRoot>) {
  return (
    <StyledRoot openDelay={100} closeDelay={100} {...props}>
      {children}
    </StyledRoot>
  );
}

export const HoverCardTrigger = HoverCardPrimitive.Trigger;
export const HoverCardContent = Content;
