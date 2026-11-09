import { ApiProperty } from '@nestjs/swagger';

/**
 * Formato de notificação do Mercado Pago (webhooks v2):
 * { "type": "payment", "data": { "id": "123456789" }, ... }
 * Campos não essenciais ficam soltos no payload — tipado como `unknown`
 * propositalmente, o corpo inteiro é guardado como veio no histórico do
 * pagamento.
 */
export class WebhookMercadoPagoDto {
  @ApiProperty({ example: 'payment' })
  type: string;

  @ApiProperty({ example: { id: '123456789' } })
  data: { id: string };
}
