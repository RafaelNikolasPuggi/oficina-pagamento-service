export interface AppConfig {
  mongodb: {
    uri: string;
  };
  jwt: {
    secret: string;
  };
  mercadoPago: {
    accessToken: string;
    notificationUrl: string;
  };
}

export default (): AppConfig => ({
  mongodb: {
    uri:
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/oficina_pagamento',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  },
  mercadoPago: {
    // Nunca colar o token real aqui — vem de secret (GitHub Secrets em
    // produção, .env local nunca commitado em dev).
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? '',
    notificationUrl:
      process.env.MERCADOPAGO_NOTIFICATION_URL ??
      'http://localhost:3002/pagamentos/webhook',
  },
});
