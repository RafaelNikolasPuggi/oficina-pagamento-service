variable "cluster_name" {
  description = "Nome do cluster kind provisionado localmente."
  type        = string
  default     = "oficina-pagamento-service"
}

variable "namespace" {
  description = "Namespace do Kubernetes onde a aplicação e suas dependências são implantadas. Deve bater com os manifestos em /k8s."
  type        = string
  default     = "oficina-pagamento"
}

variable "mongodb_image" {
  type    = string
  default = "mongo:7"
}

variable "mongodb_storage_size" {
  type    = string
  default = "1Gi"
}

variable "rabbitmq_image" {
  type    = string
  default = "rabbitmq:3-management-alpine"
}
