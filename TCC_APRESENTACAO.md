# Observatório da Jornada do Paciente Oncológico
## Apresentação de TCC — Sistemas de Informação

---

## 📋 Resumo Executivo

Este projeto apresenta uma **plataforma web interativa de análise e visualização de dados públicos** sobre o tempo de espera de pacientes oncológicos no Brasil. Utilizando dados do Registro Hospitalar de Câncer (IRHC) de 2023, a aplicação transforma registros complexos em narrativas visuais acessíveis, permitindo compreender desigualdades estruturais na jornada do tratamento.

**Classificação:** Aplicação de análise de dados e visualização de informação  
**Público-alvo:** Pacientes, familiares, profissionais de saúde, gestores e pesquisadores  
**Dados:** 125.625 registros hospitalares; 119.653 com datas válidas para análise  
**Período:** 2023 (com série histórica 2010–2024)

---

## 🎯 Problema e Justificativa

### O Contexto
A Lei 12.732/2013 estabelece que pacientes com câncer devem iniciar o tratamento **em até 60 dias após o diagnóstico**. Porém:

- **57% dos pacientes** ultrapassam este prazo
- A espera média é de **66 dias** — 6 dias além do legal
- Existem **profundas desigualdades** baseadas em escolaridade, raça e localização geográfica

### O Desafio de Informação
Os dados existem, mas são:
- **Dispersos** em bases de dados hospitalares
- **Pouco acessíveis** ao público
- **Complexos** para análise manual
- **Não tangibilizados** em contexto humano

### A Solução
Criar uma **plataforma de inteligência de dados** que:
1. Centraliza dados públicos em um único lugar
2. Transforma números em narrativas visuais
3. Contextualiza a espera em termos humanos ("dois meses", "três meses")
4. Revela desigualdades estruturais com transparência
5. Capacita cidadãos com informação

---

## 🏗️ Solução Técnica

### Arquitetura

```
Frontend (React 19)          Backend (Estático)      Data
┌─────────────────┐         ┌──────────────┐        ┌────────────────┐
│ React 19 + Vite │────────→│  Vite Build  │───────→│ rhc23.csv      │
│ (837 KB gzip)   │         │  (SSG)       │        │ (125.625 rows) │
└─────────────────┘         └──────────────┘        └────────────────┘
      ↓
   Recharts         PapaParse         D3-Geo
(Visualização)    (CSV Parsing)    (Cartografia)
```

### Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---|
| **Frontend** | React 19.2.6 + Vite 8.0.11 | Renderização eficiente, SPA interativa, build rápido |
| **Visualização** | Recharts 3.8.1 | Gráficos responsivos, compostos, animados |
| **Dados** | PapaParse 5.4.1 | Parsing de CSV no browser (sem backend) |
| **Cartografia** | D3-Geo + TopoJSON | Renderização SVG do mapa do Brasil com projeção Mercator |
| **Estilo** | CSS inline + Design System | Design consistente, tokens semânticos de cor |
| **Deploy** | Vite SSG | Build estático, zero backend necessário |

### Design System

