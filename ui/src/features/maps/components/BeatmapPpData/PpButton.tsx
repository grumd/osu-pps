import { Suspense, lazy, memo, useState } from 'react';
import { IoClose } from 'react-icons/io5';

import { Button } from '@/components/Button/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/Dialog/Dialog';
import Loader from '@/components/Loader/Loader';
import { Text } from '@/components/Text/Text';
import { useMode } from '@/hooks/useMode';
import { space, styled } from '@/styles';

import { prefetchMapPpData } from '../../hooks/useMapPpData';

const PpDialogContentLazy = lazy(() => import('./PpDialogContent'));

const CenteredPpButton = styled(Button, {
  display: 'flex',
  alignItems: 'baseline',
  width: 'min-content',
  borderRadius: space.sm,
  marginLeft: 'auto',
  marginRight: 'auto',
});

export const PpButton = memo(function _PpButton({
  pp,
  beatmapId,
  modsBitmask,
  beatmapName,
}: {
  pp: number | null;
  beatmapId: number;
  modsBitmask: number;
  beatmapName: string;
}) {
  const mode = useMode();
  const [open, setOpen] = useState(false);

  const onOpenClick = () => {
    setOpen(true);
    void prefetchMapPpData(mode, beatmapId, modsBitmask);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <CenteredPpButton onClick={onOpenClick} kind="light">
            <Text bold size="big">
              {pp?.toFixed(0) ?? '?'}
            </Text>
            <Text faded>pp</Text>
          </CenteredPpButton>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{beatmapName}</DialogTitle>
            <DialogClose asChild>
              <Button iconButtonKind="default" kind="light" aria-label="close">
                <IoClose />
              </Button>
            </DialogClose>
          </DialogHeader>
          <Suspense fallback={<Loader />}>
            {open && <PpDialogContentLazy beatmapId={beatmapId} modsBitmask={modsBitmask} />}
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  );
});
