import { Pagamento } from '../../domain/pagamento.entity';
import type { PagamentosService } from '../../application/pagamentos.service';
import { PagamentosController } from './pagamentos.controller';

describe('PagamentosController', () => {
  let pagamentosService: jest.Mocked<PagamentosService>;
  let controller: PagamentosController;

  const pagamento = Pagamento.criar({
    id: 'pagamento-1',
    ordemServicoId: 'os-1',
    clienteId: 'cliente-1',
    valor: 210,
  });

  beforeEach(() => {
    pagamentosService = {
      criarParaOrdemServico: jest.fn(),
      processarWebhook: jest.fn(),
      obter: jest.fn(),
      obterPorOrdemServico: jest.fn(),
    } as unknown as jest.Mocked<PagamentosService>;

    controller = new PagamentosController(pagamentosService);
  });

  it('criar delega pro service e devolve o DTO de resposta', async () => {
    pagamentosService.criarParaOrdemServico.mockResolvedValueOnce(pagamento);

    const resultado = await controller.criar({
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      valor: 210,
    });

    expect(resultado.id).toBe('pagamento-1');
  });

  it('webhook delega pro service com os dados extraídos do payload', async () => {
    pagamentosService.processarWebhook.mockResolvedValueOnce(pagamento);

    await controller.webhook({ type: 'payment', data: { id: '123' } });

    expect(pagamentosService.processarWebhook).toHaveBeenCalledWith({
      tipo: 'payment',
      mercadoPagoPaymentId: '123',
      payload: { type: 'payment', data: { id: '123' } },
    });
  });

  it('obter devolve o pagamento mapeado pra DTO', async () => {
    pagamentosService.obter.mockResolvedValueOnce(pagamento);

    const resultado = await controller.obter('pagamento-1');

    expect(resultado.id).toBe('pagamento-1');
  });

  it('obterPorOrdemServico devolve o pagamento mapeado pra DTO', async () => {
    pagamentosService.obterPorOrdemServico.mockResolvedValueOnce(pagamento);

    const resultado = await controller.obterPorOrdemServico('os-1');

    expect(resultado.ordemServicoId).toBe('os-1');
  });
});
