import type { ClientProxy } from '@nestjs/microservices';
import { RabbitMqSagaEventsPublisher } from './saga-events.publisher';

describe('RabbitMqSagaEventsPublisher', () => {
  let osClient: jest.Mocked<Pick<ClientProxy, 'emit'>>;
  let publisher: RabbitMqSagaEventsPublisher;

  beforeEach(() => {
    osClient = { emit: jest.fn() };
    publisher = new RabbitMqSagaEventsPublisher(
      osClient as unknown as ClientProxy,
    );
  });

  it('publicarPagamentoAprovado emite pagamento.aprovado', () => {
    publisher.publicarPagamentoAprovado('os-1');

    expect(osClient.emit).toHaveBeenCalledWith('pagamento.aprovado', {
      ordemServicoId: 'os-1',
    });
  });

  it('publicarPagamentoRejeitado emite pagamento.rejeitado', () => {
    publisher.publicarPagamentoRejeitado('os-1');

    expect(osClient.emit).toHaveBeenCalledWith('pagamento.rejeitado', {
      ordemServicoId: 'os-1',
    });
  });
});
