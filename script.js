// VARIÁVEIS GLOBAIS
let tipoSolicitacao = "Folga";
let gestorSelecionado = "eliane.ebarbosa@mercadolivre.com";
let dataAtual = new Date(2026, 0, 1);
let solicitacoesUsuario = [];
let feriadosDoMes = [];
let colaboradoresPorData = {};
let datasComLimite = [];

// ELEMENTOS DO DOM
const elementos = {
    // Formulário
    tipoFolga: document.getElementById('tipo-folga'),
    tipoFerias: document.getElementById('tipo-ferias'),
    gestorEliane: document.getElementById('gestor-eliane'),
    gestorGabriel: document.getElementById('gestor-gabriel'),
    matriculaInput: document.getElementById('matricula'),
    nomeInput: document.getElementById('nome'),
    dataInicialInput: document.getElementById('data-inicial'),
    dataFinalInput: document.getElementById('data-final'),
    btnSolicitar: document.getElementById('btn-solicitar'),
    btnLimpar: document.getElementById('btn-limpar'),
    areaCancelarEdicao: document.getElementById('area-cancelar-edicao'),
    
    // Busca
    btnBuscar: document.getElementById('btn-buscar'),
    buscaSolicitacaoInput: document.getElementById('busca-solicitacao'),
    tabelaSolicitacoes: document.getElementById('tabela-solicitacoes'),
    corpoTabelaSolicitacoes: document.getElementById('corpo-tabela-solicitacoes'),
    semSolicitacoes: document.getElementById('sem-solicitacoes'),
    
    // Calendário
    mesAtualElement: document.getElementById('mes-atual'),
    calendarioElement: document.getElementById('calendario'),
    btnMesAnterior: document.getElementById('btn-mes-anterior'),
    btnMesSeguinte: document.getElementById('btn-mes-seguinte'),
    listaFeriados: document.getElementById('lista-feriados'),
    feriadosMes: document.getElementById('feriados-mes'),
    
    // Popups
    popupConfirmacao: document.getElementById('popup-confirmacao'),
    popupSucesso: document.getElementById('popup-sucesso'),
    popupLimite: document.getElementById('popup-limite'),
    popupDetalhes: document.getElementById('popup-detalhes'),
    popupSummary: document.getElementById('popup-summary'),
    popupError: document.getElementById('popup-error'),
    popupLimiteConteudo: document.getElementById('popup-limite-conteudo'),
    popupDetalhesConteudo: document.getElementById('popup-detalhes-conteudo'),
    sucessoInfo: document.getElementById('sucesso-info'),
    btnCancelarPopup: document.getElementById('btn-cancelar-popup'),
    btnConfirmarEnvio: document.getElementById('btn-confirmar-envio'),
    btnFecharPopup: document.getElementById('btn-fechar-popup'),
    btnFecharLimite: document.getElementById('btn-fechar-limite'),
    btnFecharDetalhes: document.getElementById('btn-fechar-detalhes')
};

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    inicializarSistema();
});

// FUNÇÃO DE INICIALIZAÇÃO
function inicializarSistema() {
    configurarDatas();
    configurarEventos();
    carregarCalendario();
}

// CONFIGURAR DATAS MÍNIMAS/MAXIMAS
function configurarDatas() {
    const hoje = new Date(2026, 0, 1);
    const dataMinima = new Date(hoje);
    dataMinima.setDate(dataMinima.getDate() + 2);
    
    elementos.dataInicialInput.min = formatarDataParaInput(dataMinima);
    elementos.dataFinalInput.min = formatarDataParaInput(dataMinima);
    
    const dataMaxima = new Date(hoje);
    dataMaxima.setFullYear(dataMaxima.getFullYear() + 1);
    
    elementos.dataInicialInput.max = formatarDataParaInput(dataMaxima);
    elementos.dataFinalInput.max = formatarDataParaInput(dataMaxima);
}

// CONFIGURAR TODOS OS EVENTOS
function configurarEventos() {
    // Seleção do tipo de solicitação
    elementos.tipoFolga.addEventListener('click', () => selecionarTipo('Folga'));
    elementos.tipoFerias.addEventListener('click', () => selecionarTipo('Férias'));
    
    // Seleção do gestor
    elementos.gestorEliane.addEventListener('click', () => selecionarGestor('eliane'));
    elementos.gestorGabriel.addEventListener('click', () => selecionarGestor('gabriel'));
    
    // Validação de datas
    elementos.dataInicialInput.addEventListener('change', validarDataInicial);
    elementos.dataFinalInput.addEventListener('change', validarDataFinal);
    
    // Botões principais
    elementos.btnSolicitar.addEventListener('click', validarEAbrirPopup);
    elementos.btnLimpar.addEventListener('click', limparFormulario);
    elementos.btnBuscar.addEventListener('click', buscarSolicitacoes);
    
    // Busca com Enter
    elementos.buscaSolicitacaoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarSolicitacoes();
    });
    
    // Navegação do calendário
    elementos.btnMesAnterior.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() - 1);
        carregarCalendario();
    });
    
    elementos.btnMesSeguinte.addEventListener('click', () => {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        carregarCalendario();
    });
    
    // Eventos dos popups
    elementos.btnCancelarPopup.addEventListener('click', () => {
        elementos.popupConfirmacao.classList.remove('active');
    });
    
    elementos.btnConfirmarEnvio.addEventListener('click', enviarSolicitacao);
    
    elementos.btnFecharPopup.addEventListener('click', () => {
        elementos.popupSucesso.classList.remove('active');
    });
    
    elementos.btnFecharLimite.addEventListener('click', () => {
        elementos.popupLimite.classList.remove('active');
    });
    
    elementos.btnFecharDetalhes.addEventListener('click', () => {
        elementos.popupDetalhes.classList.remove('active');
    });
    
    // Fechar popups clicando fora
    [elementos.popupConfirmacao, elementos.popupSucesso, elementos.popupLimite, elementos.popupDetalhes].forEach(popup => {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.classList.remove('active');
            }
        });
    });
}

