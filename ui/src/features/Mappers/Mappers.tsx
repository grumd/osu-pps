import { Suspense } from 'react';
import { FiHelpCircle } from 'react-icons/fi';
import { Outlet } from 'react-router-dom';

import { MenuLink } from '@/components/MenuLink/MenuLink';
import { NavMenu } from '@/features/Header';
import { faq } from '@/routes';
import { fav, pp } from '@/routes/mappers';
import { colors, fonts, space, styled } from '@/styles';

const MappersContainer = styled('div', {
  flex: '1 1 auto',
  display: 'flex',
  flexFlow: 'column nowrap',
});

const SmallNavMenu = styled(NavMenu, {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  fontSize: fonts[75],
  paddingBottom: space.md,
  borderBottom: `${space.borderWidth} solid ${colors.border}`,
  width: space.pageMaxWidth,
  maxWidth: '100%',
  margin: '0 auto',
});

const FaqLink = styled(MenuLink, {
  fontSize: fonts[125],
  display: 'flex',
  alignItems: 'center',
  gap: space.xs,
});

export const Mappers = () => {
  return (
    <MappersContainer>
      <SmallNavMenu>
        <ul>
          <li>
            <MenuLink to={pp({}).$}>pp mappers</MenuLink>
          </li>
          <li>
            <MenuLink to={fav({}).$}>quality mappers</MenuLink>
          </li>
        </ul>
        <FaqLink to={`/${faq({}).$}`}>
          <FiHelpCircle /> how does this work?
        </FaqLink>
      </SmallNavMenu>
      <Suspense>
        <Outlet />
      </Suspense>
    </MappersContainer>
  );
};
