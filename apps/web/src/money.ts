export function formatBRL(cents: number): string {
  const reais = cents / 100;
  return Number.isInteger(reais) ? String(reais) : reais.toFixed(2).replace('.', ',');
}