// SELEÇÃO DO TIPO DE SOLICITAÇÃO
function selecionarTipo(tipo) {
    tipoSolicitacao = tipo;
    elementos.tipoFolga.classList.toggle('ativo', tipo === 'Folga');
    elementos.tipoFerias.classList.toggle('ativo', tipo === 'Férias');
    
    if (elementos.dataInicialInput.value && elementos.dataFinalInput.value) {
        ajustarPeriodoPorTipo();
    }
}

// SELEÇÃO DO GESTOR
function selecionarGestor(gestor) {
    elementos.gestorEliane.classList.toggle('ativo', gestor === 'eliane');
    elementos.gestorGabriel.classList.toggle('ativo', gestor === 'gabriel');
    
    if (gestor === 'eliane') {
        gestorSelecionado = 'eliane.ebarbosa@mercadolivre.com';
    } else {
        gestorSelecionado = 'gabriel.gpaiva@mercadolivre.com';
    }
    
    // Recarregar calendário com base no gestor selecionado
    carregarCalendario();
}

// VALIDAÇÃO E ABRIR POPUP
function validarEAbrirPopup() {
    // Verificar se está em modo edição
    if (elementos.btnSolicitar.dataset.edicaoId) {
        atualizarSolicitacao(elementos.btnSolicitar.dataset.edicaoId);
        return;
    }
    
    if (!validarFormulario()) return;
    
    const solicitacao = {
        matricula: elementos.matriculaInput.value.trim(),
        nome: elementos.nomeInput.value.trim(),
        tipo: tipoSolicitacao,
        dataInicial: elementos.dataInicialInput.value,
        dataFinal: elementos.dataFinalInput.value,
        gestor: gestorSelecionado
    };
    
    // Verificar limite antes de abrir popup
    verificarLimitePeriodo(solicitacao);
}

// VERIFICAR LIMITE NO PERÍODO
function verificarLimitePeriodo(solicitacao) {
    // Simular chamada ao Google Apps Script
    const resultado = Database.validarLimitePeriodo(solicitacao);
    
    if (resultado.excedido) {
        mostrarPopupLimite(resultado);
    } else {
        mostrarPopupConfirmacao(solicitacao);
    }
}

