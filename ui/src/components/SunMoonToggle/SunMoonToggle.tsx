import { styled } from 'styles';

const sunColor = '#dbb21e';
const moonColor = '#7ac5d5';
const angles = [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (angle / 180) * Math.PI);
const stars = [
  [0.72, 0.12],
  [0.9, 0.45],
  [0.65, 0.88],
  [0.2, 0.8],
  [0.77, 0.35],
  [0.1, 0.2],
];
const size = 64;
const half = size / 2,
  d1 = 29, // distance from center to far end of a sun ray
  d2 = 24, // distance from center to near end of a sun ray
  moonOffset = 25;

const duration = '0.5s';
const easing = 'ease-in-out';

const SunMoonButton = styled('button', {
  all: 'unset',
  cursor: 'pointer',

  '& > svg': {
    transition: `stroke ${duration} ${easing}, fill ${duration} ${easing}`,

    '& circle': {
      transition: `transform ${duration} ${easing}`,
    },
  },
});

const SunRayG = styled('g', {
  transition: `stroke-opacity ${duration} ${easing} 0.1s`,
  stroke: sunColor,
  strokeOpacity: 1,

  '& > line': {
    transition: `transform ${duration} ${easing}`,
  },

  variants: {
    dark: {
      true: {
        transition: `stroke-opacity 0.3s cubic-bezier(0.66, 0.09, 0.50, 0.07) 0s`,
        strokeOpacity: 0,
      },
    },
  },
});

export const SunMoonToggle = ({
  dark,
  onChange,
}: {
  dark: boolean;
  onChange: (dark: boolean) => void;
}) => {
  const color = dark ? moonColor : sunColor;
  const x = dark ? 0 : 1;

  return (
    <SunMoonButton
      type="button"
      aria-label="dark mode toggle"
      aria-pressed={dark}
      onClick={() => onChange(!dark)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 64 64"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        stroke={color}
      >
        <defs>
          <mask id="moon-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle
              cx={size}
              cy={0}
              r="18"
              fill="black"
              stroke="white"
              transform={`translate(${-moonOffset * (1 - x)}, ${moonOffset * (1 - x)})`}
            />
          </mask>
        </defs>
        <circle id="sun" cx={half} cy={half} r="14" mask="url(#moon-mask)" />
        {angles.map((rad, index) => {
          return (
            <SunRayG key={index} dark={dark}>
              <line
                x1={half}
                y1={half}
                x2={half + (d2 - d1) * Math.cos(rad)}
                y2={half + (d2 - d1) * Math.sin(rad)}
                transform={`translate(${x * d1 * Math.cos(rad)}, ${x * d1 * Math.sin(rad)})`}
              />
            </SunRayG>
          );
        })}
        {stars.map(([cx, cy], index) => {
          const r = Math.random() * 2 + 1;
          return (
            <circle
              key={index}
              r={r}
              strokeWidth={0}
              fill="white"
              cx={0}
              cy={0}
              transform={`translate(${cx * size}, ${cy * size}), scale(${1 - x}) `}
            />
          );
        })}
      </svg>
    </SunMoonButton>
  );
};
