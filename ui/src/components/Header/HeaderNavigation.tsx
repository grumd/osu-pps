import { generatePath, useMatch } from 'react-router-dom';
import { useRouteParams } from 'typesafe-routes';

import MenuLink from '@/components/MenuLink/MenuLink';
import { Mode } from '@/constants/modes';
import { faq, mode } from '@/routes';
import { colors, fonts, space, styled } from '@/styles';

const FakeListItem = styled('li', {
  fontSize: fonts[175],
  fontWeight: 600,
  color: colors.textPrimary,
  cursor: 'default',
});

const NavMenu = styled('nav', {
  display: 'flex',
  flexFlow: 'row wrap',

  '& > ul': {
    padding: 0,
    margin: 0,
    display: 'flex',
    flexFlow: 'row wrap',
    alignItems: 'center',
    listStyleType: 'none',

    '& > li > a': {
      marginX: space.xs,
    },
    '& > li:first-child > a': {
      marginLeft: 0,
    },
    [`& > li:not(${FakeListItem}) + li::before`]: {
      fontSize: fonts[175],
      color: colors.textInactive,
      content: '•',
    },
  },
});

export function HeaderNavigation() {
  const params = useRouteParams(mode);
  const modeMatch = useMatch(`${mode.template}/*`);

  const modeParams = { mode: params.mode ?? Mode.osu };

  const getOtherModeUrl = (newMode: Mode) =>
    modeMatch
      ? generatePath(`${mode.template}/*`, { mode: newMode, '*': modeMatch.params['*'] })
      : generatePath(mode.template, { mode: newMode });

  return (
    <div>
      <NavMenu>
        <ul>
          <FakeListItem>pp</FakeListItem>
          <li>
            <MenuLink to={mode(modeParams).maps({}).$}>maps</MenuLink>
          </li>
          <li>
            <MenuLink to={mode(modeParams).mappers({}).pp({}).$}>mappers</MenuLink>
          </li>
          <li>
            <MenuLink to={mode(modeParams).rankings({}).$}>rankings</MenuLink>
          </li>
          <li>
            <MenuLink to={faq({}).$}>faq</MenuLink>
          </li>
        </ul>
      </NavMenu>
      {params.mode ? (
        <NavMenu>
          <ul>
            <li>
              <MenuLink to={getOtherModeUrl(Mode.osu)}>osu</MenuLink>
            </li>
            <li>
              <MenuLink to={getOtherModeUrl(Mode.mania)}>mania</MenuLink>
            </li>
            <li>
              <MenuLink to={getOtherModeUrl(Mode.taiko)}>taiko</MenuLink>
            </li>
            <li>
              <MenuLink to={getOtherModeUrl(Mode.fruits)}>fruits</MenuLink>
            </li>
          </ul>
        </NavMenu>
      ) : null}
    </div>
  );
}
