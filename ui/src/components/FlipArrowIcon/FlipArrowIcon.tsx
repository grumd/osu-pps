import { FaChevronDown } from 'react-icons/fa';

import { styled } from '@/styles';

export const FlipArrowIcon = styled(FaChevronDown, {
  transition: 'transform 150ms ease-in-out',
  variants: {
    flipped: {
      true: {
        transform: 'scaleY(-1)',
      },
    },
  },
});

FlipArrowIcon.displayName = 'FlipArrowIcon';
