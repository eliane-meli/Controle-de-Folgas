// CONFIGURAÇÃO DO SISTEMA
const CONFIG = {
  // URLs das planilhas principais por gestor
  PLANILHAS_GESTORES: {
    ELIANE: {
      id: '1PB-qik0D_005GcsDfN3mCU6Pgcv48bj0CpW5mFA-ao8',
      nome: 'Solicitacoes2026_Eliane',
      resumo: 'ResumoFolgas',
      gestor: 'Eliane E. Barbosa',
      email: 'eliane.ebarbosa@mercadolivre.com'
    },
    GABRIEL: {
      id: '157mMMy0poQOsTjZ6hz5ZSX7vInrP49p8d_8aptDN1vE',
      nome: 'Solicitacoes2026_Gabriel',
      resumo: 'Solicitacoes',
      gestor: 'Gabriel G. Paiva',
      email: 'gabriel.gpaiva@mercadolivre.com'
    }
  },
  
  // Configurações do sistema
  LIMITE_POR_DIA: 3,
  UNIDADE: 'BRSP15',
  
  // Feriados Nacionais 2026
  FERIADOS_2026: [
    '2026-01-01', '2026-02-17', '2026-02-18', '2026-04-02', '2026-04-21',
    '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02',
    '2026-11-15', '2026-12-25'
  ],
  
  // Feriados Municipais Cajamar-SP 2026
  FERIADOS_CAJAMAR: [
    '2026-03-19', '2026-04-23', '2026-08-15', '2026-10-28'
  ]
};

