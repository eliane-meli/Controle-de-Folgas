// SIMULAÇÃO DO GOOGLE APPS SCRIPT COM LOCALSTORAGE
const Database = {
    // CONFIGURAÇÃO
    CONFIG: {
        LIMITE_POR_DIA: 3,
        UNIDADE: 'BRSP15',
        FERIADOS_2026: [
            '2026-01-01', '2026-02-17', '2026-02-18', '2026-04-02', '2026-04-21',
            '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02',
            '2026-11-15', '2026-12-25'
        ],
        FERIADOS_CAJAMAR: [
            '2026-03-19', '2026-04-23', '2026-08-15', '2026-10-28'
        ]
    },

    // INICIALIZAR LOCALSTORAGE
    init() {
        if (!localStorage.getItem('solicitacoes')) {
            localStorage.setItem('solicitacoes', JSON.stringify([]));
        }
    },

    // OBTER TODAS AS SOLICITAÇÕES
    getSolicitacoes() {
        const data = localStorage.getItem('solicitacoes');
        return data ? JSON.parse(data) : [];
    },

    // SALVAR SOLICITAÇÃO
    salvarSolicitacao(solicitacao) {
        try {
            const solicitacoes = this.getSolicitacoes();
            const novoId = solicitacoes.length > 0 ? 
                Math.max(...solicitacoes.map(s => s.id)) + 1 : 1;
            
            const inicio = new Date(solicitacao.dataInicial);
            const fim = new Date(solicitacao.dataFinal);
            const diffTime = Math.abs(fim - inicio);
            const quantidadeDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            const novaSolicitacao = {
                id: novoId,
                matricula: solicitacao.matricula,
                nome: solicitacao.nome,
                tipo: solicitacao.tipo,
                dataInicial: solicitacao.dataInicial,
                dataFinal: solicitacao.dataFinal,
                quantidadeDias: quantidadeDias,
                status: 'PENDENTE',
                dataSolicitacao: new Date().toLocaleString('pt-BR'),
                gestor: solicitacao.gestor.includes('eliane') ? 'Eliane E. Barbosa' : 'Gabriel G. Paiva',
                emailGestor: solicitacao.gestor,
                resolucao: '',
                dataAprovacao: '',
                ultimaAtualizacao: new Date().toLocaleString('pt-BR')
            };
            
            solicitacoes.push(novaSolicitacao);
            localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
            
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
    },

    // BUSCAR SOLICITAÇÕES POR MATRÍCULA
    buscarSolicitacoesPorMatricula(matricula) {
        try {
            const solicitacoes = this.getSolicitacoes();
            const resultados = solicitacoes.filter(s => 
                s.matricula && s.matricula.toLowerCase().includes(matricula.toLowerCase())
            );
            
            // Ordenar por ID decrescente
            resultados.sort((a, b) => b.id - a.id);
            
            return resultados;
        } catch (error) {
            console.error('Erro ao buscar solicitações:', error);
            return [];
        }
    },

    // VALIDAR LIMITE POR PERÍODO
    validarLimitePeriodo(solicitacao) {
        try {
            const solicitacoes = this.getSolicitacoes();
            const inicio = new Date(solicitacao.dataInicial);
            const fim = new Date(solicitacao.dataFinal);
            const diasExcedidos = [];
            
            for (let data = new Date(inicio); data <= fim; data.setDate(data.getDate() + 1)) {
                if (this.isFeriado(data)) {
                    continue;
                }
                
                let contadorDia = 0;
                const colaboradoresDoDia = [];
                
                for (const s of solicitacoes) {
                    if (s.status === 'APROVADO' || s.status === 'PENDENTE') {
                        const inicioSolicitacao = new Date(s.dataInicial);
                        const fimSolicitacao = new Date(s.dataFinal);
                        
                        if (data >= inicioSolicitacao && data <= fimSolicitacao) {
                            contadorDia++;
                            colaboradoresDoDia.push({
                                nome: s.nome || 'Não informado',
                                tipo: s.tipo || 'Não informado',
                                status: s.status
                            });
                        }
                    }
                }
                
                if (contadorDia >= this.CONFIG.LIMITE_POR_DIA) {
                    const dataFormatada = data.toISOString().split('T')[0];
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
            return {
                excedido: true,
                diasExcedidos: [],
                mensagem: 'Erro ao validar limite'
            };
        }
    },

    // EDITAR SOLICITAÇÃO
    editarSolicitacao(id, dadosAtualizados, emailGestorAtual) {
        try {
            const solicitacoes = this.getSolicitacoes();
            const index = solicitacoes.findIndex(s => 
                s.id.toString() === id.toString() && s.emailGestor === emailGestorAtual
            );
            
            if (index === -1) {
                return {
                    success: false,
                    message: '❌ Solicitação não encontrada'
                };
            }
            
            if (solicitacoes[index].status !== 'PENDENTE') {
                return {
                    success: false,
                    message: '❌ Apenas solicitações com status PENDENTE podem ser editadas'
                };
            }
            
            // Atualizar dados
            const inicio = new Date(dadosAtualizados.dataInicial);
            const fim = new Date(dadosAtualizados.dataFinal);
            const diffTime = Math.abs(fim - inicio);
            const quantidadeDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            solicitacoes[index].matricula = dadosAtualizados.matricula;
            solicitacoes[index].nome = dadosAtualizados.nome;
            solicitacoes[index].tipo = dadosAtualizados.tipo;
            solicitacoes[index].dataInicial = dadosAtualizados.dataInicial;
            solicitacoes[index].dataFinal = dadosAtualizados.dataFinal;
            solicitacoes[index].quantidadeDias = quantidadeDias;
            solicitacoes[index].gestor = dadosAtualizados.gestor.includes('eliane') ? 
                'Eliane E. Barbosa' : 'Gabriel G. Paiva';
            solicitacoes[index].emailGestor = dadosAtualizados.gestor;
            solicitacoes[index].ultimaAtualizacao = new Date().toLocaleString('pt-BR');
            
            localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
            
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
    },

    // EXCLUIR SOLICITAÇÃO
    excluirSolicitacao(id, emailGestor) {
        try {
            const solicitacoes = this.getSolicitacoes();
            const index = solicitacoes.findIndex(s => 
                s.id.toString() === id.toString() && s.emailGestor === emailGestor
            );
            
            if (index === -1) {
                return {
                    success: false,
                    message: '❌ Solicitação não encontrada'
                };
            }
            
            if (solicitacoes[index].status !== 'PENDENTE') {
                return {
                    success: false,
                    message: '❌ Apenas solicitações com status PENDENTE podem ser excluídas'
                };
            }
            
            solicitacoes.splice(index, 1);
            localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
            
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
    },

    // OBTER FERIADOS POR MÊS
    getFeriadosPorMes(ano, mes) {
        const feriadosDoMes = [];
        
        this.CONFIG.FERIADOS_2026.forEach(feriado => {
            const data = new Date(feriado);
            if (data.getFullYear() === ano && data.getMonth() + 1 === mes) {
                feriadosDoMes.push({
                    data: feriado,
                    nome: this.getNomeFeriado(feriado),
                    tipo: 'Nacional'
                });
            }
        });
        
        this.CONFIG.FERIADOS_CAJAMAR.forEach(feriado => {
            const data = new Date(feriado);
            if (data.getFullYear() === ano && data.getMonth() + 1 === mes) {
                feriadosDoMes.push({
                    data: feriado,
                    nome: this.getNomeFeriadoMunicipal(feriado),
                    tipo: 'Municipal'
                });
            }
        });
        
        return feriadosDoMes;
    },

    // OBTER COLABORADORES POR DATA E GESTOR
    getColaboradoresPorData(dataConsulta, gestor) {
        const solicitacoes = this.getSolicitacoes();
        const colaboradores = [];
        const data = new Date(dataConsulta);
        
        for (const s of solicitacoes) {
            if (s.status === 'APROVADO' || s.status === 'PENDENTE') {
                const inicio = new Date(s.dataInicial);
                const fim = new Date(s.dataFinal);
                
                if (data >= inicio && data <= fim) {
                    colaboradores.push({
                        nome: s.nome || 'Não informado',
                        matricula: s.matricula || 'Não informado',
                        tipo: s.tipo || 'Não informado',
                        status: s.status,
                        gestor: s.gestor
                    });
                }
            }
        }
        
        return colaboradores;
    },

    // VERIFICAR SE É FERIADO
    isFeriado(data) {
        const dataFormatada = data.toISOString().split('T')[0];
        
        if (this.CONFIG.FERIADOS_2026.includes(dataFormatada)) {
            return true;
        }
        
        if (this.CONFIG.FERIADOS_CAJAMAR.includes(dataFormatada)) {
            return true;
        }
        
        return false;
    },

    // FUNÇÕES AUXILIARES
    getNomeFeriado(data) {
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
    },

    getNomeFeriadoMunicipal(data) {
        const feriados = {
            '2026-03-19': 'Dia de São José',
            '2026-04-23': 'Aniversário de Cajamar',
            '2026-08-15': 'Dia da Padroeira',
            '2026-10-28': 'Dia do Servidor Público'
        };
        
        return feriados[data] || 'Feriado Municipal';
    }
};

// INICIALIZAR BANCO DE DADOS
Database.init();
