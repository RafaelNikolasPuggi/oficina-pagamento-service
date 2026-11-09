import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EventoGateway } from '../domain/pagamento.entity';
import { StatusPagamento } from '../domain/status-pagamento.enum';

/**
 * Não estende `Document` diretamente — o `_id` de string (mesmo UUID do
 * domínio, em vez do ObjectId padrão do Mongo) conflita com o tipo que a
 * classe base declara. `PagamentoDocumentType` é o que o Mongoose injeta
 * em runtime (documento real + estes campos).
 */
@Schema({ collection: 'pagamentos', timestamps: false })
export class PagamentoDocument {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  ordemServicoId: string;

  @Prop({ type: String, required: true })
  clienteId: string;

  @Prop({ type: Number, required: true })
  valor: number;

  @Prop({ type: String, enum: StatusPagamento, required: true })
  status: StatusPagamento;

  @Prop({ type: String, default: null })
  mercadoPagoPreferenceId: string | null;

  @Prop({ type: String, default: null, index: true })
  mercadoPagoPaymentId: string | null;

  // Schema flexível de propósito: cada webhook do Mercado Pago tem um
  // formato levemente diferente dependendo do tipo de evento — guardamos o
  // payload bruto para auditoria/depuração em vez de normalizar.
  @Prop({ type: [{ type: Object }], default: [] })
  eventos: EventoGateway[];

  @Prop({ type: Date, required: true })
  criadoEm: Date;

  @Prop({ type: Date, required: true })
  atualizadoEm: Date;
}

export type PagamentoDocumentType = PagamentoDocument & Document;

export const PagamentoSchema = SchemaFactory.createForClass(PagamentoDocument);
