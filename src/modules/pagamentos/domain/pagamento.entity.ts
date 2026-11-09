import { Entity } from '../../../shared/domain/entity.base';
import { DomainException } from '../../../shared/domain/exceptions';
import { podeTransicionar, StatusPagamento } from './status-pagamento.enum';

/** Evento bruto recebido do gateway (webhook) — guardado como veio, sem schema fixo. */
export interface EventoGateway {
  recebidoEm: Date;
  tipo: string;
  payload: Record<string, unknown>;
}

export interface CriarPagamentoProps {
  id: string;
  ordemServicoId: string;
  clienteId: string;
  valor: number;
}

export interface PagamentoSnapshot {
  id: string;
  ordemServicoId: string;
  clienteId: string;
  valor: number;
  status: StatusPagamento;
  mercadoPagoPreferenceId: string | null;
  mercadoPagoPaymentId: string | null;
  eventos: EventoGateway[];
  criadoEm: Date;
  atualizadoEm: Date;
}

/**
 * Agregado raiz do pagamento de uma OS. Criado (PENDENTE) quando o
 * os-service publica `OSFinalizada` e permanece aberto até o Mercado Pago
 * confirmar ou rejeitar via webhook — o histórico de eventos do gateway é
 * preservado integralmente (útil tanto pra auditoria quanto pra depurar
 * divergências de status).
 */
export class Pagamento extends Entity {
  private readonly ordemServicoId: string;
  private readonly clienteId: string;
  private readonly valor: number;
  private status: StatusPagamento;
  private mercadoPagoPreferenceId: string | null;
  private mercadoPagoPaymentId: string | null;
  private eventos: EventoGateway[];
  private readonly criadoEm: Date;
  private atualizadoEm: Date;

  private constructor(id: string, props: CriarPagamentoProps, criadoEm: Date) {
    super(id);
    this.ordemServicoId = props.ordemServicoId;
    this.clienteId = props.clienteId;
    this.valor = props.valor;
    this.criadoEm = criadoEm;
  }

  static criar(props: CriarPagamentoProps): Pagamento {
    if (props.valor <= 0) {
      throw new DomainException('Valor do pagamento deve ser positivo');
    }
    const agora = new Date();
    const pagamento = new Pagamento(props.id, props, agora);
    pagamento.status = StatusPagamento.PENDENTE;
    pagamento.mercadoPagoPreferenceId = null;
    pagamento.mercadoPagoPaymentId = null;
    pagamento.eventos = [];
    pagamento.atualizadoEm = agora;
    return pagamento;
  }

  static restaurar(snapshot: PagamentoSnapshot): Pagamento {
    const pagamento = new Pagamento(snapshot.id, snapshot, snapshot.criadoEm);
    pagamento.status = snapshot.status;
    pagamento.mercadoPagoPreferenceId = snapshot.mercadoPagoPreferenceId;
    pagamento.mercadoPagoPaymentId = snapshot.mercadoPagoPaymentId;
    pagamento.eventos = snapshot.eventos;
    pagamento.atualizadoEm = snapshot.atualizadoEm;
    return pagamento;
  }

  private transicionarPara(novoStatus: StatusPagamento): void {
    if (!podeTransicionar(this.status, novoStatus)) {
      throw new DomainException(
        `Transição de status de pagamento inválida: "${this.status}" -> "${novoStatus}"`,
      );
    }
    this.status = novoStatus;
    this.atualizadoEm = new Date();
  }

  registrarPreferenciaCriada(preferenceId: string): void {
    this.mercadoPagoPreferenceId = preferenceId;
    this.atualizadoEm = new Date();
  }

  /** Nova tentativa de cobrança após uma rejeição anterior do Mercado Pago. */
  reiniciarCobranca(): void {
    this.transicionarPara(StatusPagamento.PENDENTE);
  }

  aprovar(mercadoPagoPaymentId: string, evento: EventoGateway): void {
    this.transicionarPara(StatusPagamento.APROVADO);
    this.mercadoPagoPaymentId = mercadoPagoPaymentId;
    this.eventos.push(evento);
  }

  rejeitar(mercadoPagoPaymentId: string, evento: EventoGateway): void {
    this.transicionarPara(StatusPagamento.REJEITADO);
    this.mercadoPagoPaymentId = mercadoPagoPaymentId;
    this.eventos.push(evento);
  }

  getOrdemServicoId(): string {
    return this.ordemServicoId;
  }

  getClienteId(): string {
    return this.clienteId;
  }

  getValor(): number {
    return this.valor;
  }

  getStatus(): StatusPagamento {
    return this.status;
  }

  getMercadoPagoPreferenceId(): string | null {
    return this.mercadoPagoPreferenceId;
  }

  getMercadoPagoPaymentId(): string | null {
    return this.mercadoPagoPaymentId;
  }

  getEventos(): readonly EventoGateway[] {
    return this.eventos;
  }

  getCriadoEm(): Date {
    return this.criadoEm;
  }

  getAtualizadoEm(): Date {
    return this.atualizadoEm;
  }
}

export { StatusPagamento };
