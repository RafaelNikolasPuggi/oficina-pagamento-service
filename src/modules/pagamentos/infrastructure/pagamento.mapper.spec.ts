import { Pagamento } from '../domain/pagamento.entity';
import { StatusPagamento } from '../domain/status-pagamento.enum';
import { PagamentoMapper } from './pagamento.mapper';
import { PagamentoDocumentType } from './pagamento.schema';

describe('PagamentoMapper', () => {
  it('converte de domínio para persistência', () => {
    const pagamento = Pagamento.criar({
      id: 'pagamento-1',
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      valor: 210,
    });
    pagamento.registrarPreferenciaCriada('pref-123');

    const doc = PagamentoMapper.toPersistence(pagamento);

    expect(doc._id).toBe('pagamento-1');
    expect(doc.valor).toBe(210);
    expect(doc.status).toBe(StatusPagamento.PENDENTE);
    expect(doc.mercadoPagoPreferenceId).toBe('pref-123');
  });

  it('converte de documento Mongo para domínio', () => {
    const doc = {
      _id: 'pagamento-1',
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      valor: 210,
      status: StatusPagamento.APROVADO,
      mercadoPagoPreferenceId: 'pref-123',
      mercadoPagoPaymentId: 'mp-1',
      eventos: [],
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    } as unknown as PagamentoDocumentType;

    const pagamento = PagamentoMapper.toDomain(doc);

    expect(pagamento.id).toBe('pagamento-1');
    expect(pagamento.getStatus()).toBe(StatusPagamento.APROVADO);
    expect(pagamento.getValor()).toBe(210);
  });
});