// FUNÇÃO PRINCIPAL
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sistema de Folgas e Férias - Mercado Livre')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// FUNÇÃO PARA SALVAR SOLICITAÇÃO
function salvarSolicitacao(solicitacao) {
  try {
    // Determinar qual planilha do gestor usar
    const gestorConfig = getGestorConfig(solicitacao.gestor);
    
    // Abrir planilha do gestor correspondente
    const ss = SpreadsheetApp.openById(gestorConfig.id);
    let sheet = ss.getSheetByName(gestorConfig.nome);
    
    if (!sheet) {
      sheet = ss.insertSheet(gestorConfig.nome);
      // Cabeçalhos atualizados
      sheet.appendRow([
        'ID', 'Matrícula', 'Nome', 'Tipo', 'Data Inicial', 'Data Final', 
        'Quantidade de dias', 'Status', 'Data Solicitação', 'Gestor', 
        'Email Gestor', 'Resolução', 'Data Aprovação', 'Última Atualização'
      ]);
    }
    
    // Gerar novo ID
    const ultimaLinha = sheet.getLastRow();
    const ultimoId = ultimaLinha > 1 ? parseInt(sheet.getRange(ultimaLinha, 1).getValue() || 0) : 0;
    const novoId = ultimoId + 1;
    
    // Preparar datas
    const dataAtual = new Date();
    const dataSolicitacao = Utilities.formatDate(dataAtual, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    // Calcular quantidade de dias
    const inicio = new Date(solicitacao.dataInicial);
    const fim = new Date(solicitacao.dataFinal);
    const diffTime = Math.abs(fim - inicio);
    const quantidadeDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Adicionar nova solicitação
    sheet.appendRow([
      novoId,
      solicitacao.matricula,
      solicitacao.nome,
      solicitacao.tipo,
      solicitacao.dataInicial,
      solicitacao.dataFinal,
      quantidadeDias,
      'PENDENTE',
      dataSolicitacao,
      gestorConfig.gestor,
      gestorConfig.email,
      '', // Resolução (vazio inicialmente)
      '', // Data aprovação (vazio inicialmente)
      dataSolicitacao
    ]);
    
    // Registrar na planilha de resumo do gestor
    const registroGestor = registrarNaPlanilhaResumo(solicitacao, novoId, 'INCLUSÃO', gestorConfig);
    
    // Enviar e-mail de confirmação
    enviarEmailConfirmacao(solicitacao, novoId, gestorConfig);
    
    return {
      success: true,
      id: novoId,
      message: '✅ Solicitação registrada com sucesso! ID: ' + novoId
    };
    
  } catch (error) {
    return {
      success: false,
      message: '❌ Erro ao salvar solicitação: ' + error.toString()
    };
  }
}

// OBTER CONFIGURAÇÃO DO GESTOR
function getGestorConfig(emailGestor) {
  if (emailGestor.includes('eliane')) {
    return CONFIG.PLANILHAS_GESTORES.ELIANE;
  } else {
    return CONFIG.PLANILHAS_GESTORES.GABRIEL;
  }
}

// REGISTRAR NA PLANILHA DE RESUMO DO GESTOR
function registrarNaPlanilhaResumo(solicitacao, id, acao, gestorConfig) {
  try {
    const ss = SpreadsheetApp.openById(gestorConfig.id);
    let sheet = ss.getSheetByName(gestorConfig.resumo);
    
    if (!sheet) {
      sheet = ss.insertSheet(gestorConfig.resumo);
      sheet.appendRow([
        'ID', 'Matrícula', 'Nome', 'Tipo', 'Data Inicial', 'Data Final',
        'Quantidade Dias', 'Status', 'Data Solicitação', 'Unidade', 
        'Observações', 'Gestor', 'Resolução', 'Data Ação'
      ]);
    }
    
    // Formatar datas
    const dataAtual = new Date();
    const dataSolicitacao = Utilities.formatDate(dataAtual, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    // Calcular dias
    const inicio = new Date(solicitacao.dataInicial);
    const fim = new Date(solicitacao.dataFinal);
    const diffTime = Math.abs(fim - inicio);
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Adicionar novo registro
    sheet.appendRow([
      id,
      solicitacao.matricula,
      solicitacao.nome,
      solicitacao.tipo,
      Utilities.formatDate(inicio, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
      Utilities.formatDate(fim, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
      dias,
      'PENDENTE',
      dataSolicitacao,
      CONFIG.UNIDADE,
      `${dias} dias solicitados`,
      gestorConfig.gestor,
      'Pendente',
      dataSolicitacao
    ]);
    
    return true;
  } catch (error) {
    console.error('Erro ao registrar na planilha de resumo:', error);
    return false;
  }
}

// VALIDAR LIMITE POR PERÍODO
function validarLimitePeriodo(solicitacao) {
  try {
    const gestorConfig = getGestorConfig(solicitacao.gestor);
    const ss = SpreadsheetApp.openById(gestorConfig.id);
    const sheet = ss.getSheetByName(gestorConfig.nome);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return { excedido: false, diasExcedidos: [] };
    }
    
    const dados = sheet.getDataRange().getValues();
    const inicio = new Date(solicitacao.dataInicial);
    const fim = new Date(solicitacao.dataFinal);
    const diasExcedidos = [];
    
    // Verificar cada dia do período
    for (let data = new Date(inicio); data <= fim; data.setDate(data.getDate() + 1)) {
      // Ignorar feriados
      if (isFeriado(data)) {
        continue;
      }
      
      let contadorDia = 0;
      const colaboradoresDoDia = [];
      
      // Contar solicitações para este dia
      for (let i = 1; i < dados.length; i++) {
        const linha = dados[i];
        if (linha.length < 10) continue;
        
        const status = linha[7]; // Status está na coluna 7 (índice 7)
        
        // Considerar apenas status válidos
        if (status === 'APROVADO' || status === 'PENDENTE') {
          const inicioSolicitacao = linha[4] ? new Date(linha[4]) : null;
          const fimSolicitacao = linha[5] ? new Date(linha[5]) : null;
          
          if (inicioSolicitacao && fimSolicitacao) {
            // Verificar se a data está dentro do período
            if (data >= inicioSolicitacao && data <= fimSolicitacao) {
              contadorDia++;
              colaboradoresDoDia.push({
                nome: linha[2] || 'Não informado',
                tipo: linha[3] || 'Não informado',
                status: status
              });
            }
          }
        }
      }
      
      // Verificar limite
      if (contadorDia >= CONFIG.LIMITE_POR_DIA) {
        const dataFormatada = Utilities.formatDate(data, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        diasExcedidos.push({
          data: dataFormatada,
          limite: contadorDia,
          colaboradores: colaboradoresDoDia
        });
      }
    }
    
    return {
      excedido: diasExcedidos.length > 0,
      diasExcedidos: diasExcedidos
    };
    
  } catch (error) {
    console.error('Erro na validação de limite:', error);
    return {
      excedido: true,
      diasExcedidos: [],
      mensagem: 'Erro ao validar limite: ' + error.toString()
    };
  }
}

// FUNÇÃO PARA VERIFICAR SE É FERIADO
function isFeriado(data) {
  try {
    const dataFormatada = Utilities.formatDate(data, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    if (CONFIG.FERIADOS_2026.includes(dataFormatada)) {
      return true;
    }
    
    if (CONFIG.FERIADOS_CAJAMAR.includes(dataFormatada)) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// BUSCAR SOLICITAÇÕES POR MATRÍCULA (MELHORADO)
function buscarSolicitacoesPorMatricula(matricula) {
  try {
    const resultados = [];
    
    // Buscar em todas as planilhas dos gestores
    for (const gestorKey in CONFIG.PLANILHAS_GESTORES) {
      const gestorConfig = CONFIG.PLANILHAS_GESTORES[gestorKey];
      
      const ss = SpreadsheetApp.openById(gestorConfig.id);
      const sheet = ss.getSheetByName(gestorConfig.nome);
      
      if (!sheet || sheet.getLastRow() <= 1) {
        continue;
      }
      
      const dados = sheet.getDataRange().getValues();
      
      for (let i = 1; i < dados.length; i++) {
        const linha = dados[i];
        
        if (linha.length < 2) continue;
        
        const matriculaLinha = linha[1] ? linha[1].toString().trim() : '';
        
        if (matriculaLinha && matriculaLinha.toLowerCase() === matricula.toLowerCase()) {
          // Formatar datas para string
          let dataInicialFormatada = '';
          let dataFinalFormatada = '';
          let dataAprovacaoFormatada = '';
          
          if (linha[4]) {
            try {
              const data = new Date(linha[4]);
              dataInicialFormatada = Utilities.formatDate(data, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            } catch (e) {
              dataInicialFormatada = linha[4].toString();
            }
          }
          
          if (linha[5]) {
            try {
              const data = new Date(linha[5]);
              dataFinalFormatada = Utilities.formatDate(data, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            } catch (e) {
              dataFinalFormatada = linha[5].toString();
            }
          }
          
          if (linha[12]) { // Data aprovação
            try {
              const data = new Date(linha[12]);
              dataAprovacaoFormatada = Utilities.formatDate(data, Session.getScriptTimeZone(), 'dd/MM/yyyy');
            } catch (e) {
              dataAprovacaoFormatada = linha[12].toString();
            }
          }
          
          resultados.push({
            id: linha[0] ? linha[0].toString() : '',
            matricula: matriculaLinha,
            nome: linha[2] ? linha[2].toString().trim() : '',
            tipo: linha[3] ? linha[3].toString().trim() : '',
            dataInicial: dataInicialFormatada,
            dataFinal: dataFinalFormatada,
            quantidadeDias: linha[6] ? linha[6].toString().trim() : '',
            status: linha[7] ? linha[7].toString().trim() : '',
            gestor: linha[9] ? linha[9].toString().trim() : '',
            emailGestor: linha[10] ? linha[10].toString().trim() : '',
            resolucao: linha[11] ? linha[11].toString().trim() : '',
            dataAprovacao: dataAprovacaoFormatada,
            dataSolicitacao: linha[8] ? linha[8].toString().trim() : '',
            ultimaAtualizacao: linha[13] ? linha[13].toString().trim() : '',
            planilhaOrigem: gestorConfig.nome
          });
        }
      }
    }
    
    // Ordenar por ID decrescente
    resultados.sort((a, b) => {
      try {
        const idA = parseInt(a.id) || 0;
        const idB = parseInt(b.id) || 0;
        return idB - idA;
      } catch (e) {
        return 0;
      }
    });
    
    return resultados;
    
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return [];
  }
}

// EXCLUIR SOLICITAÇÃO
function excluirSolicitacao(id, emailGestor) {
  try {
    const gestorConfig = getGestorConfig(emailGestor);
    const ss = SpreadsheetApp.openById(gestorConfig.id);
    const sheet = ss.getSheetByName(gestorConfig.nome);
    
    if (!sheet) {
      return {
        success: false,
        message: '❌ Planilha não encontrada'
      };
    }
    
    const dados = sheet.getDataRange().getValues();
    let linhaEncontrada = -1;
    let dadosSolicitacao = null;
    
    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      
      if (linha.length > 0 && linha[0] && linha[0].toString() === id.toString()) {
        linhaEncontrada = i + 1;
        dadosSolicitacao = {
          id: id,
          matricula: linha[1] || '',
          nome: linha[2] || '',
          tipo: linha[3] || '',
          dataInicial: linha[4] || '',
          dataFinal: linha[5] || '',
          status: linha[7] || '',
          gestor: linha[9] || ''
        };
        break;
      }
    }
    
    if (linhaEncontrada === -1) {
      return {
        success: false,
        message: '❌ Solicitação não encontrada'
      };
    }
    
    if (dadosSolicitacao.status !== 'PENDENTE') {
      return {
        success: false,
        message: '❌ Apenas solicitações com status PENDENTE podem ser excluídas'
      };
    }
    
    // Remover da planilha de resumo do gestor
    removerDaPlanilhaResumo(id, gestorConfig);
    
    // Excluir da planilha principal
    sheet.deleteRow(linhaEncontrada);
    
    return {
      success: true,
      message: '🗑️ Solicitação excluída com sucesso!'
    };
    
  } catch (error) {
    return {
      success: false,
      message: '❌ Erro ao excluir: ' + error.toString()
    };
  }
}

// REMOVER DA PLANILHA DE RESUMO
function removerDaPlanilhaResumo(id, gestorConfig) {
  try {
    const ss = SpreadsheetApp.openById(gestorConfig.id);
    let sheet = ss.getSheetByName(gestorConfig.resumo);
    
    if (!sheet) {
      return;
    }
    
    const dados = sheet.getDataRange().getValues();
    
    for (let i = 1; i < dados.length; i++) {
      if (dados[i][0] && dados[i][0].toString() === id.toString()) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  } catch (error) {
    console.error('Erro ao remover da planilha de resumo:', error);
  }
}

// EDITAR SOLICITAÇÃO
function editarSolicitacao(id, dadosAtualizados, emailGestorAtual) {
  try {
    const gestorConfig = getGestorConfig(emailGestorAtual);
    const ss = SpreadsheetApp.openById(gestorConfig.id);
    const sheet = ss.getSheetByName(gestorConfig.nome);
    
    if (!sheet) {
      return {
        success: false,
        message: '❌ Planilha não encontrada'
      };
    }
    
    const dados = sheet.getDataRange().getValues();
    let linhaEncontrada = -1;
    let dadosAntigos = null;
    
    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      
      if (linha.length > 0 && linha[0] && linha[0].toString() === id.toString()) {
        linhaEncontrada = i + 1;
        dadosAntigos = {
          status: linha[7] || '',
          gestor: linha[9] || ''
        };
        break;
      }
    }
    
    if (linhaEncontrada === -1) {
      return {
        success: false,
        message: '❌ Solicitação não encontrada'
      };
    }
    
    if (dadosAntigos.status !== 'PENDENTE') {
      return {
        success: false,
        message: '❌ Apenas solicitações com status PENDENTE podem ser editadas'
      };
    }
    
    // Validar novo período
    const validacao = validarLimitePeriodo(dadosAtualizados);
    
    if (validacao.excedido) {
      return {
        success: false,
        message: '❌ Período excede o limite de colaboradores por dia'
      };
    }
    
    const gestorAnterior = dadosAntigos.gestor;
    const gestorNovo = dadosAtualizados.gestor;
    
    // Calcular nova quantidade de dias
    const inicio = new Date(dadosAtualizados.dataInicial);
    const fim = new Date(dadosAtualizados.dataFinal);
    const diffTime = Math.abs(fim - inicio);
    const quantidadeDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Atualizar dados na planilha principal
    sheet.getRange(linhaEncontrada, 2).setValue(dadosAtualizados.matricula);
    sheet.getRange(linhaEncontrada, 3).setValue(dadosAtualizados.nome);
    sheet.getRange(linhaEncontrada, 4).setValue(dadosAtualizados.tipo);
    sheet.getRange(linhaEncontrada, 5).setValue(dadosAtualizados.dataInicial);
    sheet.getRange(linhaEncontrada, 6).setValue(dadosAtualizados.dataFinal);
    sheet.getRange(linhaEncontrada, 7).setValue(quantidadeDias);
    
    // Atualizar gestor se mudou
    const novoGestorConfig = getGestorConfig(dadosAtualizados.gestor);
    sheet.getRange(linhaEncontrada, 9).setValue(novoGestorConfig.gestor);
    sheet.getRange(linhaEncontrada, 10).setValue(novoGestorConfig.email);
    
    // Atualizar data de atualização
    const dataAtual = new Date();
    const dataAtualizacao = Utilities.formatDate(dataAtual, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    sheet.getRange(linhaEncontrada, 14).setValue(dataAtualizacao);
    
    // Atualizar na planilha de resumo
    atualizarNaPlanilhaResumo(id, dadosAtualizados, quantidadeDias);
    
    return {
      success: true,
      message: '✏️ Solicitação atualizada com sucesso!'
    };
    
  } catch (error) {
    return {
      success: false,
      message: '❌ Erro ao editar: ' + error.toString()
    };
  }
}

// ATUALIZAR NA PLANILHA DE RESUMO
function atualizarNaPlanilhaResumo(id, dados, quantidadeDias) {
  try {
    const gestorConfig = getGestorConfig(dados.gestor);
    const ss = SpreadsheetApp.openById(gestorConfig.id);
    let sheet = ss.getSheetByName(gestorConfig.resumo);
    
    if (!sheet) {
      return;
    }
    
    const dadosPlanilha = sheet.getDataRange().getValues();
    
    for (let i = 1; i < dadosPlanilha.length; i++) {
      if (dadosPlanilha[i][0] && dadosPlanilha[i][0].toString() === id.toString()) {
        // Formatar datas
        const inicio = new Date(dados.dataInicial);
        const fim = new Date(dados.dataFinal);
        
        // Atualizar linha
        sheet.getRange(i + 1, 2).setValue(dados.matricula);
        sheet.getRange(i + 1, 3).setValue(dados.nome);
        sheet.getRange(i + 1, 4).setValue(dados.tipo);
        sheet.getRange(i + 1, 5).setValue(Utilities.formatDate(inicio, Session.getScriptTimeZone(), 'dd/MM/yyyy'));
        sheet.getRange(i + 1, 6).setValue(Utilities.formatDate(fim, Session.getScriptTimeZone(), 'dd/MM/yyyy'));
        sheet.getRange(i + 1, 7).setValue(quantidadeDias);
        sheet.getRange(i + 1, 10).setValue(`${quantidadeDias} dias solicitados`);
        
        // Atualizar data da ação
        const dataAtual = new Date();
        const dataAtualizacao = Utilities.formatDate(dataAtual, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
        sheet.getRange(i + 1, 14).setValue(dataAtualizacao);
        break;
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar na planilha de resumo:', error);
  }
}

// OBTER FERIADOS POR MÊS
function getFeriadosPorMes(ano, mes) {
  try {
    const feriadosDoMes = [];
    
    // Feriados nacionais
    CONFIG.FERIADOS_2026.forEach(feriado => {
      const data = new Date(feriado);
      if (data.getFullYear() === ano && data.getMonth() + 1 === mes) {
        feriadosDoMes.push({
          data: feriado,
          nome: getNomeFeriado(feriado),
          tipo: 'Nacional'
        });
      }
    });
    
    // Feriados municipais
    CONFIG.FERIADOS_CAJAMAR.forEach(feriado => {
      const data = new Date(feriado);
      if (data.getFullYear() === ano && data.getMonth() + 1 === mes) {
        feriadosDoMes.push({
          data: feriado,
          nome: getNomeFeriadoMunicipal(feriado),
          tipo: 'Municipal'
        });
      }
    });
    
    return feriadosDoMes;
    
  } catch (error) {
    return [];
  }
}

// OBTER COLABORADORES POR DATA E GESTOR
function getColaboradoresPorData(data, gestor) {
  try {
    const gestorConfig = getGestorConfig(gestor);
    const ss = SpreadsheetApp.openById(gestorConfig.id);
    const sheet = ss.getSheetByName(gestorConfig.nome);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }
    
    const dados = sheet.getDataRange().getValues();
    const colaboradores = [];
    const dataConsulta = new Date(data);
    
    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      if (linha.length < 10) continue;
      
      const status = linha[7]; // Status está na coluna 7
      
      // Filtrar por status válido
      if (status === 'APROVADO' || status === 'PENDENTE') {
        const inicio = linha[4] ? new Date(linha[4]) : null;
        const fim = linha[5] ? new Date(linha[5]) : null;
        
        if (inicio && fim && dataConsulta >= inicio && dataConsulta <= fim) {
          colaboradores.push({
            nome: linha[2] || 'Não informado',
            matricula: linha[1] || 'Não informado',
            tipo: linha[3] || 'Não informado',
            status: status,
            gestor: gestorConfig.gestor
          });
        }
      }
    }
    
    return colaboradores;
    
  } catch (error) {
    console.error('Erro ao obter colaboradores:', error);
    return [];
  }
}

// OBTER DATAS COM LIMITE ATINGIDO POR GESTOR
function getDatasComLimiteAtingido(gestor) {
  try {
    const gestorConfig = getGestorConfig(gestor);
    const ss = SpreadsheetApp.openById(gestorConfig.id);
    const sheet = ss.getSheetByName(gestorConfig.nome);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }
    
    const dados = sheet.getDataRange().getValues();
    const datasLimite = [];
    
    // Determinar período a verificar (próximos 60 dias)
    const hoje = new Date(2026, 0, 1);
    const fimPeriodo = new Date(2026, 0, 1);
    fimPeriodo.setDate(hoje.getDate() + 60);
    
    for (let data = new Date(hoje); data <= fimPeriodo; data.setDate(data.getDate() + 1)) {
      // Ignorar feriados
      if (isFeriado(data)) {
        continue;
      }
      
      let contador = 0;
      const colaboradores = [];
      
      for (let i = 1; i < dados.length; i++) {
        const linha = dados[i];
        if (linha.length < 10) continue;
        
        const status = linha[7];
        
        if (status === 'APROVADO' || status === 'PENDENTE') {
          const inicio = linha[4] ? new Date(linha[4]) : null;
          const fim = linha[5] ? new Date(linha[5]) : null;
          
          if (inicio && fim && data >= inicio && data <= fim) {
            contador++;
            colaboradores.push(linha[2] || 'Não informado');
          }
        }
      }
      
      if (contador >= CONFIG.LIMITE_POR_DIA) {
        const dataFormatada = Utilities.formatDate(data, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        datasLimite.push({
          data: dataFormatada,
          contador: contador,
          colaboradores: colaboradores
        });
      }
    }
    
    return datasLimite;
    
  } catch (error) {
    console.error('Erro ao obter datas com limite:', error);
    return [];
  }
}

/* OCULTADO------------------------------

// GERAR DADOS DE EXEMPLO PARA TESTES
function gerarDadosExemplo() {
  return [
    {
      id: '1001',
      matricula: 'ML2026CAJA001',
      nome: 'João Silva Santos',
      tipo: 'Folga',
      dataInicial: '2026-01-10',
      dataFinal: '2026-01-12',
      quantidadeDias: '3',
      status: 'APROVADO',
      gestor: 'Eliane E. Barbosa',
      resolucao: 'Aprovado pelo RH',
      dataAprovacao: '05/01/2026'
    },
    {
      id: '1002',
      matricula: 'ML2026CAJA002',
      nome: 'Maria Oliveira Costa',
      tipo: 'Férias',
      dataInicial: '2026-01-15',
      dataFinal: '2026-01-30',
      quantidadeDias: '16',
      status: 'PENDENTE',
      gestor: 'Eliane E. Barbosa',
      resolucao: '',
      dataAprovacao: ''
    },
    {
      id: '1003',
      matricula: 'ML2026CAJA003',
      nome: 'Pedro Almeida Souza',
      tipo: 'Folga',
      dataInicial: '2026-01-10',
      dataFinal: '2026-01-11',
      quantidadeDias: '2',
      status: 'REJEITADO',
      gestor: 'Gabriel G. Paiva',
      resolucao: 'Período indisponível',
      dataAprovacao: '03/01/2026'
    },
    {
      id: '1004',
      matricula: 'ML2026CAJA004',
      nome: 'Ana Pereira Lima',
      tipo: 'Folga',
      dataInicial: '2026-01-12',
      dataFinal: '2026-01-14',
      quantidadeDias: '3',
      status: 'PENDENTE',
      gestor: 'Gabriel G. Paiva',
      resolucao: '',
      dataAprovacao: ''
    },
    {
      id: '1005',
      matricula: 'ML2026CAJA005',
      nome: 'Carlos Santos Rocha',
      tipo: 'Férias',
      dataInicial: '2026-02-01',
      dataFinal: '2026-02-15',
      quantidadeDias: '15',
      status: 'APROVADO',
      gestor: 'Eliane E. Barbosa',
      resolucao: 'Aprovado - Período adequado',
      dataAprovacao: '15/12/2025'
    }
  ];
}
------------------------------------OCULTADO*/

// FUNÇÕES AUXILIARES
function getNomeFeriado(data) {
  const feriados = {
    '2026-01-01': 'Ano Novo',
    '2026-02-17': 'Carnaval',
    '2026-02-18': 'Quarta-feira de Cinzas',
    '2026-04-02': 'Sexta-feira Santa',
    '2026-04-21': 'Tiradentes',
    '2026-05-01': 'Dia do Trabalho',
    '2026-06-04': 'Corpus Christi',
    '2026-09-07': 'Independência do Brasil',
    '2026-10-12': 'Nossa Senhora Aparecida',
    '2026-11-02': 'Finados',
    '2026-11-15': 'Proclamação da República',
    '2026-12-25': 'Natal'
  };
  
  return feriados[data] || 'Feriado Nacional';
}

function getNomeFeriadoMunicipal(data) {
  const feriados = {
    '2026-03-19': 'Dia de São José',
    '2026-04-23': 'Aniversário de Cajamar',
    '2026-08-15': 'Dia da Padroeira',
    '2026-10-28': 'Dia do Servidor Público'
  };
  
  return feriados[data] || 'Feriado Municipal';
}

// ENVIAR E-MAIL DE CONFIRMAÇÃO
function enviarEmailConfirmacao(solicitacao, id, gestorConfig) {
  try {
    const usuario = Session.getActiveUser().getEmail();
    const assunto = `[ML BRSP15] Solicitação de ${solicitacao.tipo} Registrada - ID: ${id}`;
    
    // Formatar datas
    const dataInicial = new Date(solicitacao.dataInicial);
    const dataFinal = new Date(solicitacao.dataFinal);
    
    const dataInicialFormatada = Utilities.formatDate(dataInicial, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const dataFinalFormatada = Utilities.formatDate(dataFinal, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    
    // Calcular dias
    const diffTime = Math.abs(dataFinal - dataInicial);
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const corpo = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <!-- Cabeçalho -->
        <div style="background: linear-gradient(135deg, #ffde00, #ffe958); padding: 25px; text-align: center;">
          <h2 style="color: #2d3277; margin: 0 0 10px 0;">MERCADO LIVRE - BRSP15</h2>
          <p style="color: #555; font-weight: bold; margin: 0;">Sistema de Folgas e Férias</p>
        </div>
        
        <!-- Conteúdo -->
        <div style="padding: 25px;">
          <h3 style="color: #2d3277; margin-top: 0;">✅ Solicitação Registrada com Sucesso!</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><strong>ID da Solicitação:</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;"><strong>#${id}</strong></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">Matrícula:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${solicitacao.matricula}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">Nome:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${solicitacao.nome}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">Gestor:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${gestorConfig.gestor}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">Tipo:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${solicitacao.tipo}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">Período:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">
                ${dataInicialFormatada} a ${dataFinalFormatada}<br>
                <small>(${dias} dias)</small>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">Status:</td>
              <td style="padding: 12px 0; text-align: right;">
                <span style="background-color: #fff3cd; color: #856404; padding: 5px 10px; border-radius: 4px; font-weight: bold;">
                  PENDENTE DE APROVAÇÃO
                </span>
              </td>
            </tr>
          </table>
          
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2d3277;">
            <p style="margin: 0; color: #0c5460; font-size: 14px;">
              <strong>📌 Informações importantes:</strong><br>
              1. Sua solicitação foi registrada na planilha do gestor ${gestorConfig.gestor}<br>
              2. Você poderá editar/excluir apenas enquanto o status for "PENDENTE"<br>
              3. Limite de 3 colaboradores por dia (exceto feriados)<br>
              4. Tempo médio de resposta: 24-48 horas úteis<br>
              5. Status atualizável: APROVADO, REJEITADO ou PENDENTE
            </p>
          </div>
          
          <!-- Link para acesso -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="${ScriptApp.getService().getUrl()}" 
               style="background: linear-gradient(to right, #2d3277, #3a40a0); 
                      color: white; 
                      padding: 14px 35px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold;">
              📅 ACESSAR SISTEMA
            </a>
          </div>
        </div>
        
        <!-- Rodapé -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            Sistema de Folgas e Férias - Mercado Livre BRSP15 © 2026<br>
            Este é um e-mail automático, não responda.
          </p>
        </div>
      </div>
    `;
    
    MailApp.sendEmail({
      to: usuario,
      subject: assunto,
      htmlBody: corpo
    });
    
    return true;
    
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return false;
  }
}
