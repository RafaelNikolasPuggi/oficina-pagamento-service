import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PagamentosService } from '../../application/pagamentos.service';

interface OsFinalizadaEvent {
  ordemServicoId: string;
  clienteId: string;
  valor: number;
}

/** Dispara a cobrança quando o os-service publica `os.finalizada`. */
@Controller()
export class PagamentosEventsController {
  private readonly logger = new Logger(PagamentosEventsController.name);

  constructor(private readonly pagamentosService: PagamentosService) {}

  @EventPattern('os.finalizada')
  async aoFinalizarOS(@Payload() evento: OsFinalizadaEvent): Promise<void> {
    await this.pagamentosService
      .criarParaOrdemServico(evento)
      .catch((error: Error) =>
        this.logger.error(
          `Falha ao criar cobrança para a OS ${evento.ordemServicoId}: ${error.message}`,
        ),
      );
  }
}
