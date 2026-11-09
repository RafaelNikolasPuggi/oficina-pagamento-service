import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Verificação stateless do JWT administrativo — este serviço nunca emite
 * tokens (login fica no `oficina-os-service`), só confere a assinatura
 * contra o mesmo `JWT_SECRET` compartilhado. Sem tabela de usuário, sem
 * acesso a banco de outro serviço.
 */
@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
