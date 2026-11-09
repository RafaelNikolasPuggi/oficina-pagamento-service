import { EntityNotFoundException } from '../../../shared/domain/exceptions';
import { Pagamento } from '../domain/pagamento.entity';
import type { PagamentoRepository } from '../domain/pagamento.repository';
import type { MercadoPagoClient } from '../infrastructure/mercado-pago.client';
import { PagamentosService } from './pagamentos.service';

describe('PagamentosService', () => {
  let pagamentoRepository: jest.Mocked<PagamentoRepository>;
  let mercadoPagoClient: jest.Mocked<MercadoPagoClient>;
  let service: PagamentosService;

  beforeEach(() => {
    pagamentoRepository = {
      salvar: jest.fn(async (p) => p),
      buscarPorId: jest.fn(),
      buscarPorOrdemServicoId: jest.fn(),
      buscarPorMercadoPagoPaymentId: jest.fn(),
    };
    mercadoPagoClient = {
      criarPreferencia: jest.fn(async () => ({
        preferenceId: 'pref-123',
        initPoint: 'https://mercadopago.com/checkout/pref-123',
      })),
      consultarPagamento: jest.fn(),
    } as unknown as jest.Mocked<MercadoPagoClient>;

    service = new PagamentosService(pagamentoRepository, mercadoPagoClient);
  });

  describe('criarParaOrdemServico', () => {
    it('cria um pagamento PENDENTE com preferência do Mercado Pago', async () => {
      pagamentoRepository.buscarPorOrdemServicoId.mockResolvedValueOnce(null);

      const pagamento = await service.criarParaOrdemServico({
        ordemServicoId: 'os-1',
        clienteId: 'cliente-1',
        valor: 210,
      });

      expect(pagamento.getMercadoPagoPreferenceId()).toBe('pref-123');
      expect(mercadoPagoClient.criarPreferencia).toHaveBeenCalledTimes(1);
      expect(pagamentoRepository.salvar).toHaveBeenCalledTimes(1);
    });

    it('é idempotente: retorna o pagamento existente sem criar outro', async () => {
      const existente = Pagamento.criar({
        id: 'pagamento-1',
        ordemServicoId: 'os-1',
        clienteId: 'cliente-1',
        valor: 210,
      });
      pagamentoRepository.buscarPorOrdemServicoId.mockResolvedValueOnce(
        existente,
      );

      const resultado = await service.criarParaOrdemServico({
        ordemServicoId: 'os-1',
        clienteId: 'cliente-1',
        valor: 210,
      });

      expect(resultado).toBe(existente);
      expect(mercadoPagoClient.criarPreferencia).not.toHaveBeenCalled();
    });
  });

  describe('processarWebhook', () => {
    function pagamentoPendente(): Pagamento {
      return Pagamento.criar({
        id: 'pagamento-1',
        ordemServicoId: 'os-1',
        clienteId: 'cliente-1',
        valor: 210,
      });
    }

    it('aprova o pagamento quando o Mercado Pago confirma status approved', async () => {
      const pagamento = pagamentoPendente();
      mercadoPagoClient.consultarPagamento.mockResolvedValueOnce({
        id: 'mp-payment-1',
        status: 'approved',
        externalReference: 'pagamento-1',
      });
      pagamentoRepository.buscarPorId.mockResolvedValueOnce(pagamento);

      const resultado = await service.processarWebhook({
        tipo: 'payment',
        mercadoPagoPaymentId: 'mp-payment-1',
        payload: {},
      });

      expect(resultado.getStatus()).toBe('APROVADO');
    });

    it('rejeita o pagamento quando o Mercado Pago confirma status rejected', async () => {
      const pagamento = pagamentoPendente();
      mercadoPagoClient.consultarPagamento.mockResolvedValueOnce({
        id: 'mp-payment-1',
        status: 'rejected',
        externalReference: 'pagamento-1',
      });
      pagamentoRepository.buscarPorId.mockResolvedValueOnce(pagamento);

      const resultado = await service.processarWebhook({
        tipo: 'payment',
        mercadoPagoPaymentId: 'mp-payment-1',
        payload: {},
      });

      expect(resultado.getStatus()).toBe('REJEITADO');
    });

    it('ignora (sem lançar) webhook duplicado para pagamento já aprovado', async () => {
      const pagamento = pagamentoPendente();
      pagamento.aprovar('mp-payment-1', {
        recebidoEm: new Date(),
        tipo: 'payment',
        payload: {},
      });
      mercadoPagoClient.consultarPagamento.mockResolvedValueOnce({
        id: 'mp-payment-1',
        status: 'approved',
        externalReference: 'pagamento-1',
      });
      pagamentoRepository.buscarPorId.mockResolvedValueOnce(pagamento);

      await expect(
        service.processarWebhook({
          tipo: 'payment',
          mercadoPagoPaymentId: 'mp-payment-1',
          payload: {},
        }),
      ).resolves.toBeDefined();
      expect(pagamentoRepository.salvar).not.toHaveBeenCalled();
    });

    it('lança EntityNotFoundException quando o pagamento referenciado não existe', async () => {
      mercadoPagoClient.consultarPagamento.mockResolvedValueOnce({
        id: 'mp-payment-1',
        status: 'approved',
        externalReference: 'inexistente',
      });
      pagamentoRepository.buscarPorId.mockResolvedValueOnce(null);

      await expect(
        service.processarWebhook({
          tipo: 'payment',
          mercadoPagoPaymentId: 'mp-payment-1',
          payload: {},
        }),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('obter / obterPorOrdemServico', () => {
    it('obter lança EntityNotFoundException quando o pagamento não existe', async () => {
      pagamentoRepository.buscarPorId.mockResolvedValueOnce(null);

      await expect(service.obter('inexistente')).rejects.toThrow(
        EntityNotFoundException,
      );
    });

    it('obterPorOrdemServico lança EntityNotFoundException quando não há pagamento para a OS', async () => {
      pagamentoRepository.buscarPorOrdemServicoId.mockResolvedValueOnce(null);

      await expect(
        service.obterPorOrdemServico('os-sem-pagamento'),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });
});