// MOSTRAR POPUP DE LIMITE EXCEDIDO
function mostrarPopupLimite(resultado) {
    let html = `
        <p style="margin-bottom: 15px; font-size: 14px;">
            <i class="fas fa-exclamation-triangle"></i> 
            <strong>Limite excedido!</strong> O período solicitado excede o limite de 3 colaboradores por dia:
        </p>
        <div class="lista-colaboradores">
    `;
    
    resultado.diasExcedidos.forEach(dia => {
        const dataFormatada = new Date(dia.data).toLocaleDateString('pt-BR');
        html += `
            <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #dee2e6;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <strong style="color: #dc3545;">${dataFormatada}</strong>
                    <span style="background-color: #dc3545; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">
                        ${dia.limite}/3
                    </span>
                </div>
                <div style="font-size: 12px; color: #666; margin-left: 10px;">
                    ${dia.colaboradores.map((c, i) => `${i+1}. ${c.nome} (${c.tipo})`).join('<br>')}
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="warning-message" style="margin-top: 15px;">
            <i class="fas fa-lightbulb"></i> 
            <strong>Sugestões:</strong><br>
            1. Escolha outro período<br>
            2. Considere agendar em feriados (ilimitado)<br>
            3. Entre em contato com o Time de ID/EA para mais opções
        </div>
    `;
    
    elementos.popupLimiteConteudo.innerHTML = html;
    elementos.popupLimite.classList.add('active');
}

// MOSTRAR POPUP DE CONFIRMAÇÃO
function mostrarPopupConfirmacao(solicitacao) {
    const dataInicial = new Date(solicitacao.dataInicial);
    const dataFinal = new Date(solicitacao.dataFinal);
    const diffDias = calcularDiferencaDias(dataInicial, dataFinal);
    
    const feriadosNoPeriodo = verificarFeriadosNoPeriodo(dataInicial, dataFinal);
    
    elementos.popupSummary.innerHTML = `
        <div class="summary-item">
            <span class="summary-label">Matrícula:</span>
            <span class="summary-value">${solicitacao.matricula}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Nome:</span>
            <span class="summary-value">${solicitacao.nome}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Gestor:</span>
            <span class="summary-value">${solicitacao.gestor.split('@')[0]}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Tipo:</span>
            <span class="summary-value">${solicitacao.tipo}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Período:</span>
            <span class="summary-value">
                ${formatarDataParaExibicao(dataInicial)} a ${formatarDataParaExibicao(dataFinal)}
            </span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Duração:</span>
            <span class="summary-value">${diffDias} dias</span>
        </div>
        ${feriadosNoPeriodo.length > 0 ? `
        <div class="summary-item">
            <span class="summary-label">Feriados no período:</span>
            <span class="summary-value" style="color: #d32f2f;">
                ${feriadosNoPeriodo.length} feriado(s)
            </span>
        </div>
        ` : ''}
    `;
    
    elementos.popupError.innerHTML = '';
    elementos.popupError.style.display = 'none';
    elementos.popupConfirmacao.classList.add('active');
}

// ENVIAR SOLICITAÇÃO
function enviarSolicitacao() {
    const btnOriginal = elementos.btnConfirmarEnvio.innerHTML;
    elementos.btnConfirmarEnvio.innerHTML = '<span class="loading"></span> Enviando...';
    elementos.btnConfirmarEnvio.disabled = true;
    
    const solicitacao = {
        matricula: elementos.matriculaInput.value.trim(),
        nome: elementos.nomeInput.value.trim(),
        tipo: tipoSolicitacao,
        dataInicial: elementos.dataInicialInput.value,
        dataFinal: elementos.dataFinalInput.value,
        gestor: gestorSelecionado
    };
    
    // Simular envio
    setTimeout(() => {
        elementos.btnConfirmarEnvio.innerHTML = btnOriginal;
        elementos.btnConfirmarEnvio.disabled = false;
        
        const resposta = Database.salvarSolicitacao(solicitacao);
        
        if (resposta.success) {
            elementos.popupConfirmacao.classList.remove('active');
            
            // Calcular dados para exibição no popup de sucesso
            const dataInicial = new Date(solicitacao.dataInicial);
            const dataFinal = new Date(solicitacao.dataFinal);
            const diffDias = calcularDiferencaDias(dataInicial, dataFinal);
            const gestorNome = solicitacao.gestor.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase());
            
            elementos.sucessoInfo.innerHTML = `
                <div class="sucesso-item">
                    <span class="sucesso-label">ID da Solicitação:</span>
                    <span class="sucesso-valor">#${resposta.id}</span>
                </div>
                <div class="sucesso-item">
                    <span class="sucesso-label">Matrícula:</span>
                    <span class="sucesso-valor">${solicitacao.matricula}</span>
                </div>
                <div class="sucesso-item">
                    <span class="sucesso-label">Nome:</span>
                    <span class="sucesso-valor">${solicitacao.nome}</span>
                </div>
                <div class="sucesso-item">
                    <span class="sucesso-label">Gestor:</span>
                    <span class="sucesso-valor">${gestorNome}</span>
                </div>
                <div class="sucesso-item">
                    <span class="sucesso-label">Tipo:</span>
                    <span class="sucesso-valor">${solicitacao.tipo}</span>
                </div>
                <div class="sucesso-item">
                    <span class="sucesso-label">Período:</span>
                    <span class="sucesso-valor">
                        ${formatarDataParaExibicao(dataInicial)} a ${formatarDataParaExibicao(dataFinal)}
                    </span>
                </div>
                <div class="sucesso-item">
                    <span class="sucesso-label">Duração:</span>
                    <span class="sucesso-valor">${diffDias} dias</span>
                </div>
                <div class="sucesso-item">
                    <span class="sucesso-label">Status:</span>
                    <span class="sucesso-valor" style="color: #856404; background-color: #fff3cd; padding: 2px 8px; border-radius: 4px;">
                        PENDENTE DE APROVAÇÃO
                    </span>
                </div>
            `;
            
            elementos.popupSucesso.classList.add('active');
            
            limparFormulario();
            carregarCalendario();
            
            if (elementos.buscaSolicitacaoInput.value.trim() === solicitacao.matricula) {
                buscarSolicitacoes();
            }
        } else {
            elementos.popupError.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> ${resposta.message}
            `;
            elementos.popupError.style.display = 'block';
        }
    }, 1000);
}

// BUSCAR SOLICITAÇÕES DO USUÁRIO
function buscarSolicitacoes() {
    const matricula = elementos.buscaSolicitacaoInput.value.trim();
    
    if (!matricula) {
        alert('Por favor, digite sua matrícula para buscar.');
        return;
    }
    
    elementos.btnBuscar.innerHTML = '<span class="loading"></span> Buscando...';
    elementos.btnBuscar.disabled = true;
    
    solicitacoesUsuario = [];
    elementos.corpoTabelaSolicitacoes.innerHTML = '';
    elementos.tabelaSolicitacoes.classList.add('hidden');
    elementos.semSolicitacoes.classList.remove('hidden');
    elementos.semSolicitacoes.innerHTML = `
        <span class="loading"></span> Buscando solicitações...
    `;
    
    // Simular busca
    setTimeout(() => {
        elementos.btnBuscar.innerHTML = '<i class="fas fa-search"></i> Buscar';
        elementos.btnBuscar.disabled = false;
        
        solicitacoesUsuario = Database.buscarSolicitacoesPorMatricula(matricula);
        atualizarTabelaSolicitacoes();
    }, 800);
}

// ATUALIZAR TABELA DE SOLICITAÇÕES
function atualizarTabelaSolicitacoes() {
    elementos.corpoTabelaSolicitacoes.innerHTML = '';
    
    if (!solicitacoesUsuario || solicitacoesUsuario.length === 0) {
        elementos.tabelaSolicitacoes.classList.add('hidden');
        elementos.semSolicitacoes.classList.remove('hidden');
        elementos.semSolicitacoes.innerHTML = `
            <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; color: #ccc;"></i>
            <p>Nenhuma solicitação encontrada para a matrícula: <strong>${elementos.buscaSolicitacaoInput.value}</strong></p>
        `;
        return;
    }
    
    elementos.semSolicitacoes.classList.add('hidden');
    elementos.tabelaSolicitacoes.classList.remove('hidden');
    
    solicitacoesUsuario.forEach(solicitacao => {
        const linha = document.createElement('tr');
        
        let dataInicialFormatada = 'N/A';
        let dataFinalFormatada = 'N/A';
        let periodo = 'Período não informado';
        
        try {
            if (solicitacao.dataInicial) {
                const dataInicial = new Date(solicitacao.dataInicial);
                dataInicialFormatada = formatarDataParaExibicao(dataInicial);
            }
            
            if (solicitacao.dataFinal) {
                const dataFinal = new Date(solicitacao.dataFinal);
                dataFinalFormatada = formatarDataParaExibicao(dataFinal);
            }
            
            if (solicitacao.dataInicial && solicitacao.dataFinal) {
                periodo = `${dataInicialFormatada} a ${dataFinalFormatada}`;
            }
        } catch (e) {
            periodo = 'Erro ao formatar período';
        }
        
        // Determinar gestor
        let gestorNome = 'Não informado';
        if (solicitacao.gestor) {
            gestorNome = solicitacao.gestor.split(' ')[0];
        }
        
        // Determinar status
        let classeStatus = '';
        let iconeStatus = '';
        let statusTexto = solicitacao.status || 'N/A';
        
        switch(statusTexto.toUpperCase()) {
            case 'PENDENTE':
                classeStatus = 'status-pendente';
                iconeStatus = 'fa-clock';
                break;
            case 'APROVADO':
                classeStatus = 'status-aprovado';
                iconeStatus = 'fa-check-circle';
                break;
            case 'REJEITADO':
                classeStatus = 'status-rejeitado';
                iconeStatus = 'fa-times-circle';
                break;
            default:
                classeStatus = 'status-pendente';
                iconeStatus = 'fa-question-circle';
        }
        
        // Resolução (truncada se muito longa)
        let resolucao = solicitacao.resolucao || 'N/A';
        if (resolucao.length > 30) {
            resolucao = resolucao.substring(0, 30) + '...';
        }
        
        // Ações (apenas para pendentes)
        let acoesHTML = '';
        if (statusTexto.toUpperCase() === 'PENDENTE') {
            acoesHTML = `
                <button class="btn-acao btn-editar" onclick="editarSolicitacao('${solicitacao.id}', '${solicitacao.emailGestor}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-acao btn-excluir" onclick="excluirSolicitacao('${solicitacao.id}', '${solicitacao.emailGestor}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            `;
        } else {
            acoesHTML = '<span style="color: #777; font-style: italic;">Nenhuma ação</span>';
        }
        
        linha.innerHTML = `
            <td><strong>${solicitacao.tipo || 'Não informado'}</strong></td>
            <td>${periodo}</td>
            <td>${solicitacao.quantidadeDias || 'N/A'}</td>
            <td>
                <span class="status ${classeStatus}">
                    <i class="fas ${iconeStatus}"></i> ${statusTexto}
                </span>
            </td>
            <td title="${solicitacao.resolucao || 'Sem resolução'}">${resolucao}</td>
            <td class="acoes">
                <button class="btn-acao btn-editar" onclick="mostrarDetalhesSolicitacao('${solicitacao.id}')" title="Ver detalhes">
                    <i class="fas fa-eye"></i> Detalhes
                </button>
                ${acoesHTML}
            </td>
        `;
        
        elementos.corpoTabelaSolicitacoes.appendChild(linha);
    });
}

// MOSTRAR DETALHES DA SOLICITAÇÃO
window.mostrarDetalhesSolicitacao = function(id) {
    const solicitacao = solicitacoesUsuario.find(s => s.id.toString() === id.toString());
    
    if (!solicitacao) {
        alert('Solicitação não encontrada!');
        return;
    }
    
    let dataAprovacao = solicitacao.dataAprovacao || 'Não aprovada ainda';
    let resolucao = solicitacao.resolucao || 'Sem resolução registrada';
    
    let html = `
        <div class="detalhes-solicitacao">
            <div class="info-detalhes">
                <span class="info-detalhes-label">ID:</span>
                <span class="info-detalhes-valor">${solicitacao.id}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Matrícula:</span>
                <span class="info-detalhes-valor">${solicitacao.matricula}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Nome:</span>
                    <span class="info-detalhes-valor">${solicitacao.nome}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Tipo:</span>
                <span class="info-detalhes-valor">${solicitacao.tipo}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Período:</span>
                <span class="info-detalhes-valor">${solicitacao.dataInicial} a ${solicitacao.dataFinal}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Dias:</span>
                <span class="info-detalhes-valor">${solicitacao.quantidadeDias}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Gestor:</span>
                <span class="info-detalhes-valor">${solicitacao.gestor}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Status:</span>
                <span class="info-detalhes-valor">
                    <span class="status ${solicitacao.status === 'APROVADO' ? 'status-aprovado' : solicitacao.status === 'REJEITADO' ? 'status-rejeitado' : 'status-pendente'}">
                        ${solicitacao.status}
                    </span>
                </span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Data Solicitação:</span>
                <span class="info-detalhes-valor">${solicitacao.dataSolicitacao || 'N/A'}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Data Aprovação:</span>
                <span class="info-detalhes-valor">${dataAprovacao}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Resolução:</span>
                <span class="info-detalhes-valor">${resolucao}</span>
            </div>
            <div class="info-detalhes">
                <span class="info-detalhes-label">Última Atualização:</span>
                <span class="info-detalhes-valor">${solicitacao.ultimaAtualizacao || 'N/A'}</span>
            </div>
        </div>
    `;
    
    elementos.popupDetalhesConteudo.innerHTML = html;
    elementos.popupDetalhes.classList.add('active');
};

// EDITAR SOLICITAÇÃO
window.editarSolicitacao = function(id, emailGestor) {
    const solicitacao = solicitacoesUsuario.find(s => s.id.toString() === id.toString() && s.emailGestor === emailGestor);
    
    if (!solicitacao) {
        alert('Solicitação não encontrada!');
        return;
    }
    
    // Preencher formulário
    elementos.matriculaInput.value = solicitacao.matricula || '';
    elementos.nomeInput.value = solicitacao.nome || '';
    
    // Selecionar tipo
    if (solicitacao.tipo === 'Férias') {
        selecionarTipo('Férias');
    } else {
        selecionarTipo('Folga');
    }
    
    // Selecionar gestor
    if (solicitacao.emailGestor && solicitacao.emailGestor.includes('gabriel')) {
        selecionarGestor('gabriel');
    } else {
        selecionarGestor('eliane');
    }
    
    // Formatar datas corretamente
    elementos.dataInicialInput.value = formatarDataParaInput(solicitacao.dataInicial);
    elementos.dataFinalInput.value = formatarDataParaInput(solicitacao.dataFinal);
    
    // Alterar botão para edição
    elementos.btnSolicitar.innerHTML = '<i class="fas fa-save"></i> Atualizar Solicitação';
    elementos.btnSolicitar.dataset.edicaoId = id;
    elementos.btnSolicitar.dataset.emailGestor = emailGestor;
    
    // Adicionar botão cancelar edição
    elementos.areaCancelarEdicao.innerHTML = `
        <button class="btn-cancelar-edicao" id="btn-cancelar-edicao">
            <i class="fas fa-times"></i> Cancelar Edição
        </button>
    `;
    
    document.getElementById('btn-cancelar-edicao').addEventListener('click', function() {
        limparFormulario();
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert('Solicitação carregada para edição. Ajuste os dados e clique em "Atualizar Solicitação".');
};

// ATUALIZAR SOLICITAÇÃO
function atualizarSolicitacao(id) {
    if (!validarFormulario()) return;
    
    const emailGestorAtual = elementos.btnSolicitar.dataset.emailGestor;
    
    const dadosAtualizados = {
        matricula: elementos.matriculaInput.value.trim(),
        nome: elementos.nomeInput.value.trim(),
        tipo: tipoSolicitacao,
        dataInicial: elementos.dataInicialInput.value,
        dataFinal: elementos.dataFinalInput.value,
        gestor: gestorSelecionado
    };
    
    const btnOriginal = elementos.btnSolicitar.innerHTML;
    elementos.btnSolicitar.innerHTML = '<span class="loading"></span> Atualizando...';
    
    // Simular atualização
    setTimeout(() => {
        elementos.btnSolicitar.innerHTML = btnOriginal;
        
        const resposta = Database.editarSolicitacao(id, dadosAtualizados, emailGestorAtual);
        
        if (resposta.success) {
            alert(resposta.message);
            
            // Restaurar botão original
            elementos.btnSolicitar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitação';
            delete elementos.btnSolicitar.dataset.edicaoId;
            delete elementos.btnSolicitar.dataset.emailGestor;
            
            // Limpar área de cancelar edição
            elementos.areaCancelarEdicao.innerHTML = '';
            
            limparFormulario();
            buscarSolicitacoes();
            carregarCalendario();
        } else {
            alert(resposta.message);
        }
    }, 800);
}

// EXCLUIR SOLICITAÇÃO
window.excluirSolicitacao = function(id, emailGestor) {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?\n\nEsta ação não pode ser desfeita.')) {
        return;
    }
    
    const resposta = Database.excluirSolicitacao(id, emailGestor);
    
    if (resposta.success) {
        alert(resposta.message);
        buscarSolicitacoes();
        carregarCalendario();
    } else {
        alert(resposta.message);
    }
};

// LIMPAR FORMULÁRIO
function limparFormulario() {
    elementos.matriculaInput.value = '';
    elementos.nomeInput.value = '';
    selecionarTipo('Folga');
    selecionarGestor('eliane');
    
    elementos.dataInicialInput.value = '';
    elementos.dataFinalInput.value = '';
    
    elementos.btnSolicitar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitação';
    delete elementos.btnSolicitar.dataset.edicaoId;
    delete elementos.btnSolicitar.dataset.emailGestor;
    
    // Limpar área de cancelar edição
    elementos.areaCancelarEdicao.innerHTML = '';
}

// VALIDAÇÃO DE DATA INICIAL
function validarDataInicial() {
    const dataInicial = new Date(elementos.dataInicialInput.value);
    const dataFinal = new Date(elementos.dataFinalInput.value);
    const hoje = new Date(2026, 0, 1);
    
    if (!elementos.dataInicialInput.value) return;
    
    // Verificar se é pelo menos 2 dias úteis após hoje
    const diffDias = Math.ceil((dataInicial - hoje) / (1000 * 60 * 60 * 24));
    
    if (diffDias < 3) {
        alert('A solicitação deve ter no mínimo 2 dias úteis de antecedência.');
        elementos.dataInicialInput.value = '';
        return;
    }
    
    // Se já tiver data final, verificar se é maior que a inicial
    if (elementos.dataFinalInput.value && dataFinal < dataInicial) {
        alert('A data final não pode ser anterior à data inicial.');
        elementos.dataFinalInput.value = '';
    }
    
    // Ajustar período baseado no tipo
    if (elementos.dataFinalInput.value) {
        ajustarPeriodoPorTipo();
    }
}

// VALIDAÇÃO DE DATA FINAL
function validarDataFinal() {
    if (!elementos.dataInicialInput.value) {
        alert('Selecione a data inicial primeiro.');
        elementos.dataFinalInput.value = '';
        return;
    }
    
    const dataInicial = new Date(elementos.dataInicialInput.value);
    const dataFinal = new Date(elementos.dataFinalInput.value);
    
    if (dataFinal < dataInicial) {
        alert('A data final não pode ser anterior à data inicial.');
        elementos.dataFinalInput.value = '';
        return;
    }
    
    // Ajustar período baseado no tipo
    ajustarPeriodoPorTipo();
}

// AJUSTAR PERÍODO POR TIPO
function ajustarPeriodoPorTipo() {
    const dataInicial = new Date(elementos.dataInicialInput.value);
    const dataFinal = new Date(elementos.dataFinalInput.value);
    
    if (tipoSolicitacao === 'Folga') {
        // Máximo 7 dias para folga
        const diffDias = calcularDiferencaDias(dataInicial, dataFinal);
        if (diffDias > 7) {
            alert('Para Folgas, o período máximo é de 7 dias. Ajustando...');
            const novaDataFinal = new Date(dataInicial);
            novaDataFinal.setDate(novaDataFinal.getDate() + 6);
            elementos.dataFinalInput.value = formatarDataParaInput(novaDataFinal);
        }
    } else {
        // Mínimo 5 dias para férias
        const diffDias = calcularDiferencaDias(dataInicial, dataFinal);
        if (diffDias < 5) {
            alert('Para Férias, o período mínimo é de 5 dias. Ajustando...');
            const novaDataFinal = new Date(dataInicial);
            novaDataFinal.setDate(novaDataFinal.getDate() + 4);
            elementos.dataFinalInput.value = formatarDataParaInput(novaDataFinal);
        }
    }
}

// VALIDAÇÃO DE FORMULÁRIO
function validarFormulario() {
    if (!elementos.matriculaInput.value.trim()) {
        alert('Por favor, preencha sua matrícula.');
        elementos.matriculaInput.focus();
        return false;
    }
    
    if (!elementos.nomeInput.value.trim()) {
        alert('Por favor, preencha seu nome completo.');
        elementos.nomeInput.focus();
        return false;
    }
    
    if (!elementos.dataInicialInput.value) {
        alert('Por favor, selecione a data inicial.');
        elementos.dataInicialInput.focus();
        return false;
    }
    
    if (!elementos.dataFinalInput.value) {
        alert('Por favor, selecione a data final.');
        elementos.dataFinalInput.focus();
        return false;
    }
    
    const dataInicial = new Date(elementos.dataInicialInput.value);
    const hoje = new Date(2026, 0, 1);
    const diffDias = Math.ceil((dataInicial - hoje) / (1000 * 60 * 60 * 24));
    
    if (diffDias < 3) {
        alert('A solicitação deve ter no mínimo 2 dias úteis de antecedência.');
        return false;
    }
    
    return true;
}

// CARREGAR CALENDÁRIO COM FERIADOS
function carregarCalendario() {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    elementos.mesAtualElement.textContent = `${meses[mes]} ${ano}`;
    
    elementos.calendarioElement.innerHTML = '';
    
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diaDaSemana = primeiroDia.getDay();
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < diaDaSemana; i++) {
        const diaVazio = document.createElement('div');
        diaVazio.classList.add('dia');
        diaVazio.style.visibility = 'hidden';
        elementos.calendarioElement.appendChild(diaVazio);
    }
    
    // Carregar feriados do mês
    carregarFeriadosDoMes(ano, mes + 1);
    
    // Carregar colaboradores para cada dia
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const data = new Date(ano, mes, dia);
        criarDiaCalendario(data, dia);
    }
}

