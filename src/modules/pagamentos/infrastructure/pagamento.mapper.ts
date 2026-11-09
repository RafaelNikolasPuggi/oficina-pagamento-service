import { Pagamento, PagamentoSnapshot } from '../domain/pagamento.entity';
import { PagamentoDocument, PagamentoDocumentType } from './pagamento.schema';

export class PagamentoMapper {
  static toDomain(doc: PagamentoDocumentType): Pagamento {
    const snapshot: PagamentoSnapshot = {
      id: doc._id,
      ordemServicoId: doc.ordemServicoId,
      clienteId: doc.clienteId,
      valor: doc.valor,
      status: doc.status,
      mercadoPagoPreferenceId: doc.mercadoPagoPreferenceId,
      mercadoPagoPaymentId: doc.mercadoPagoPaymentId,
      eventos: doc.eventos,
      criadoEm: doc.criadoEm,
      atualizadoEm: doc.atualizadoEm,
    };
    return Pagamento.restaurar(snapshot);
  }

  static toPersistence(pagamento: Pagamento): Partial<PagamentoDocument> {
    return {
      _id: pagamento.id,
      ordemServicoId: pagamento.getOrdemServicoId(),
      clienteId: pagamento.getClienteId(),
      valor: pagamento.getValor(),
      status: pagamento.getStatus(),
      mercadoPagoPreferenceId: pagamento.getMercadoPagoPreferenceId(),
      mercadoPagoPaymentId: pagamento.getMercadoPagoPaymentId(),
      eventos: [...pagamento.getEventos()],
      criadoEm: pagamento.getCriadoEm(),
      atualizadoEm: pagamento.getAtualizadoEm(),
    };
  }
}
