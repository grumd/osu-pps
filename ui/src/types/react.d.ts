// Needed for correct module augmentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as React from 'react';

declare module 'react' {
  // Allow custom css variables in "style" prop via interface merging
  interface CSSProperties {
    '--bg'?: string;
    '--bg2x'?: string;
    '--color'?: string;
  }
}
