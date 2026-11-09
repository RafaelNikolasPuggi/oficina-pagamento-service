import { ApiProperty } from '@nestjs/swagger';
import { Pagamento } from '../../../domain/pagamento.entity';
import { StatusPagamento } from '../../../domain/status-pagamento.enum';

export class PagamentoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ordemServicoId: string;

  @ApiProperty()
  clienteId: string;

  @ApiProperty()
  valor: number;

  @ApiProperty({ enum: StatusPagamento })
  status: StatusPagamento;

  @ApiProperty({ nullable: true })
  mercadoPagoPreferenceId: string | null;

  @ApiProperty({ nullable: true })
  mercadoPagoPaymentId: string | null;

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty()
  atualizadoEm: Date;

  static fromDomain(pagamento: Pagamento): PagamentoResponseDto {
    const dto = new PagamentoResponseDto();
    dto.id = pagamento.id;
    dto.ordemServicoId = pagamento.getOrdemServicoId();
    dto.clienteId = pagamento.getClienteId();
    dto.valor = pagamento.getValor();
    dto.status = pagamento.getStatus();
    dto.mercadoPagoPreferenceId = pagamento.getMercadoPagoPreferenceId();
    dto.mercadoPagoPaymentId = pagamento.getMercadoPagoPaymentId();
    dto.criadoEm = pagamento.getCriadoEm();
    dto.atualizadoEm = pagamento.getAtualizadoEm();
    return dto;
  }
}