// CRIAR DIA NO CALENDÁRIO
function criarDiaCalendario(data, numeroDia) {
    const diaElement = document.createElement('div');
    diaElement.classList.add('dia');
    diaElement.textContent = numeroDia;
    
    const dataFormatada = formatarDataParaInput(data);
    
    // Verificar se é feriado
    const feriado = feriadosDoMes.find(f => f.data === dataFormatada);
    if (feriado) {
        if (feriado.tipo === 'Nacional') {
            diaElement.classList.add('dia-nacional');
            diaElement.title = `🏛️ ${feriado.nome} (Nacional)`;
        } else {
            diaElement.classList.add('dia-municipal');
            diaElement.title = `🏙️ ${feriado.nome} (Cajamar-SP)`;
        }
    }
    
    // Verificar se é final de semana
    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
        if (!feriado) {
            diaElement.classList.add('feriado');
            diaElement.title = '🏠 Final de semana';
        }
    }
    
    // Verificar se é dia atual (01/01/2026)
    if (data.getFullYear() === 2026 && data.getMonth() === 0 && data.getDate() === 1) {
        diaElement.classList.add('atual');
        diaElement.title = (diaElement.title ? diaElement.title + '\n' : '') + '📅 Dia atual';
    }
    
    // Carregar colaboradores deste dia
    carregarColaboradoresDoDia(dataFormatada, diaElement, feriado);
    
    // Adicionar evento de clique
    diaElement.addEventListener('click', function() {
        mostrarDetalhesDia(data, feriado);
    });
    
    elementos.calendarioElement.appendChild(diaElement);
}

