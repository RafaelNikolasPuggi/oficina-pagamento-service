# Provisiona, localmente (sem custo de AWS), o que este serviço precisa pra
# rodar sozinho e validar o build no CI a cada push:
#   1) o cluster Kubernetes local (kind), rodando dentro do Docker;
#   2) o banco de dados (MongoDB) e o broker (RabbitMQ), implantados dentro
#      desse cluster.
#
# O deploy da aplicação em si (Deployment/Service/ConfigMap/Secret/HPA) fica
# em /k8s, aplicado separadamente via `kubectl apply` — ver README.md.
#
# Esta é a infra "própria" deste repositório (requisito da Fase 4: cada
# microsserviço com seu próprio repo+infra+banco). O deploy real compartilha
# o cluster EKS com os outros 2 microsserviços — ver /k8s-aws.

provider "kind" {}

resource "kind_cluster" "this" {
  name           = var.cluster_name
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role = "control-plane"
    }
    node {
      role = "worker"
    }
  }
}

provider "kubernetes" {
  host                   = kind_cluster.this.endpoint
  client_certificate     = kind_cluster.this.client_certificate
  client_key             = kind_cluster.this.client_key
  cluster_ca_certificate = kind_cluster.this.cluster_ca_certificate
}

resource "kubernetes_namespace" "this" {
  metadata {
    name = var.namespace
  }

  depends_on = [kind_cluster.this]
}

resource "kubernetes_persistent_volume_claim" "mongodb" {
  metadata {
    name      = "oficina-pagamento-mongo-data"
    namespace = kubernetes_namespace.this.metadata[0].name
  }

  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = var.mongodb_storage_size
      }
    }
  }

  wait_until_bound = false
}

resource "kubernetes_deployment" "mongodb" {
  metadata {
    name      = "oficina-pagamento-mongo"
    namespace = kubernetes_namespace.this.metadata[0].name
    labels    = { app = "oficina-pagamento-mongo" }
  }

  spec {
    replicas = 1

    selector {
      match_labels = { app = "oficina-pagamento-mongo" }
    }

    template {
      metadata {
        labels = { app = "oficina-pagamento-mongo" }
      }

      spec {
        container {
          name  = "mongodb"
          image = var.mongodb_image

          port {
            container_port = 27017
          }

          volume_mount {
            name       = "data"
            mount_path = "/data/db"
          }

          readiness_probe {
            exec {
              command = ["mongosh", "--eval", "db.adminCommand('ping')"]
            }
            initial_delay_seconds = 10
            period_seconds        = 5
          }
        }

        volume {
          name = "data"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.mongodb.metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "mongodb" {
  metadata {
    # O nome do Service precisa bater com MONGODB_URI no ConfigMap em /k8s.
    name      = "oficina-pagamento-mongo"
    namespace = kubernetes_namespace.this.metadata[0].name
  }

  spec {
    selector = { app = "oficina-pagamento-mongo" }
    port {
      port        = 27017
      target_port = 27017
    }
  }
}

resource "kubernetes_deployment" "rabbitmq" {
  metadata {
    name      = "oficina-rabbitmq"
    namespace = kubernetes_namespace.this.metadata[0].name
    labels    = { app = "oficina-rabbitmq" }
  }

  spec {
    replicas = 1

    selector {
      match_labels = { app = "oficina-rabbitmq" }
    }

    template {
      metadata {
        labels = { app = "oficina-rabbitmq" }
      }

      spec {
        container {
          name  = "rabbitmq"
          image = var.rabbitmq_image

          port {
            container_port = 5672
          }
          port {
            container_port = 15672
          }

          readiness_probe {
            exec {
              command = ["rabbitmq-diagnostics", "check_port_connectivity"]
            }
            initial_delay_seconds = 10
            period_seconds        = 5
            timeout_seconds       = 10 # rabbitmq-diagnostics inicia uma VM Erlang; o default de 1s nunca é suficiente
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "rabbitmq" {
  metadata {
    # O nome do Service precisa bater com RABBITMQ_URL no ConfigMap em /k8s.
    name      = "oficina-rabbitmq"
    namespace = kubernetes_namespace.this.metadata[0].name
  }

  spec {
    selector = { app = "oficina-rabbitmq" }
    port {
      name        = "amqp"
      port        = 5672
      target_port = 5672
    }
    port {
      name        = "management"
      port        = 15672
      target_port = 15672
    }
  }
}
