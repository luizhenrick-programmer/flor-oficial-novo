const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number) {
  return brl.format(value);
}

export function installmentLabel(price: number, times = 6) {
  return `${times}x de ${brl.format(price / times)} sem juros`;
}