// CARREGAR COLABORADORES DO DIA
function carregarColaboradoresDoDia(dataFormatada, diaElement, feriado) {
    const colaboradores = Database.getColaboradoresPorData(dataFormatada, gestorSelecionado);
    
    // Filtrar por gestor selecionado
    const colaboradoresFiltrados = colaboradores.filter(colab => {
        return colab.gestor.includes(gestorSelecionado.includes('eliane') ? 'Eliane' : 'Gabriel');
    });
    
    if (colaboradoresFiltrados.length > 0) {
        diaElement.classList.add('com-colaboradores');
        
        // Mostrar primeiro nome do primeiro colaborador
        if (colaboradoresFiltrados[0].nome) {
            const primeiroNome = colaboradoresFiltrados[0].nome.split(' ')[0];
            const nomeElement = document.createElement('div');
            nomeElement.className = 'nome-colaborador';
            nomeElement.textContent = primeiroNome;
            diaElement.appendChild(nomeElement);
            
            // Adicionar outros nomes como tooltip
            const outrosNomes = colaboradoresFiltrados.slice(1, 3).map(c => 
                c.nome.split(' ')[0]
            ).join(', ');
            
            if (outrosNomes) {
                diaElement.title = (diaElement.title ? diaElement.title + '\n\n' : '') + 
                                  `👥 Colaboradores: ${primeiroNome}, ${outrosNomes}`;
            } else {
                diaElement.title = (diaElement.title ? diaElement.title + '\n\n' : '') + 
                                  `👥 Colaborador: ${primeiroNome}`;
            }
        }
        
        // Adicionar contador
        const contador = document.createElement('div');
        contador.className = 'contador-dia';
        contador.textContent = colaboradoresFiltrados.length;
        diaElement.appendChild(contador);
        
        // Verificar se atingiu limite (apenas se não for feriado)
        if (colaboradoresFiltrados.length >= 3 && !feriado) {
            diaElement.classList.add('limite-atingido');
        }
    }
    
    colaboradoresPorData[dataFormatada] = colaboradoresFiltrados;
}

