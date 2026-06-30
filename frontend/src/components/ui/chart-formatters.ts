export function intFmt(val: number): string {
  if (val >= 1000000) {
    return (val / 1000000).toFixed(1) + "M";
  }
  if (val >= 1000) {
    return (val / 1000).toFixed(1) + "k";
  }
  return val.toLocaleString();
}
