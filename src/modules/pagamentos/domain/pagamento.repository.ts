import { Pagamento } from './pagamento.entity';

export const PAGAMENTO_REPOSITORY = Symbol('PAGAMENTO_REPOSITORY');

export interface PagamentoRepository {
  salvar(pagamento: Pagamento): Promise<Pagamento>;
  buscarPorId(id: string): Promise<Pagamento | null>;
  buscarPorOrdemServicoId(ordemServicoId: string): Promise<Pagamento | null>;
  buscarPorMercadoPagoPaymentId(
    mercadoPagoPaymentId: string,
  ): Promise<Pagamento | null>;
}
