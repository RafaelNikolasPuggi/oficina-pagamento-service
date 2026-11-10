import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagingModule } from '../../messaging/messaging.module';
import { AuthModule } from '../auth/auth.module';
import { PagamentosService } from './application/pagamentos.service';
import { PAGAMENTO_REPOSITORY } from './domain/pagamento.repository';
import { MercadoPagoClient } from './infrastructure/mercado-pago.client';
import { MongoPagamentoRepository } from './infrastructure/pagamento.repository.impl';
import {
  PagamentoDocument,
  PagamentoSchema,
} from './infrastructure/pagamento.schema';
import {
  RabbitMqSagaEventsPublisher,
  SAGA_EVENTS_PUBLISHER,
} from './infrastructure/saga-events.publisher';
import { PagamentosEventsController } from './interfaces/messaging/pagamentos.events-controller';
import { PagamentosController } from './interfaces/http/pagamentos.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PagamentoDocument.name, schema: PagamentoSchema },
    ]),
    MessagingModule,
    AuthModule,
  ],
  controllers: [PagamentosController, PagamentosEventsController],
  providers: [
    PagamentosService,
    MercadoPagoClient,
    { provide: PAGAMENTO_REPOSITORY, useClass: MongoPagamentoRepository },
    { provide: SAGA_EVENTS_PUBLISHER, useClass: RabbitMqSagaEventsPublisher },
  ],
})
export class PagamentosModule {}