// MOSTRAR DETALHES DO DIA
function mostrarDetalhesDia(data, feriado) {
    const dataFormatada = formatarDataParaExibicao(data);
    const dataKey = formatarDataParaInput(data);
    const colaboradores = colaboradoresPorData[dataKey] || [];
    
    let mensagem = `📅 ${dataFormatada}\n\n`;
    
    if (feriado) {
        const icone = feriado.tipo === 'Nacional' ? '🏛️' : '🏙️';
        mensagem += `${icone} ${feriado.nome} (${feriado.tipo})\n\n`;
    }
    
    if (colaboradores.length > 0) {
        mensagem += `👥 Colaboradores agendados (${colaboradores.length}/3):\n`;
        colaboradores.forEach((colab, index) => {
            const status = colab.status === 'PENDENTE' ? '⏳ Pendente' : '✅ Aprovado';
            const primeiroNome = colab.nome.split(' ')[0];
            mensagem += `${index + 1}. ${primeiroNome} - ${colab.tipo} (${status})\n`;
        });
    } else {
        mensagem += `👥 Nenhum colaborador agendado\n`;
    }
    
    if (feriado) {
        mensagem += `\n🎯 Feriado: agendamento ilimitado permitido`;
    } else {
        const limiteAtingido = colaboradores.length >= 3;
        mensagem += `\n📊 Limite: ${colaboradores.length}/3 colaboradores`;
        if (limiteAtingido) {
            mensagem += ` ❌ LIMITE ATINGIDO`;
        }
    }
    
    alert(mensagem);
}

