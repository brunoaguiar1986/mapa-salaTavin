const API_BASE_URL = `http://localhost:3000`
const TURMAS_URL = API_BASE_URL + "/turmas"
const SALAS_URL = API_BASE_URL + "/salas"

const converterParaMinutos = (horario) => {
    const [horas, minutos] = horario.split(':').map(Number);
    return horas * 60 + minutos;
};

const calcularHorarioFim = (horarioInicio, qtdAulas) => {
    const [hora, minuto] = horarioInicio.split(":").map(Number);
    const duracaoTotal = qtdAulas * 45; // Tempo total em minutos

    // Soma os minutos ao horário de início
    let minutosFinais = minuto + duracaoTotal;
    let horasFinais = hora + Math.floor(minutosFinais / 60);
    minutosFinais = minutosFinais % 60;

    // Formata o horário final como HH:MM
    const horarioFim = `${String(horasFinais).padStart(2, "0")}:${String(minutosFinais).padStart(2, "0")}`;
    return horarioFim;
}

class Sala {
    static async teste(){
        console.log("Live")
    }
    static async getSala(id) {
        try {
            const response = await fetch(`${SALAS_URL}/${id}`);
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar sala:", error);
            return null;
        }
    }

    static async getSalas() {
        try {
            const response = await fetch(`${SALAS_URL}`);
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar salas:", error);
            return null;
        }
    }

