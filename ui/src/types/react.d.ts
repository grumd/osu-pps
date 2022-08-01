import type * as React from 'react';

declare module 'react' {
  // Allow custom css variables in "style" prop
  interface CSSProperties {
    '--bg'?: string;
    '--bg2x'?: string;
    '--color'?: string;
  }
}
