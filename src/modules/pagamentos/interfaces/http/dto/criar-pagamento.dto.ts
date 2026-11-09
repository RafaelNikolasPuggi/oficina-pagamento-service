import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

/** Endpoint interno — chamado pelo os-service quando a OS é finalizada. */
export class CriarPagamentoDto {
  @ApiProperty()
  @IsString()
  ordemServicoId: string;

  @ApiProperty()
  @IsString()
  clienteId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  valor: number;
}
