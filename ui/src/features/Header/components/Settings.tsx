import { FiSettings } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';

import { Button } from '@/components/Button/Button';
import { ToggleButton } from '@/components/Button/ToggleButton';
import { ColorCodedCell } from '@/components/ColorCodedCell/ColorCodedCell';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/Dialog/Dialog';
import { Switch } from '@/components/Switch/Switch';
import { ColorCodeStyle, opacityByStyle, useColorCodeStyleStore } from '@/hooks/useColorCodeStyle';
import { useUseDirectStore } from '@/hooks/useOsuDirect';
import { colors, fonts, space, styled } from '@/styles';
import { getLengthColour } from '@/utils/beatmap';

const SettingsIcon = styled(FiSettings, {
  fontSize: fonts[125],
});

const Fieldset = styled('fieldset', {
  all: 'unset',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  marginTop: space.lg,
  color: colors.textPrimary,
});

const Label = styled('label', {
  color: colors.sand11,
  textAlign: 'left',
  marginRight: space.lg,
  marginBottom: space.xs,
});

const ColorCodeOptionsContainer = styled('div', {
  display: 'flex',
  flexWrap: 'wrap',
  gap: space.md,
});

const OptionButton = styled(ToggleButton, {
  display: 'flex',
  flexFlow: 'column nowrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: space.sm,
});

const ThemeToggleBlock = styled('div', {
  fontSize: fonts[200],
  lineHeight: 0.5,
});

const labelByStyle: Record<ColorCodeStyle, string> = {
  [ColorCodeStyle.Background]: 'Solid',
  [ColorCodeStyle.Border]: 'Border',
  [ColorCodeStyle.TextColor]: 'Color',
  [ColorCodeStyle.Underline]: 'Underline',
  [ColorCodeStyle.None]: 'None',
};

export const Settings = ({ themeToggle }: { themeToggle: React.ReactNode }) => {
  const { style: colorCodeStyle, setStyle } = useColorCodeStyleStore();
  const { direct, setDirect } = useUseDirectStore();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button iconButtonKind="default" kind="light" aria-label="settings">
          <SettingsIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogClose asChild>
            <Button iconButtonKind="default" kind="light" aria-label="close">
              <IoClose />
            </Button>
          </DialogClose>
        </DialogHeader>
        <Fieldset>
          <Label>Theme:</Label>
          <ThemeToggleBlock>{themeToggle}</ThemeToggleBlock>
        </Fieldset>
        <Fieldset>
          <Label>Show beatmap download and copy ID buttons:</Label>
          <Switch value={direct} onChange={setDirect} />
        </Fieldset>
        <Fieldset>
          <Label>Color coding style:</Label>
          <ColorCodeOptionsContainer>
            {[
              ColorCodeStyle.Background,
              ColorCodeStyle.Border,
              ColorCodeStyle.Underline,
              ColorCodeStyle.TextColor,
              ColorCodeStyle.None,
            ].map((style) => (
              <OptionButton
                key={style}
                onClick={() => setStyle(style)}
                pressed={colorCodeStyle === style}
                aria-label={labelByStyle[style]}
              >
                {labelByStyle[style]}
                <ColorCodedCell color={getLengthColour(90, opacityByStyle[style])} kind={style}>
                  1:30
                </ColorCodedCell>
              </OptionButton>
            ))}
          </ColorCodeOptionsContainer>
        </Fieldset>
      </DialogContent>
    </Dialog>
  );
};
