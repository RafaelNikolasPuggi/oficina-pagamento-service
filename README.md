# oficina-pagamento-service

Microsserviço de **Pagamentos** (integração Mercado Pago) do sistema de gestão da oficina — Tech Challenge Fase 4 (POS TECH / SOAT).

Parte de uma arquitetura de 3 microsserviços, cada um com seu próprio repositório e banco de dados:

| Serviço | Repositório | Banco |
|---|---|---|
| OS | [oficina-os-service](https://github.com/RafaelNikolasPuggi/oficina-os-service) | PostgreSQL |
| Produção | [oficina-producao-service](https://github.com/RafaelNikolasPuggi/oficina-producao-service) | PostgreSQL |
| **Pagamento** (este repo) | `oficina-pagamento-service` | **MongoDB** |

O monólito da Fase 3 foi preservado intacto como backup em [oficina-tech-challenge](https://github.com/RafaelNikolasPuggi/oficina-tech-challenge).

## Por que MongoDB

Cada notificação (webhook) do Mercado Pago tem um formato ligeiramente diferente dependendo do tipo de evento, e o histórico bruto de cada pagamento (`eventos[]`) precisa ser preservado para auditoria sem forçar um schema rígido — um documento por pagamento, com o histórico de eventos embutido, se encaixa melhor aqui do que uma tabela relacional normalizada.

## O que este serviço possui

- **Pagamento** — agregado com máquina de estados (`PENDENTE → APROVADO`, `PENDENTE → REJEITADO → PENDENTE` em nova tentativa)
- Endpoint interno `POST /pagamentos` (chamado pelo `os-service` quando a OS é finalizada)
- `POST /pagamentos/webhook` — recebe a notificação do Mercado Pago e confirma o status consultando a API do Mercado Pago diretamente (nunca confia no corpo do webhook por si só)
- `GET /pagamentos/:id` e `GET /pagamentos/por-ordem-servico/:ordemServicoId` (admin, JWT)

Nunca acessa o banco de **OS** ou **Produção** diretamente.

## Rodando localmente

```bash
cp .env.example .env
docker compose up -d mongodb
npm install
npm run start:dev
```

Preencha `MERCADOPAGO_ACCESS_TOKEN` no `.env` com uma credencial de **teste** da sua conta Mercado Pago — nunca comitar o token real. Swagger em `http://localhost:3002/docs`.

## Testes

```bash
npm test          # unitários
npm run test:cov  # com cobertura
```

## Status

Em construção. Próximas etapas: consumidor RabbitMQ para `OSFinalizada` (hoje `POST /pagamentos` é síncrono), publicação de `PagamentoAprovado`/`PagamentoRejeitado` para o os-service completar a Saga, Terraform/K8s/CI-CD próprios, New Relic.
