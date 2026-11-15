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
- Consome `os.finalizada` (RabbitMQ) e cria a cobrança no Mercado Pago
- `POST /pagamentos/webhook` — recebe a notificação do Mercado Pago e confirma o status consultando a API do Mercado Pago diretamente (nunca confia no corpo do webhook por si só); publica `pagamento.aprovado`/`pagamento.rejeitado` de volta pro `os-service`
- `GET /pagamentos/:id` e `GET /pagamentos/por-ordem-servico/:ordemServicoId` (admin, JWT)

Nunca acessa o banco de **OS** ou **Produção** diretamente.

## Rodando localmente

```bash
cp .env.example .env
docker compose up -d mongodb
npm install
npm run start:dev
```

Preencha `MERCADOPAGO_ACCESS_TOKEN` no `.env` com uma credencial de **teste** da sua conta Mercado Pago — nunca comitar o token real. Swagger em `http://localhost:3002/docs`. Precisa do mesmo RabbitMQ (`RABBITMQ_URL`) do `os-service` — ver docker-compose daquele repositório.

## Testes

```bash
npm test          # unitários
npm run test:cov  # com cobertura (gate de CI: mínimo 80% de linhas)
```

## Infraestrutura e deploy

Mesma separação dos outros 2 serviços:

- **[`/infra`](infra)** — Terraform (`kind` + MongoDB + RabbitMQ), cluster local efêmero, validado de graça a cada push (job `deploy`).
- **[`/k8s`](k8s)** / **[`/k8s-aws`](k8s-aws)** — manifestos de deploy local e real.
- **Diferente dos outros 2**: este serviço precisa de **exposição pública** (`type: LoadBalancer`) porque o Mercado Pago chama o webhook de fora do cluster. O MongoDB real também é self-hosted no cluster, com PersistentVolumeClaim de verdade (StorageClass `gp3` via o addon `aws-ebs-csi-driver`, habilitado no `oficina-infra-k8s`).
- RabbitMQ real (namespace `oficina-shared`) aplicado de forma idempotente, igual aos outros 2 serviços.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`): `build-test` → `docker-build-push` → `deploy` (kind efêmero + smoke test) → `deploy-eks` (real, atrás de `AWS_DEPLOY_ENABLED=true`, lê `MERCADOPAGO_ACCESS_TOKEN` de um GitHub Secret). Branch `main` protegida — PR obrigatório, CI tem que passar.

## Status

Saga completa (RabbitMQ), cobertura de testes acima de 80%, infra como código (local + AWS, com PVC de verdade pro MongoDB). Próximas etapas: New Relic, vídeo + PDF de entrega da Fase 4.
