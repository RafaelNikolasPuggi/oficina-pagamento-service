export enum StatusPagamento {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
}

const TRANSICOES_VALIDAS: Record<StatusPagamento, StatusPagamento[]> = {
  [StatusPagamento.PENDENTE]: [
    StatusPagamento.APROVADO,
    StatusPagamento.REJEITADO,
  ],
  [StatusPagamento.APROVADO]: [],
  [StatusPagamento.REJEITADO]: [StatusPagamento.PENDENTE], // nova tentativa de cobrança
};

export function podeTransicionar(
  de: StatusPagamento,
  para: StatusPagamento,
): boolean {
  return TRANSICOES_VALIDAS[de].includes(para);
}
