import { Outlet } from 'react-router-dom';

import { NavMenu } from '@/components/Header/NavMenu';
import MenuLink from '@/components/MenuLink/MenuLink';
import { fav, pp } from '@/routes/mappers';
import { colors, fonts, space, styled } from '@/styles';

const MappersContainer = styled('div', {
  flex: '1 1 auto',
  display: 'flex',
  flexFlow: 'column nowrap',
});

const SmallNavMenu = styled(NavMenu, {
  fontSize: fonts[75],
  paddingBottom: space.md,
  borderBottom: `${space.borderWidth} solid ${colors.border}`,
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
      </SmallNavMenu>
      <Outlet />
    </MappersContainer>
  );
};
