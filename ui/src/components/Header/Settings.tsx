import { FiSettings } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';

import { Button } from '@/components/Button/Button';
import { ToggleButton } from '@/components/Button/ToggleButton';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/Dialog/Dialog';
import { ColorCodeStyle, opacityByStyle, useColorCodeStyleStore } from '@/hooks/useColorCodeStyle';
import { colors, fonts, space, styled } from '@/styles';
import { getLengthColour } from '@/utils/beatmap';

import { ColorCodedCell } from '../ColorCodedCell/ColorCodedCell';

const SettingsIcon = styled(FiSettings, {
  fontSize: fonts[125],
});

const Fieldset = styled('fieldset', {
  all: 'unset',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  marginBottom: space.md,
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button iconButton color="sand">
          <SettingsIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogClose asChild>
            <Button iconButton color="sand">
              <IoClose />
            </Button>
          </DialogClose>
        </DialogHeader>
        <Fieldset>
          <Label>Theme:</Label>
          <ThemeToggleBlock>{themeToggle}</ThemeToggleBlock>
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
