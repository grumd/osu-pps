import { useState } from 'react';
import { MdCheck, MdErrorOutline } from 'react-icons/md';
import { TbCopy } from 'react-icons/tb';

import { colors, styled } from '@/styles';

import { Button } from './Button';

interface ClipboardButtonProps {
  content: string;
  title?: string;
}

const CopyIcon = styled(TbCopy, {
  color: colors.link,
  cursor: 'pointer',
});

const SuccessIcon = styled(MdCheck, {
  color: 'green',
});

const ErrorBlock = styled('div', {
  display: 'flex',
  flexFlow: 'row nowrap',
  gap: '0.1em',
  alignItems: 'center',
  '> span': {
    fontSize: '75%',
  },
});

const ErrorIcon = styled(MdErrorOutline, {
  color: colors.red11,
});

export const ClipboardButton = ({ content, title }: ClipboardButtonProps) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const onClickCopy = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
        }, 5000);
      })
      .catch((error) => {
        console.error(error);
        setStatus('error');
      });
  };

  return (
    <Button iconButtonKind="compact" kind="light" onClick={onClickCopy} title={title}>
      {status === 'idle' ? (
        <CopyIcon />
      ) : status === 'success' ? (
        <SuccessIcon />
      ) : status === 'error' ? (
        <ErrorBlock>
          <ErrorIcon />
          <span>{content}</span>
        </ErrorBlock>
      ) : null}
    </Button>
  );
};
