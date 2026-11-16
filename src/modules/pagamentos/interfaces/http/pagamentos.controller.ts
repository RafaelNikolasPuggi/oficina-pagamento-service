import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PagamentosService } from '../../application/pagamentos.service';
import { PagamentoResponseDto } from './dto/pagamento-response.dto';
import { WebhookMercadoPagoDto } from './dto/webhook-mercadopago.dto';

@ApiTags('Pagamentos')
@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentosService: PagamentosService) {}

  /**
   * Webhook público do Mercado Pago — autenticado pela própria consulta ao
   * pagamento na API do Mercado Pago (não confiamos em nada do corpo da
   * notificação além do id a consultar), não por JWT.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(@Body() dto: WebhookMercadoPagoDto): Promise<void> {
    await this.pagamentosService.processarWebhook({
      tipo: dto.type,
      mercadoPagoPaymentId: dto.data.id,
      payload: dto as unknown as Record<string, unknown>,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consulta um pagamento pelo id' })
  async obter(@Param('id') id: string): Promise<PagamentoResponseDto> {
    const pagamento = await this.pagamentosService.obter(id);
    return PagamentoResponseDto.fromDomain(pagamento);
  }

  @Get('por-ordem-servico/:ordemServicoId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consulta o pagamento de uma ordem de serviço' })
  async obterPorOrdemServico(
    @Param('ordemServicoId') ordemServicoId: string,
  ): Promise<PagamentoResponseDto> {
    const pagamento =
      await this.pagamentosService.obterPorOrdemServico(ordemServicoId);
    return PagamentoResponseDto.fromDomain(pagamento);
  }
}
