import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  DomainException,
  EntityNotFoundException,
} from '../../../shared/domain/exceptions';
import { Pagamento } from '../domain/pagamento.entity';
import { PAGAMENTO_REPOSITORY } from '../domain/pagamento.repository';
import type { PagamentoRepository } from '../domain/pagamento.repository';
import { StatusPagamento } from '../domain/status-pagamento.enum';
import { MercadoPagoClient } from '../infrastructure/mercado-pago.client';
import { SAGA_EVENTS_PUBLISHER } from '../infrastructure/saga-events.publisher';
import type { SagaEventsPublisher } from '../infrastructure/saga-events.publisher';

export interface CriarPagamentoInput {
  ordemServicoId: string;
  clienteId: string;
  valor: number;
}

export interface WebhookMercadoPagoInput {
  tipo: string;
  mercadoPagoPaymentId: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class PagamentosService {
  private readonly logger = new Logger(PagamentosService.name);

  constructor(
    @Inject(PAGAMENTO_REPOSITORY)
    private readonly pagamentoRepository: PagamentoRepository,
    private readonly mercadoPagoClient: MercadoPagoClient,
    @Inject(SAGA_EVENTS_PUBLISHER)
    private readonly sagaEventsPublisher: SagaEventsPublisher,
  ) {}

  /**
   * Cria a cobrança para uma OS finalizada — chamado pelo
   * `PagamentosEventsController` ao consumir `os.finalizada` do
   * os-service.
   */
  async criarParaOrdemServico(input: CriarPagamentoInput): Promise<Pagamento> {
    const existente = await this.pagamentoRepository.buscarPorOrdemServicoId(
      input.ordemServicoId,
    );
    if (existente) return existente;

    const pagamento = Pagamento.criar({
      id: randomUUID(),
      ordemServicoId: input.ordemServicoId,
      clienteId: input.clienteId,
      valor: input.valor,
    });

    const preferencia = await this.mercadoPagoClient.criarPreferencia({
      pagamentoId: pagamento.id,
      valor: input.valor,
      descricao: `Ordem de Serviço #${input.ordemServicoId.slice(0, 8)}`,
    });
    pagamento.registrarPreferenciaCriada(preferencia.preferenceId);

    return this.pagamentoRepository.salvar(pagamento);
  }

  /**
   * Processa a notificação assíncrona do Mercado Pago. Idempotente por
   * natureza: um webhook duplicado para um pagamento já APROVADO/REJEITADO
   * simplesmente não encontra transição válida e é ignorado (logado, não
   * lançado) — o Mercado Pago reenvia notificações em caso de timeout, então
   * duplicata é esperada, não um erro.
   */
  async processarWebhook(input: WebhookMercadoPagoInput): Promise<Pagamento> {
    const infoGateway = await this.mercadoPagoClient.consultarPagamento(
      input.mercadoPagoPaymentId,
    );
    if (!infoGateway.externalReference) {
      throw new DomainException(
        'Webhook do Mercado Pago sem external_reference (pagamentoId)',
      );
    }

    const pagamento = await this.pagamentoRepository.buscarPorId(
      infoGateway.externalReference,
    );
    if (!pagamento) {
      throw new EntityNotFoundException(
        'Pagamento',
        infoGateway.externalReference,
      );
    }

    const evento = {
      recebidoEm: new Date(),
      tipo: input.tipo,
      payload: input.payload,
    };

    try {
      if (infoGateway.status === 'approved') {
        pagamento.aprovar(infoGateway.id, evento);
      } else if (infoGateway.status === 'rejected') {
        pagamento.rejeitar(infoGateway.id, evento);
      } else {
        this.logger.log(
          `Webhook ignorado para pagamento ${pagamento.id}: status "${infoGateway.status}" não é terminal`,
        );
        return pagamento;
      }
    } catch (error) {
      if (error instanceof DomainException) {
        this.logger.warn(
          `Webhook duplicado/fora de ordem ignorado para pagamento ${pagamento.id}: ${error.message}`,
        );
        return pagamento;
      }
      throw error;
    }

    const salvo = await this.pagamentoRepository.salvar(pagamento);

    if (salvo.getStatus() === StatusPagamento.APROVADO) {
      this.sagaEventsPublisher.publicarPagamentoAprovado(
        salvo.getOrdemServicoId(),
      );
    } else if (salvo.getStatus() === StatusPagamento.REJEITADO) {
      this.sagaEventsPublisher.publicarPagamentoRejeitado(
        salvo.getOrdemServicoId(),
      );
    }

    return salvo;
  }

  async obter(id: string): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.buscarPorId(id);
    if (!pagamento) throw new EntityNotFoundException('Pagamento', id);
    return pagamento;
  }

  async obterPorOrdemServico(ordemServicoId: string): Promise<Pagamento> {
    const pagamento =
      await this.pagamentoRepository.buscarPorOrdemServicoId(ordemServicoId);
    if (!pagamento) {
      throw new EntityNotFoundException('Pagamento', `OS ${ordemServicoId}`);
    }
    return pagamento;
  }
}
