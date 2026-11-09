import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PagamentosService } from './application/pagamentos.service';
import { PAGAMENTO_REPOSITORY } from './domain/pagamento.repository';
import { MercadoPagoClient } from './infrastructure/mercado-pago.client';
import { MongoPagamentoRepository } from './infrastructure/pagamento.repository.impl';
import {
  PagamentoDocument,
  PagamentoSchema,
} from './infrastructure/pagamento.schema';
import { PagamentosController } from './interfaces/http/pagamentos.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PagamentoDocument.name, schema: PagamentoSchema },
    ]),
    AuthModule,
  ],
  controllers: [PagamentosController],
  providers: [
    PagamentosService,
    MercadoPagoClient,
    { provide: PAGAMENTO_REPOSITORY, useClass: MongoPagamentoRepository },
  ],
})
export class PagamentosModule {}
