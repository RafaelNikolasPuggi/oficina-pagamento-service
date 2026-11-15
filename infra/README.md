# Infraestrutura como Código (Terraform) — oficina-pagamento-service

Provisiona, localmente e sem custo de AWS, a infraestrutura própria deste microsserviço:

1. **Cluster Kubernetes local** (`kind_cluster.this`) — Kind (1 control-plane + 1 worker) em containers Docker.
2. **MongoDB** (`kubernetes_deployment.mongodb` + Service/PVC) — banco só deste serviço, sem autenticação (simplicidade do cluster de CI local; o deploy real usa um MongoDB separado, também self-hosted, no cluster EKS).
3. **RabbitMQ** (`kubernetes_deployment.rabbitmq` + Service) — necessário pra aplicação subir (ela conecta na fila `pagamento_queue` no boot).

O deploy da **aplicação em si** fica em [`/k8s`](../k8s), aplicado separadamente com `kubectl apply`.

O deploy **real na AWS** está em [`/k8s-aws`](../k8s-aws) — compartilha o cluster EKS com os outros 2 microsserviços (sem RDS aqui, já que este serviço usa MongoDB, não Postgres).

## Como aplicar

```bash
cd infra
terraform init
terraform apply
export KUBECONFIG=$(terraform output -raw kubeconfig_path)
kubectl apply -f ../k8s
kubectl -n oficina-pagamento rollout status deployment/oficina-pagamento-app
```

## Destruir tudo

```bash
terraform destroy
```
