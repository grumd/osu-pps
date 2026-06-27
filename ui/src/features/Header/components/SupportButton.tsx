import { FaCoffee } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { SiBuymeacoffee } from 'react-icons/si';

import { Button } from '@/components/Button/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/Dialog/Dialog';
import { ExternalLink } from '@/components/Link/ExternalLink';
import { colors, fonts, space, styled } from '@/styles';

const UnstyledButton = styled('button', {
  all: 'unset',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',

  '& > span': {
    marginRight: space.xs,
  },

  '&:hover': {
    textDecoration: 'underline',
  },
});

const IconDonate = styled(FaCoffee, {
  width: '1.25em',
  height: '1.25em',
  color: '#8e4111',
});

const SupportLinks = styled('div', {
  display: 'flex',
  justifyContent: 'space-around',
});

const SupportLink = styled(ExternalLink, {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: fonts[175],
  color: colors.textPrimary,
  padding: `${space.sm} ${space.lg}`,
  borderRadius: space.sm,
  '&:hover': {
    background: colors.sand4,
  },
  '&:visited, &:active': {
    color: colors.textPrimary,
  },
});

const CoffeeLogo = styled(SiBuymeacoffee, {
  fontSize: fonts[125],
  color: 'rgb(255, 221, 0)',
});

const Flag = styled('div', {
  overflow: 'hidden',
  width: '2em',
  height: '1.4em',
  borderRadius: space.xs,
  position: 'relative',
  '&:after': {
    content: ' ',
    display: 'block',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '50%',
    background: '#0057b7',
  },
  '&:before': {
    content: ' ',
    display: 'block',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
    background: '#ffd700',
  },
});

export const SupportButton = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <UnstyledButton>
          <span>buy me a coffee</span>
          <IconDonate />
        </UnstyledButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Donate</DialogTitle>
          <DialogClose asChild>
            <Button iconButtonKind="default" kind="light" aria-label="close">
              <IoClose />
            </Button>
          </DialogClose>
        </DialogHeader>
        <p>
          {`I've been developing this website since May 2019.
          It never had any ads, and always was free for everyone in our beloved osu! community.
          If you feel like you enjoy using it, please feel
          free to support me via the links below.`}
        </p>
        <p>You can choose to support me directly, or my country in these difficult times.</p>
        <SupportLinks>
          <SupportLink url="https://buymeacoffee.com/grumd">
            <CoffeeLogo />
            Buy Me a Coffee
          </SupportLink>
          <SupportLink url="https://war.ukraine.ua/donate/">
            <Flag />
            Help Ukraine
          </SupportLink>
        </SupportLinks>
      </DialogContent>
    </Dialog>
  );
};
