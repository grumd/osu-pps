export function keys<T extends {}>(obj: T): Extract<keyof T, string>[] {
  const k: Extract<keyof T, string>[] = [];
  for (const z in obj) k.push(z);
  return k;
}
