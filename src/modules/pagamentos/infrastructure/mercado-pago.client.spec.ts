import { ConfigService } from '@nestjs/config';

const preferenceCreate = jest.fn();
const paymentGet = jest.fn();

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn(),
  Preference: jest
    .fn()
    .mockImplementation(() => ({ create: preferenceCreate })),
  Payment: jest.fn().mockImplementation(() => ({ get: paymentGet })),
}));

import { MercadoPagoClient } from './mercado-pago.client';

describe('MercadoPagoClient', () => {
  let client: MercadoPagoClient;

  beforeEach(() => {
    preferenceCreate.mockReset();
    paymentGet.mockReset();

    const configService = {
      get: jest.fn(() => ({
        accessToken: 'TEST-token',
        notificationUrl: 'http://localhost:3002/pagamentos/webhook',
      })),
    } as unknown as ConfigService;

    client = new MercadoPagoClient(configService);
  });

  it('criarPreferencia monta o item e devolve id/init_point', async () => {
    preferenceCreate.mockResolvedValueOnce({
      id: 'pref-123',
      init_point: 'https://mercadopago.com/checkout/pref-123',
    });

    const resultado = await client.criarPreferencia({
      pagamentoId: 'pagamento-1',
      valor: 210,
      descricao: 'Ordem de Serviço #os-1',
    });

    expect(preferenceCreate).toHaveBeenCalledWith({
      body: expect.objectContaining({
        external_reference: 'pagamento-1',
        notification_url: 'http://localhost:3002/pagamentos/webhook',
        items: [
          expect.objectContaining({ id: 'pagamento-1', unit_price: 210 }),
        ],
      }),
    });
    expect(resultado.preferenceId).toBe('pref-123');
  });

  it('consultarPagamento devolve status e external_reference normalizados', async () => {
    paymentGet.mockResolvedValueOnce({
      id: 123456789,
      status: 'approved',
      external_reference: 'pagamento-1',
    });

    const resultado = await client.consultarPagamento('123456789');

    expect(resultado).toEqual({
      id: '123456789',
      status: 'approved',
      externalReference: 'pagamento-1',
    });
  });

  it('consultarPagamento usa "pending" quando o gateway não informa status', async () => {
    paymentGet.mockResolvedValueOnce({ id: 1, external_reference: null });

    const resultado = await client.consultarPagamento('1');

    expect(resultado.status).toBe('pending');
    expect(resultado.externalReference).toBeNull();
  });
});
