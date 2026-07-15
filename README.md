# Observatório da Jornada do Paciente Oncológico

Aplicação web interativa para visualizar o tempo de espera entre diagnóstico e início do tratamento oncológico no Brasil, com base em dados do Registro Hospitalar de Câncer (RHC).

## O que a aplicação mostra

- **Métricas nacionais** — média, mediana e percentual de casos acima do prazo legal de 60 dias (Lei nº 12.732/2012)
- **Mapa do Brasil** — comparação do tempo médio de espera por unidade federativa
- **Análise de desigualdades** — diferenças por sexo, raça/cor, escolaridade e tipo de tumor
- **Filtros por perfil** — consulta personalizada combinando variáveis demográficas e clínicas

## Stack

- React 19 + Vite
- Tailwind CSS 4
- Recharts, d3-geo, topojson-client
- PapaParse (pré-processamento de CSV)

## Como rodar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Dados

Os dados agregados usados pela interface estão em `public/data/`:

| Arquivo | Descrição |
|---------|-----------|
| `aggregates.json` | Agregados nacionais e por UF |
| `profiles.json` | Lookup por perfil demográfico/clínico |
| `brazil-states.json` | Geometria dos estados (mapa) |

O CSV bruto (`rhc.csv`) **não** está no repositório por exceder o limite de 100 MB do GitHub. Ele permanece local e é usado apenas no pré-processamento:

```bash
# Coloque public/data/rhc.csv localmente e rode:
npm run preprocess
```

## Estrutura

```
src/
  components/     # Mapa, métricas, filtros, análise de desigualdade
  utils/          # Carregamento e processamento dos JSON
scripts/
  preprocess.js   # Gera aggregates.json e profiles.json a partir do CSV
public/data/      # Dados consumidos em runtime
```

Material do TCC (`TCC/`, `TCC.zip`, apresentação) fica apenas local e está no `.gitignore`.

## Scripts

| Comando | Função |
|---------|--------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run preprocess` | Regenera JSONs a partir do `rhc.csv` |
| `npm run lint` | ESLint |

## Licença

Projeto acadêmico — uso restrito ao contexto do TCC.
