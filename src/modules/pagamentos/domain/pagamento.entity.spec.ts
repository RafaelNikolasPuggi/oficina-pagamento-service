import { DomainException } from '../../../shared/domain/exceptions';
import { Pagamento } from './pagamento.entity';
import { StatusPagamento } from './status-pagamento.enum';

describe('Pagamento', () => {
  function criar(): Pagamento {
    return Pagamento.criar({
      id: 'pagamento-1',
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      valor: 210,
    });
  }

  it('cria um pagamento PENDENTE', () => {
    const pagamento = criar();
    expect(pagamento.getStatus()).toBe(StatusPagamento.PENDENTE);
    expect(pagamento.getValor()).toBe(210);
  });

  it('lança DomainException para valor zero ou negativo', () => {
    expect(() =>
      Pagamento.criar({
        id: 'pagamento-1',
        ordemServicoId: 'os-1',
        clienteId: 'cliente-1',
        valor: 0,
      }),
    ).toThrow(DomainException);
  });

  it('registra a preferência criada no Mercado Pago', () => {
    const pagamento = criar();
    pagamento.registrarPreferenciaCriada('pref-123');
    expect(pagamento.getMercadoPagoPreferenceId()).toBe('pref-123');
  });

  it('aprova o pagamento e guarda o evento do gateway', () => {
    const pagamento = criar();
    const evento = { recebidoEm: new Date(), tipo: 'payment', payload: {} };

    pagamento.aprovar('mp-payment-1', evento);

    expect(pagamento.getStatus()).toBe(StatusPagamento.APROVADO);
    expect(pagamento.getMercadoPagoPaymentId()).toBe('mp-payment-1');
    expect(pagamento.getEventos()).toHaveLength(1);
  });

  it('rejeita o pagamento e guarda o evento do gateway', () => {
    const pagamento = criar();
    const evento = { recebidoEm: new Date(), tipo: 'payment', payload: {} };

    pagamento.rejeitar('mp-payment-1', evento);

    expect(pagamento.getStatus()).toBe(StatusPagamento.REJEITADO);
  });

  it('lança DomainException ao tentar transicionar um pagamento já APROVADO', () => {
    const pagamento = criar();
    const evento = { recebidoEm: new Date(), tipo: 'payment', payload: {} };
    pagamento.aprovar('mp-payment-1', evento);

    expect(() => pagamento.aprovar('mp-payment-2', evento)).toThrow(
      DomainException,
    );
  });

  it('permite nova tentativa de cobrança após rejeição', () => {
    const pagamento = criar();
    const evento = { recebidoEm: new Date(), tipo: 'payment', payload: {} };
    pagamento.rejeitar('mp-payment-1', evento);

    pagamento.reiniciarCobranca();

    expect(pagamento.getStatus()).toBe(StatusPagamento.PENDENTE);
  });
});