    static async atualizarSala(id, novosDados) {
        try {
            await fetch(`${SALAS_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novosDados),
            });
            console.log(`Sala ${id} atualizada com sucesso!`);
        } catch (error) {
            console.error("Erro ao atualizar sala:", error);
        }
    }

    static async adicionarHorario(idSala, dia, inicio, qtdAulas, idTurma) {
        const sala = await this.getSala(idSala);
        if (!sala) return;

        if (!sala.horarios[dia]) sala.horarios[dia] = [];

        let [hora, minuto] = inicio.split(':').map(Number);
        for (let i = 0; i < qtdAulas; i++) {

            let fimMinuto = minuto + 45;
            let fimHora = hora + Math.floor(fimMinuto / 60);
            fimMinuto %= 60;

            sala.horarios[dia].push({
                inicio: `${hora}:${minuto.toString().padStart(2, '0')}`,
                fim: `${fimHora}:${fimMinuto.toString().padStart(2, '0')}`,
                turma: idTurma
            });

            hora = fimHora;
            minuto = fimMinuto;

        }

        await this.atualizarSala(idSala, sala);
    }


    static async excluirHorario(idSala, dia, turma) {
        console.log("sala.escluirHorario()" + idSala)
        const sala = await this.getSala(idSala);
        console.log(sala)

        if (!sala || !sala.horarios[dia]) {
            console.log("NÃO ACHEI A SALA");
            return;
        }

        // Remove o horário desejado
        sala.horarios[dia] = sala.horarios[dia].filter(h => h.turma != turma);
        console.log(sala.horarios[dia])
        // Se o dia ficar sem horários, mantemos o array vazio em vez de deletar a chave
        if (sala.horarios[dia].length === 0) {
            sala.horarios[dia] = [];
        }

        await this.atualizarSala(idSala, sala);
    }


    static async alterarHorario(idSala, dia, novosDados) {
        const sala = await this.getSala(idSala);
        if (!sala || !sala.horarios[dia]) return;

        const horario = sala.horarios[dia].find(h => h.inicio === novosDados.antigoInicio);
        if (!horario) return;

        Object.assign(horario, novosDados);
        await this.atualizarSala(idSala, sala);
    }
}

class Turma {
    static async criarTurma(id, nome, qtdAlunos, horarioAlmoco) {
        try {
            const turmaDuplicada = await this.getTurma(id)
            if (turmaDuplicada) { console.error(`A turma ${id} já existe.`); return [false, `A turma ${id} já existe.`]; }


            await fetch(TURMAS_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, nome, qtdAlunos, horarioAlmoco, horarios: {} }),
            });
            console.log(`Turma ${this.id} criada com sucesso!`);
        } catch (error) {
            console.error("Erro ao criar turma:", error);
        }
    }

    static async getTurma(id) {
        try {
            const response = await fetch(`${TURMAS_URL}/${id}`);
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar turma:", error);
            return null;
        }
    }

    static async getTurmas() {
        try {
            const response = await fetch(`${TURMAS_URL}`);
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar turmas:", error);
            return null;
        }
    }

    static async atualizarTurma(id, novosDados) {
        try {
            await fetch(`${TURMAS_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novosDados),
            });
            console.log(`Turma ${id} atualizada com sucesso!`);
        } catch (error) {
            console.error("Erro ao atualizar turma:", error);
        }
    }

    static async deletarTurma(id) {
        try {
            const turma = await Turma.getTurma(id)
            const horarios = turma.horarios
            
            if (JSON.stringify(horarios) !== '{}') { 
                horarios.forEach(async h =>{
                    await Sala.excluirHorario(h.local, h.dia, id);
                })
            }
            await fetch(`${TURMAS_URL}/${id}`, { method: "DELETE", })
            return [true, `Turma ${id} deletada`]
        } catch (error) {
            console.error("Erro ao apagar turma:", error);

        }
    }

    static async adicionarHorario(idTurma, dia, inicio, qtdAulas, disciplina, professor, local) {
        // Calcula horário de término
        const horarioFim = calcularHorarioFim(inicio, qtdAulas);

        // Obtém a turma
        const turma = await this.getTurma(idTurma);
        if (!turma) return [false, `Turma ${idTurma} não encontrada`];

        if (!turma.horarios[dia]) turma.horarios[dia] = [];

        // Converte horários para minutos para facilitar comparação
        const inicioNovo = converterParaMinutos(inicio);
        const fimNovo = converterParaMinutos(horarioFim);

        // Verifica se há sobreposição com os horários já cadastrados na turma
        const conflitoTurma = turma.horarios[dia].some(({ inicio, fim }) => {
            const inicioExistente = converterParaMinutos(inicio);
            const fimExistente = converterParaMinutos(fim);

            return (inicioNovo < fimExistente && fimNovo > inicioExistente);
        });

        if (conflitoTurma) {
            console.error(`A turma já tem uma aula nesse horário.`);
            return [false, `A turma já tem uma aula nesse horário.`];
        }

        // Verifica se a sala está disponível
        const sala = await Sala.getSala(local);

        const conflitoSala = sala.horarios[dia]?.some(({ inicio, fim }) => {
            const inicioExistente = converterParaMinutos(inicio);
            const fimExistente = converterParaMinutos(fim);

            return (inicioNovo < fimExistente && fimNovo > inicioExistente);
        });

        if (conflitoSala) {
            console.error(`Sala ${sala.nome}} já está ocupada nesse período.`);
            return [false, `Sala ${sala.nome} já está ocupada nesse período.`];
        }

        // Cria o novo horário
        const calcularPeriodo = h => {
            const [horas, minutos] = h.split(':').map(Number); // Separa as horas e minutos e converte para números
            const horaAtual = horas * 60 + minutos; // Converte o horário para minutos

            const inicioManha = 12 * 60; // 12:00 em minutos
            const fimTarde = 19 * 60; // 19:00 em minutos

            if (horaAtual < inicioManha) {
                return 'manhã';
            } else if (horaAtual < fimTarde) {
                return 'tarde';
            } else {
                return 'noite';
            }
        };

        const periodo = calcularPeriodo(inicio); // Teste com a hora '11:30'
        const novoHorario = { periodo, inicio, fim: horarioFim, qtdAulas, disciplina, professor, local };
        turma.horarios[dia].push(novoHorario);

        await this.atualizarTurma(idTurma, turma);
        await Sala.adicionarHorario(local, dia, inicio, qtdAulas, idTurma);

        return [true, `Horário adicionado com sucesso.`];
    }

    static async excluirHorario(idTurma, dia, inicio) {
        const turma = await this.getTurma(idTurma);
        if (!turma || !turma.horarios[dia]) return [false, `Turma ${idTurma} não encontrada`];
        
        const horarioExcluir = turma.horarios[dia].find(h => h.inicio == inicio);
        if (!horarioExcluir) return [false, `Horário ${inicio} não encontrado`];
        
        const salaDesocupar = horarioExcluir.local
        
        turma.horarios[dia] = turma.horarios[dia].filter(h => h.inicio !== inicio);
        if (turma.horarios[dia].length === 0) delete turma.horarios[dia];
        
        await this.atualizarTurma(idTurma, turma);
        await Sala.excluirHorario(salaDesocupar, dia, idTurma);

        return [true, `Horário da turma ${idTurma} de ${dia} ${inicio} foi excluido, e a sala ${salaDesocupar} desocupada.`]
    }


    static async alterarHorario(idTurma, dia, novosDados) {
        const turma = await this.getTurma(idTurma);
        if (!turma || !turma.horarios[dia]) return [false, `Turma ${idTurma} não encontrada`];

        const horario = turma.horarios[dia].find(h => h.inicio === novosDados.inicio || h.inicio === novosDados.antigoInicio);
        if (!horario) return [false, `Horário não encontrado`];

        Object.assign(horario, novosDados);
        await this.atualizarTurma(idTurma, turma);
        await Sala.alterarHorario(horario.local, dia, novosDados);
    }
}

