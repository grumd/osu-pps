export function keys<T extends object>(obj: T): Extract<keyof T, string>[] {
  const k: Extract<keyof T, string>[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const z in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, z)) {
      k.push(z);
    }
  }
  return k;
}
