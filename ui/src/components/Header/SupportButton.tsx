import { FaHandHoldingHeart } from 'react-icons/fa';
import { IoLogoPaypal } from 'react-icons/io5';

import {
  Dialog,
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

const IconDonate = styled(FaHandHoldingHeart, {
  width: '1.25em',
  height: '1.25em',
  color: '#f15270',
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

const PpLogo = styled(IoLogoPaypal, {
  fontSize: fonts[125],
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
          <span>support</span>
          <IconDonate />
        </UnstyledButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Donate</DialogTitle>
        </DialogHeader>
        <p>
          {`I've been developing this website since May 2019.
          It never had any ads, and always was free for everyone in our beloved osu! community.
          If you feel like you enjoy using it, please feel
          free to support me via the links below.`}
        </p>
        <p>You can choose to support me directly, or my country in these difficult times.</p>
        <SupportLinks>
          <SupportLink url="https://www.paypal.com/donate/?hosted_button_id=778CECM6BGJ6C">
            <PpLogo />
            PayPal
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