// CARREGAR FERIADOS DO MÊS
function carregarFeriadosDoMes(ano, mes) {
    feriadosDoMes = Database.getFeriadosPorMes(ano, mes);
    atualizarListaFeriados();
}

// ATUALIZAR LISTA DE FERIADOS
function atualizarListaFeriados() {
    if (feriadosDoMes.length === 0) {
        elementos.feriadosMes.style.display = 'none';
        return;
    }
    
    elementos.feriadosMes.style.display = 'block';
    elementos.listaFeriados.innerHTML = '';
    
    feriadosDoMes.forEach(feriado => {
        const data = new Date(feriado.data);
        const dataFormatada = formatarDataParaExibicao(data);
        
        const item = document.createElement('div');
        item.className = 'feriado-item';
        
        const cor = document.createElement('div');
        cor.className = `feriado-cor ${feriado.tipo === 'Nacional' ? 'cor-nacional' : 'cor-municipal'}`;
        
        const texto = document.createElement('span');
        texto.textContent = `${dataFormatada}: ${feriado.nome}`;
        
        item.appendChild(cor);
        item.appendChild(texto);
        elementos.listaFeriados.appendChild(item);
    });
}

// VERIFICAR FERIADOS NO PERÍODO
function verificarFeriadosNoPeriodo(dataInicial, dataFinal) {
    const feriados = [];
    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);
    
    for (let data = new Date(inicio); data <= fim; data.setDate(data.getDate() + 1)) {
        const dataFormatada = formatarDataParaInput(data);
        const feriado = feriadosDoMes.find(f => f.data === dataFormatada);
        if (feriado) {
            feriados.push(`${feriado.nome} (${feriado.tipo})`);
        }
    }
    
    return feriados;
}

// FUNÇÕES AUXILIARES
function formatarDataParaInput(data) {
    if (!data) return '';
    try {
        const dataObj = data instanceof Date ? data : new Date(data);
        const ano = dataObj.getFullYear();
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const dia = String(dataObj.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    } catch (e) {
        // Se for string no formato dd/MM/yyyy
        if (typeof data === 'string' && data.includes('/')) {
            const partes = data.split('/');
            if (partes.length === 3) {
                return `${partes[2]}-${partes[1]}-${partes[0]}`;
            }
        }
        return data || '';
    }
}

function formatarDataParaExibicao(data) {
    if (!data) return 'N/A';
    try {
        const dataObj = data instanceof Date ? data : new Date(data);
        return dataObj.toLocaleDateString('pt-BR');
    } catch (e) {
        return 'Data inválida';
    }
}

function calcularDiferencaDias(dataInicio, dataFim) {
    try {
        const inicio = dataInicio instanceof Date ? dataInicio : new Date(dataInicio);
        const fim = dataFim instanceof Date ? dataFim : new Date(dataFim);
        const diffTime = Math.abs(fim - inicio);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch (e) {
        return 0;
    }
}
