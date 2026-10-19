import { Mapper } from '@core/application/mapper.base';
import { DIAS_SEMANA } from '../../domain/entities/horario-atendimento.entity';
import type { HorarioAtendimento } from '../../domain/entities/horario-atendimento.entity';
import type { Profissional } from '../../domain/entities/profissional.entity';
import type { HorarioDto, ProfissionalDto } from '../dtos/profissional.dto';

export type MapHorarioParams = { horario: HorarioAtendimento };

export class HorarioMapper extends Mapper<MapHorarioParams, HorarioDto> {
  public map({ horario }: MapHorarioParams): HorarioDto {
    return {
      id: horario.id.toString(),
      unidadeId: horario.unidadeId,
      diaSemana: horario.diaSemana,
      diaSemanaLabel: DIAS_SEMANA.find((dia) => dia.value === horario.diaSemana)?.label ?? '—',
      horaInicio: horario.horaInicio.slice(0, 5),
      horaFim: horario.horaFim.slice(0, 5),
      duracaoSlotMinutos: horario.duracaoSlotMinutos,
      intervaloMinutos: horario.intervaloMinutos,
    };
  }
}

export type MapProfissionalParams = {
  profissional: Profissional;
  unidades?: string[];
  horarios?: HorarioAtendimento[];
};

export class ProfissionalMapper extends Mapper<MapProfissionalParams, ProfissionalDto> {
  private readonly horarioMapper = new HorarioMapper();

  public map({ profissional, unidades = [], horarios = [] }: MapProfissionalParams): ProfissionalDto {
    return {
      id: profissional.id.toString(),
      redeId: profissional.redeId,
      nome: profissional.nome,
      conselhoClasse: profissional.registro.conselhoClasse,
      numeroConselho: profissional.registro.numero,
      ufConselho: profissional.registro.uf,
      registroFormatado: profissional.registro.formatado(),
      cpf: profissional.cpf,
      especialidade: profissional.especialidade,
      registroEspecialista: profissional.registroEspecialista,
      telefone: profissional.telefone,
      email: profissional.email,
      corAgenda: profissional.corAgenda,
      observacoes: profissional.observacoes,
      ativo: profissional.ativo,
      unidades,
      horarios: horarios.map((horario) => this.horarioMapper.map({ horario })),
      createdAt: profissional.createdAt.toISOString(),
    };
  }
}