// Criando todas as salas

export async function criarSalas() {
    const salas = [
        new Sala('ofic-eletricas-1-2025', 'Oficina INSTALAÇÕES ELETRICAS 1 2025'),
        new Sala('ofic-eletricas-2-2025', 'Oficina INSTALAÇÕES ELETRICAS 2 2025'),
        new Sala('lab-maquinas-2025', 'LABORATORIO DE MÁQUINAS 2025'),
        new Sala('lab-clp-2025-1', 'Laborátorio CLP 2025'),
        new Sala('lab-eletronica', 'Laborátorio ELETRÔNICA'),
        new Sala('lab-clp-2025-2', 'Laborátorio CLP 2025'),
        new Sala('lab-automacao-2025', 'Laboratório de Automação Predial - 2025'),
        new Sala('lab-mecatronica-robo', 'Lab Mecatronica Robo'),
        new Sala('lab-sensores-clp-2025', 'Laboratorio Sensores CLP - 2025'),
        new Sala('auditorio', 'AUDITORIO'),
        new Sala('sala-aula-1', 'Sala de Aula 1'),
        new Sala('sala-aula-2-2025', 'Sala de Aula 2 - 2025'),
        new Sala('sala-aula-3', 'Sala de Aula 3'),
        new Sala('sala-aula-4', 'Sala de Aula 4'),
        new Sala('sala-aula-5', 'Sala de Aula 5'),
        new Sala('sala-aula-6', 'Sala de Aula 6'),
        new Sala('ofic-mecanica-1', 'Oficina Mecânica - Setor 1'),
        new Sala('ofic-mecanica-2', 'Oficina Mecânica - Setor 2'),
        new Sala('ofic-cnc-maquinas', 'Oficina de CNC - Maquinas'),
        new Sala('ofic-manutencao-2025', 'OFICINA MANUTENÇÃO -2025'),
        new Sala('ofic-cnc-mecatronica', 'Oficina de CNC - Mecatronica'),
        new Sala('ofic-soldagem', 'Oficina de Soldagem'),
        new Sala('sala-aula-28-metrologia', 'Sala de Aula 28 - Metrologia'),
        new Sala('lab-hidraulica-29-2025', 'Laboratorio Hidraulica- Sala 29 -2025'),
        new Sala('lab-pneumatica-30', 'Laboratorio Pneumatica - Sala 30'),
        new Sala('lab-1-piso-b-2025', 'LABORATÓRIO 1 - PISO SUPERIOR B 2025'),
        new Sala('lab-programacao-1-2025', 'LABORATÓRIO PROGRAMAÇÃO 1 2025'),
        new Sala('lab-redes-2025', 'LABORATÓRIO REDES 2025'),
        new Sala('lab-cad-inf-1-2025', 'Laboratorio CAD/INF 1 2025'),
        new Sala('lab-cam-inf-2', 'Laboratorio CAM/INF- 2'),
        new Sala('new-lab-sala-7-2025', 'NEW LAB SALA 7 2025')
    ];

    salas.forEach(sala => sala.salvarNoBanco());
}

export { Turma, Sala };