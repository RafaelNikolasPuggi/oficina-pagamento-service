import './tracer';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { JsonLoggerService } from './shared/logging/json-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLoggerService(),
  });

  const configService = app.get(ConfigService<AppConfig, true>);
  const rabbitmq = configService.get('rabbitmq', { infer: true });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmq.url],
      queue: rabbitmq.queue,
      queueOptions: { durable: true },
    },
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Oficina Mecânica — Pagamento Service')
    .setDescription(
      'Microsserviço de pagamentos (integração Mercado Pago) — Tech Challenge Fase 4.',
    )
    .setVersion('4.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.startAllMicroservices();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Aplicação rodando em http://localhost:${port} — docs em /docs`);
}
void bootstrap();
