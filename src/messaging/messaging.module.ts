import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppConfig } from '../config/configuration';

export const OS_QUEUE_CLIENT = 'OS_QUEUE_CLIENT';

/** Cliente RabbitMQ pra devolver o resultado do pagamento ao os-service. */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: OS_QUEUE_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService<AppConfig, true>) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('rabbitmq', { infer: true }).url],
            queue: 'os_queue',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MessagingModule {}
