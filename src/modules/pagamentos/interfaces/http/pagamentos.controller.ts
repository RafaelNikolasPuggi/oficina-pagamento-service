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
import { DomainException } from '../../../../shared/domain/exceptions';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PagamentosService } from '../../application/pagamentos.service';
import { PagamentoResponseDto } from './dto/pagamento-response.dto';

@ApiTags('Pagamentos')
@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly pagamentosService: PagamentosService) {}

  /**
   * Webhook público do Mercado Pago — autenticado pela própria consulta ao
   * pagamento na API do Mercado Pago (não confiamos em nada do corpo da
   * notificação além do id a consultar), não por JWT.
   *
   * Corpo tipado como `Record<string, unknown>` (não um DTO de classe) de
   * propósito: o `ValidationPipe` global roda com `whitelist: true` +
   * `forbidNonWhitelisted: true`, e o Mercado Pago envia campos variáveis
   * conforme o tipo de evento (`action`, `api_version`, `date_created`,
   * `live_mode`, `user_id`, etc.) — um DTO de classe faria essa validação
   * rejeitar com 400 qualquer notificação real, já que nenhum desses
   * campos está (nem deveria estar) na whitelist.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(@Body() body: Record<string, unknown>): Promise<void> {
    const tipo = typeof body.type === 'string' ? body.type : 'desconhecido';
    const data = body.data as { id?: unknown } | undefined;
    const mercadoPagoPaymentId =
      typeof data?.id === 'string' ? data.id : undefined;
    if (!mercadoPagoPaymentId) {
      throw new DomainException(
        'Webhook do Mercado Pago sem data.id válido',
      );
    }
    await this.pagamentosService.processarWebhook({
      tipo,
      mercadoPagoPaymentId,
      payload: body,
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