**Cores semânticas:**
- `HOPE` (#00a67c): Espera ≤30 dias, dados positivos
- `WAIT` (#c8860a): Espera 31–60 dias, atenção
- `ALERT` (#e05c2a): Espera >60 dias, violação da lei

**Tipografia:**
- Display: DM Serif Display (títulos, narrativa)
- Body: DM Sans (conteúdo, leitura)

---

## 📊 Perspectivas de Dados

### 1. **Lei vs. Realidade**
Compara a espera média (66 dias) com o prazo legal (60 dias)  
Mostra visualmente que 57% dos pacientes aguardam além do permitido

### 2. **Geografia**
Mapa interativo do Brasil colorido por espera média por estado  
Ranking de 27 estados + DF  
Extremos: Maior espera vs. Menor espera

### 3. **Desigualdade Estrutural**

#### Educação
- Diferença de até **20 dias** entre grupos educacionais
- Diagnóstico tardio (estágio III/IV) mais frequente em pacientes com menor escolaridade
- Explora confundidores (mix de tumores, acesso à prevenção)

#### Raça/Cor
- Distribui tumores por grupo racial (% de cada tipo)
- Mostra % diagnóstico tardio por raça
- Contextualiza: não é apenas fila, é acesso ao diagnóstico precoce

#### Tipo de Câncer
- 9 tipos analisados; alguns dentro do prazo, outros não
- Relaciona espera com complexidade do protocolo (estágio ao diagnóstico)

### 4. **Perspectivas Adicionais**

#### Sexo/Gênero
- Comparação de espera entre homens e mulheres
- % que ultrapassou 60 dias por sexo

#### Fatores de Risco
- Correlação: tabagismo (nunca/ex/fumante) com espera
- Correlação: álcool (não/ex/sim) com espera

#### Incidência vs. Espera
- Distribuição dos 8 tipos de câncer mais frequentes
- Cada um com espera média respectiva

#### Diagnóstico Tardio
- **Global:** 41% dos pacientes chegam em estágio III/IV
- Sinal de falha no acesso à prevenção/detecção, não apenas na fila

### 5. **Explore (Personalização)**
Filtros por: sexo, raça, escolaridade, tipo de câncer  
Retorna: espera média, mediana, % acima de 60 dias, volume de casos similares

### 6. **Metodologia**
- Explicação de fonte de dados (IRHC/INCA)
- Definição de "tempo de espera" (DTDIAGNO → DATAINITRT)
- Filtros aplicados (datas válidas, intervalos plausíveis)
- Registros analisados: 119.653 de 125.625 totais

### 7. **Sobre**
- Link para portal IRHC: https://irhc.inca.gov.br/RHCNet/
- Explicação: dados são públicos, qualquer pessoa pode acessar
- Missão: "Feito com ♥ e intenção de caridade — para ajudar a todos"

---

## 💾 Processamento de Dados

### Pipeline

```
CSV (125.625 linhas)
    ↓
[PapaParse]  ← Parsing no navegador
    ↓
Validação: datas DD/MM/YYYY, intervalo 0–10 anos
    ↓
119.653 registros válidos
    ↓
[Agregações]
├─ Por ano (2010–2024)
├─ Por estado (27 + DF)
├─ Por educação (5 níveis)
├─ Por raça (5 categorias)
├─ Por sexo (2 categorias)
├─ Por tipo tumor (9 tipos)
├─ Por estadiamento (In situ, I, II, III, IV)
├─ Por tabagismo / álcool
├─ Cross-tabs (raça × tumor, edu × staging)
└─ Métricas globais (média, mediana, % acima 60/30)
    ↓
JSON estruturado → React components
    ↓
Visualização + Narrativa
```

### Agregações Computadas

| Agregação | Métrica | Uso |
|-----------|---------|-----|
| `byYear` | avg, mediana, pct60, volume | Série histórica |
| `byState` | avg, mediana, ranking | Mapa interativo |
| `byEducationStats` | avg, mediana, pct60, count | Desigualdade |
| `byRaceStats` | avg, mediana, pct60, count | Desigualdade |
| `bySexStats` | avg, mediana, pct60, count | Perspectiva adicional |
| `tumorWithStaging` | avg, pct_advanced, count | Tipo de tumor |
| `raceByTumor` | distribuição % | Contexto raça |
| `eduByStaging` | % estágio III/IV | Diagnóstico tardio |

---

## 🎨 Componentes React

| Componente | Responsabilidade |
|-----------|-----------------|
| `App.jsx` | Layout principal, navegação, 7 seções |
| `MetricsPanel.jsx` | KPIs, gráficos históricos, distribuição de espera |
| `BrazilMap.jsx` | Mapa interativo com gradiente de cores |
| `InequalityAnalysis.jsx` | Tabelas educação/raça, contexto de confundidores |
| `AdditionalPerspectives.jsx` | Gênero, fatores de risco, incidência, diagnóstico tardio |
| `SmartFilters.jsx` | Explore interativo com filtros personalizados |

**Tamanho final:** 674 KB (gzip: 198.5 KB)  
**Build time:** 909 ms  
**Módulos:** 637

---

## 📈 Métricas de Sucesso

### Funcionais
- ✅ Carrega 125.625 registros em <2 segundos
- ✅ Renderiza 7 seções com 15+ visualizações
- ✅ Suporta 4 filtros simultâneos (sexo, raça, educação, tumor)
- ✅ Mapa interativo com 27 estados + tooltip

### Não-Funcionais
- ✅ Performance: First Contentful Paint <1.5s
- ✅ Responsividade: Mobile-first, funciona em qualquer resolução
- ✅ Acessibilidade: Cores semânticas, tipografia legível, contraste adequado
- ✅ Transparência: Fonte de dados explícita com link verificável

---

## 🔍 Contribuições de SI

### 1. **Engenharia de Dados**
- Validação e limpeza de CSV (+6 anos de histórico)
- Normalização de códigos (educação, raça, tumor, medicamentos)
- Agregações complexas (cross-tabs, percentis, médias)
- Tratamento de dados faltantes (~5% do dataset)

### 2. **Visualização de Informação**
- Design de cores semântico (esperança/alerta)
- Tangibilização de números (2 meses, 3 meses, etc.)
- Narrativa visual: storytelling através de dados

### 3. **Engenharia de Software**
- Frontend modular e escalável (React)
- Zero backend: app estática, distribuição simples
- Build otimizado (Vite, gzip)
- Design System consistente (tokens, componentes reutilizáveis)

### 4. **Impacto Social**
- **Transparência:** Dados públicos interpretados
- **Cidadania:** Pacientes e familiares com conhecimento
- **Evidência:** Gestores com dados para decisão

---

## 🚀 Deploy

### Opções
- **GitHub Pages:** Deploy automático a cada push
- **Vercel/Netlify:** Deploy de SPA com histórico de rotas
- **Servidor estático:** Apache, Nginx, S3 + CloudFront

### Requisitos
- Node.js 18+
- `npm install && npm run build`
- Servir pasta `dist/` como estática

### Variáveis de Ambiente
Nenhuma necessária. Aplicação é 100% client-side.

---

## 📚 Dados Utilizados

**Fonte:** Registro Hospitalar de Câncer (IRHC) 2023 — INCA  
**URL:** https://irhc.inca.gov.br/RHCNet/  
**Período:** 2010–2024 (concentração 2022–2023)  
**Campos principais:**
- `DTDIAGNO`: Data diagnóstico
- `DATAINITRT`: Data início tratamento
- `INSTRUC`: Escolaridade
- `RACACOR`: Raça/cor
- `SEXO`: Sexo
- `LOCTUDET` / `LOCTUPRI`: Localização tumor (CID-10)
- `ESTADIAM`: Estadiamento (0, I, II, III, IV, 9)

---

## 🔮 Trabalhos Futuros

### Curto Prazo
- [ ] Integrar filtro por estado (drill-down do mapa)
- [ ] Comparação temporal (antes/depois lei 2013)
- [ ] Export de dados processados (CSV)
- [ ] PWA: funcionar offline após primeira carga

### Médio Prazo
- [ ] Backend Node.js com cache (Redis)
- [ ] Dashboard admin: upload de novos dados
- [ ] API REST para terceiros
- [ ] Notificações: alertas de desigualdades extremas

### Longo Prazo
- [ ] Integração com SUS: dados em tempo real
- [ ] ML: previsão de espera por perfil
- [ ] Modelo de publicação contínua de dados (dados abertos)
- [ ] Expansão: outras condições (HIV, TB, doenças crônicas)

---

## 📖 Referências

### Normativo
- Lei 12.732/2013: Estabelece prazo máximo de 60 dias
- INCA: https://www.inca.gov.br/
- Registro Hospitalar de Câncer: https://irhc.inca.gov.br/

### Acadêmico
- Tufte, E. (2001). *The Visual Display of Quantitative Information*
- Few, S. (2012). *Show Me the Numbers*
- Desigualdade em saúde no Brasil (pesquisas FIOCRUZ, USP)

### Tecnológico
- React 19 Documentation
- Recharts API
- Vite Build Tool
- D3.js Geo Projections

---

## 🎓 Conclusão

Este projeto integra **técnicas de Sistemas de Informação** (processamento de dados, visualização, arquitetura web) com **responsabilidade social** (transparência, cidadania, saúde pública).

Demonstra que a tecnologia pode **transformar dados complexos em conhecimento acessível**, capacitando cidadãos a compreender desigualdades estruturais e exigir direitos — tudo com ética, clareza e intenção de caridade.

---

**Desenvolvido com ♥ para o TCC em Sistemas de Informação**  
*"Informação é cuidado. Transparência é dignidade."*
