import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pagamento } from '../domain/pagamento.entity';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { PagamentoMapper } from './pagamento.mapper';
import { PagamentoDocument, PagamentoDocumentType } from './pagamento.schema';

@Injectable()
export class MongoPagamentoRepository implements PagamentoRepository {
  constructor(
    @InjectModel(PagamentoDocument.name)
    private readonly model: Model<PagamentoDocumentType>,
  ) {}

  async salvar(pagamento: Pagamento): Promise<Pagamento> {
    const dados = PagamentoMapper.toPersistence(pagamento);
    const doc = await this.model.findByIdAndUpdate(pagamento.id, dados, {
      upsert: true,
      new: true,
    });
    return PagamentoMapper.toDomain(doc);
  }

  async buscarPorId(id: string): Promise<Pagamento | null> {
    const doc = await this.model.findById(id);
    return doc ? PagamentoMapper.toDomain(doc) : null;
  }

  async buscarPorOrdemServicoId(
    ordemServicoId: string,
  ): Promise<Pagamento | null> {
    const doc = await this.model.findOne({ ordemServicoId });
    return doc ? PagamentoMapper.toDomain(doc) : null;
  }

  async buscarPorMercadoPagoPaymentId(
    mercadoPagoPaymentId: string,
  ): Promise<Pagamento | null> {
    const doc = await this.model.findOne({ mercadoPagoPaymentId });
    return doc ? PagamentoMapper.toDomain(doc) : null;
  }
}
