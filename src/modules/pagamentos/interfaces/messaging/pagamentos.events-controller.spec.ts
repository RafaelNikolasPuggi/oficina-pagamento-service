import type { PagamentosService } from '../../application/pagamentos.service';
import { PagamentosEventsController } from './pagamentos.events-controller';

describe('PagamentosEventsController', () => {
  let pagamentosService: jest.Mocked<
    Pick<PagamentosService, 'criarParaOrdemServico'>
  >;
  let controller: PagamentosEventsController;

  beforeEach(() => {
    pagamentosService = { criarParaOrdemServico: jest.fn() };
    controller = new PagamentosEventsController(
      pagamentosService as unknown as PagamentosService,
    );
  });

  it('cria a cobrança ao consumir os.finalizada', async () => {
    pagamentosService.criarParaOrdemServico.mockResolvedValueOnce({} as never);

    await controller.aoFinalizarOS({
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      valor: 210,
    });

    expect(pagamentosService.criarParaOrdemServico).toHaveBeenCalledWith({
      ordemServicoId: 'os-1',
      clienteId: 'cliente-1',
      valor: 210,
    });
  });

  it('não lança quando a criação falha (não derruba o consumidor)', async () => {
    pagamentosService.criarParaOrdemServico.mockRejectedValueOnce(
      new Error('boom'),
    );

    await expect(
      controller.aoFinalizarOS({
        ordemServicoId: 'os-1',
        clienteId: 'cliente-1',
        valor: 210,
      }),
    ).resolves.toBeUndefined();
  });
});
