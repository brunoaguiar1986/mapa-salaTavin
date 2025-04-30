import { Turma, Sala } from '../modules/Turmas.js'

// Expulsa usuários não logados
const token = localStorage.getItem('token');
if (!token || token !== 'adm') {
    localStorage.clear()
    window.location.href = '../index.html';
}



//Adicionar horários / aulas a uma turma.
// Carregando as options do select
const selectSala = document.getElementById('select-sala');

(async () => {
    const salas = await Sala.getSalas()
    for (let i = 0; i < salas.length; i++) {
        const option = document.createElement('option');
        option.value = salas[i].id;
        option.text = salas[i].nome;
        selectSala.appendChild(option);
    }
    
    
    
    const turmas = await Turma.getTurmas();
    
    const selects = document.querySelectorAll('.select-turma');
    selects.forEach(select => {
        const optionDefault = document.createElement('option');
        optionDefault.textContent = "Escolha uma turma"
        select.appendChild(optionDefault)

        turmas.forEach(turma => {
            // Selecione todos os elementos com a classe 'select-turma'
            
            // Crie a opção para cada turma
            const option = document.createElement('option');
            option.textContent = turma.nome;  // Nome da turma
            option.value = turma.id;          // ID da turma
            
            // Adicione a opção ao select
            select.appendChild(option);
        });
    });
    
    
    // Função para gerar horários de 15 em 15 minutos
    function gerarHorarios(inicio, fim) {
        const horarios = [];
        let horaAtual = inicio;
        
        while (horaAtual <= fim) {
            // Extraindo horas e minutos de horaAtual
            const horas = Math.floor(horaAtual / 100);  // Dividindo por 100 para obter a hora
            let minutos = horaAtual % 100;              // Obtendo os minutos (resto da divisão por 100)
            
            // Adicionando 15 minutos
            minutos += 15;
            
            // Se minutos atingirem 60 ou mais, ajusta para a próxima hora
            if (minutos >= 60) {
                minutos -= 60;   // Subtrai 60 para ajustar os minutos
                horaAtual = (horas + 1) * 100;  // Incrementa a hora
            } else {
                horaAtual = horas * 100 + minutos;  // Combina horas e minutos no formato HHMM
            }
            
            // Formata a hora e minutos como "HH:MM"
            const horaFormatada = horaAtual.toString().padStart(4, '0');
            const horaDisplay = `${horaFormatada.slice(0, 2)}:${horaFormatada.slice(2)}`;
            horarios.push(horaDisplay);
        }
        
        return horarios;
    }
    
    // Gerando horários de 00:00 até 23:45
    const horarios = gerarHorarios(645, 2300);
    
    // Selecionando todos os selects de classe 'select-horario'
    const selectsHorario = document.querySelectorAll('.select-horario');

    selectsHorario.forEach(select => {
        horarios.forEach(horario => {
            // Criando a opção
            const option = document.createElement('option');
            option.textContent = horario;  // Texto da opção (ex: 08:00, 08:15, ...)
            option.value = horario;        // Valor da opção (pode ser o próprio horário)
            
            // Adiciona a opção ao select
            select.appendChild(option);
        });
    });
    
})()

// Criando uma turma
const formCriar = document.getElementById('form-turma-post');
formCriar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(formCriar);
    const id = formData.get("id").trim();
    const nome = formData.get("nome").trim();
    const qtd = parseInt(formData.get("qtd").trim());
    const horarioAlmoco = formData.get("horarioAlmoco")
    // Criando a turma
    
    const [criado, resposta] = await Turma.criarTurma(id, nome, qtd, horarioAlmoco);
    alert(resposta)
});

//Apagar Turma

const formExcluirTurma = document.getElementById("form-turma-delete")

formExcluirTurma.addEventListener("submit", async (e) =>{
    e.preventDefault()
    const formData = new FormData(formExcluirTurma);
    const [deletado, resposta] = await Turma.deletarTurma(formData.get("id"))
    alert(resposta)
})


const formHorarios = document.getElementById("form-horarios-post")
formHorarios.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(formHorarios)
    const turmaId = formData.get("id").trim()
    const dia = formData.get("dia").trim()
    const qtdAulas = formData.get("qtd-aulas").trim()
    const horarioInicio = formData.get("inicio").trim()
    const disciplina = formData.get("disciplina").trim()
    const professor = formData.get("professor").trim()
    const sala = formData.get("sala").trim()
    
    const [registrado, mensagem] = await Turma.adicionarHorario(turmaId, dia, horarioInicio, qtdAulas, disciplina, professor, sala)
    alert(mensagem)
    
})


// Excluindo um horário
const formExcluir = document.getElementById("form-horarios-excluir");
formExcluir.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const formData = new FormData(formExcluir)
    const inicio = formData.get("inicio").trim()
    const turmaId = formData.get("id").trim()
    const dia = formData.get("dia").trim()
    
    const [excluido, resposta] = await Turma.excluirHorario(turmaId, dia, inicio)
    alert(resposta)
})

// Editar turma

const formEditar = document.getElementById("form-turma-update")
const selectturmaEditar = document.getElementById("editar_selectTurma")

selectturmaEditar.addEventListener("change", async (eventSelect)=>{
    const idTurmaEditar = eventSelect.target.value;
    const turma = await Turma.getTurma(idTurmaEditar)

    const inputNome = document.getElementById('editar_nome')
    const inputQtdAlunos = document.getElementById('editar_qtdAlunos')
    const selectHorarioAlmoco = document.querySelector('select[name="editar_horarioAlmoco"]');

    inputNome.value = turma.nome;
    inputQtdAlunos.value = turma.qtdAlunos;
    selectHorarioAlmoco.value = turma.horarioAlmoco; // Atribuindo diretamente o valor


    formEditar.addEventListener("submit", async (e)=>{
        turma.nome = inputNome.value.trim()
        turma.qtdAlunos = parseInt(inputQtdAlunos.value)
        turma.horarioAlmoco = selectHorarioAlmoco.value
        const [atualizado, resposta] = await Turma.atualizarTurma(idTurmaEditar, turma)
        alert(resposta)
    })

})
