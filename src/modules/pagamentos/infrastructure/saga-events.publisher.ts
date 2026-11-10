import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OS_QUEUE_CLIENT } from '../../../messaging/messaging.module';

export const SAGA_EVENTS_PUBLISHER = Symbol('SAGA_EVENTS_PUBLISHER');

/** Devolve ao os-service o resultado final da cobrança (via `os_queue`). */
export interface SagaEventsPublisher {
  publicarPagamentoAprovado(ordemServicoId: string): void;
  publicarPagamentoRejeitado(ordemServicoId: string): void;
}

@Injectable()
export class RabbitMqSagaEventsPublisher implements SagaEventsPublisher {
  constructor(
    @Inject(OS_QUEUE_CLIENT) private readonly osClient: ClientProxy,
  ) {}

  publicarPagamentoAprovado(ordemServicoId: string): void {
    this.osClient.emit('pagamento.aprovado', { ordemServicoId });
  }

  publicarPagamentoRejeitado(ordemServicoId: string): void {
    this.osClient.emit('pagamento.rejeitado', { ordemServicoId });
  }
}
