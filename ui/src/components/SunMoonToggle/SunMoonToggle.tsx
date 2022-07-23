import { useSpring, a } from '@react-spring/web';
import { fonts, styled } from 'styles';

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

const SunMoonButton = styled('button', {
  all: 'unset',
  cursor: 'pointer',
});

export const SunMoonToggle = ({
  night,
  onChange,
}: {
  night: boolean;
  onChange: (night: boolean) => void;
}) => {
  const { x, color } = useSpring({
    x: night ? 0 : 1,
    color: night ? moonColor : sunColor,
  });

  return (
    <SunMoonButton
      type="button"
      aria-label="dark mode toggle"
      aria-pressed={night}
      onClick={() => onChange(!night)}
    >
      <a.svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 64 64"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <mask id="moon-mask">
            <rect width="100%" height="100%" fill="white" />
            <a.circle
              cx={x.to((x) => size - moonOffset * (1 - x))}
              cy={x.to((x) => moonOffset * (1 - x))}
              r="18"
              fill="black"
              stroke="white"
            />
          </mask>
        </defs>
        <a.circle id="sun" fill={color} cx={half} cy={half} r="14" mask="url(#moon-mask)" />
        <g stroke={sunColor}>
          {angles.map((rad, index) => {
            return (
              <a.line
                key={index}
                strokeOpacity={x.to((x) => (x < 0.5 ? 0 : x))}
                x1={x.to((x) => half + x * d1 * Math.cos(rad))}
                y1={x.to((x) => half + x * d1 * Math.sin(rad))}
                x2={x.to((x) => half + x * d2 * Math.cos(rad))}
                y2={x.to((x) => half + x * d2 * Math.sin(rad))}
              />
            );
          })}
          {stars.map(([cx, cy], index) => {
            const r = Math.random() * 2 + 1;
            return (
              <a.circle
                key={index}
                r={x.to((x) => (1 - x) * r)}
                strokeWidth={0}
                fill="currentColor"
                cx={cx * size}
                cy={cy * size}
              />
            );
          })}
        </g>
      </a.svg>
    </SunMoonButton>
  );
};
