export type HorarioInputDto = {
  unidadeId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
};

export type DefinirHorariosInputDto = {
  redeId: string;
  profissionalId: string;
  horarios: HorarioInputDto[];
};
