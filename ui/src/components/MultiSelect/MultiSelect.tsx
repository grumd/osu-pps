import { FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MultiSelect as ReactMultiSelect } from 'react-multi-select-component';

import { FlipArrowIcon } from '@/components/FlipArrowIcon/FlipArrowIcon';
import { colors, fonts, space, styled } from '@/styles';

const Arrow = ({ expanded }: { expanded: boolean }) => {
  return <FlipArrowIcon flipped={expanded} />;
};

const ReactSelectWrapper = (props) => {
  return <ReactMultiSelect {...props} hasSelectAll={false} disableSearch ArrowRenderer={Arrow} />;
};
export const MultiSelect = ReactSelectWrapper;
// export const MultiSelect = styled(ReactSelectWrapper, {
//   padding: space.sm,
//   border: `${space.borderWidth} solid ${colors.sand8}`,
//   color: colors.amberA11,
//   boxShadow: `0 2px 10px ${colors.sand1}`,

//   '& .react-select__control': {
//     backgroundColor: colors.sand1,
//     borderRadius: space.sm,
//   },
// });
