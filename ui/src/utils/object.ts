export function keys<T extends object>(obj: T): Extract<keyof T, string>[] {
  const k: Extract<keyof T, string>[] = [];
  for (const z in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, z)) {
      k.push(z);
    }
  }
  return k;
}
