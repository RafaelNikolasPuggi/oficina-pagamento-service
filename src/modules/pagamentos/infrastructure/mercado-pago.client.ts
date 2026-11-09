import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { AppConfig } from '../../../config/configuration';

export interface CriarPreferenciaInput {
  pagamentoId: string;
  valor: number;
  descricao: string;
}

export interface PreferenciaCriada {
  preferenceId: string;
  initPoint: string | undefined;
}

export interface PagamentoMercadoPago {
  id: string;
  status: string;
  externalReference: string | null;
}

/**
 * Wrapper fino sobre o SDK oficial do Mercado Pago (v2). O access token
 * nunca fica no código — vem de `MERCADOPAGO_ACCESS_TOKEN` (GitHub
 * Secrets em produção, `.env` local em dev, nunca colado em chat).
 */
@Injectable()
export class MercadoPagoClient {
  private readonly preference: Preference;
  private readonly payment: Payment;
  private readonly notificationUrl: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    const mp = configService.get('mercadoPago', { infer: true });
    const client = new MercadoPagoConfig({ accessToken: mp.accessToken });
    this.preference = new Preference(client);
    this.payment = new Payment(client);
    this.notificationUrl = mp.notificationUrl;
  }

  async criarPreferencia(
    input: CriarPreferenciaInput,
  ): Promise<PreferenciaCriada> {
    const resultado = await this.preference.create({
      body: {
        items: [
          {
            id: input.pagamentoId,
            title: input.descricao,
            quantity: 1,
            unit_price: input.valor,
          },
        ],
        external_reference: input.pagamentoId,
        notification_url: this.notificationUrl,
      },
    });
    return {
      preferenceId: resultado.id as string,
      initPoint: resultado.init_point,
    };
  }

  async consultarPagamento(
    mercadoPagoPaymentId: string,
  ): Promise<PagamentoMercadoPago> {
    const resultado = await this.payment.get({ id: mercadoPagoPaymentId });
    return {
      id: String(resultado.id),
      status: resultado.status ?? 'pending',
      externalReference: resultado.external_reference ?? null,
    };
  }
}
