/**
 * scripts/preprocess.js
 *
 * Lê public/data/rhc.csv e gera dois arquivos pequenos:
 *   public/data/aggregates.json  — todos os agregados (gráficos, KPIs, tabelas)
 *   public/data/profiles.json   — lookup pré-computado para o SmartFilters
 *
 * Uso: node scripts/preprocess.js
 * (Adicione ao package.json: "preprocess": "node scripts/preprocess.js")
 */

import { createReadStream, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(__dirname, '../public/data/rhc.csv');
const OUT_AGG  = resolve(__dirname, '../public/data/aggregates.json');
const OUT_PROF = resolve(__dirname, '../public/data/profiles.json');

// ── label mappings (espelho do processData.js) ───────────────────────────────
const EDUCATION_LABELS = { '1': 'Nenhuma', '2': 'Fundamental I', '3': 'Fundamental II', '4': 'Médio', '5': 'Superior', '6': 'Não se aplica', '9': 'Ignorado' };
const TOBACCO_LABELS   = { '1': 'Nunca fumou', '2': 'Ex-fumante', '3': 'Fumante', '9': 'Ignorado' };
const ALCOHOL_LABELS   = { '1': 'Não', '2': 'Ex-etilista', '3': 'Sim', '9': 'Ignorado' };
const SEX_LABELS       = { '1': 'Masculino', '2': 'Feminino' };
const RACE_LABELS      = { '1': 'Branca', '2': 'Preta', '3': 'Amarela', '4': 'Parda', '5': 'Indígena', '9': 'Ignorado' };
const STAGING_LABELS   = { '0': 'In situ', '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '9': 'Ignorado' };

function tumorGroup(code) {
  if (!code) return 'Outro';
  const c = code.toUpperCase();
  if (c.startsWith('C50')) return 'Mama';
  const num = parseInt(c.replace(/[^0-9]/g, ''), 10);
  if (num >= 0  && num <= 9)  return 'Lábio/Cavid.Oral';
  if (num >= 10 && num <= 19) return 'Faringe/Esôfago';
  if (num >= 20 && num <= 26) return 'Cólon/Reto';
  if (num >= 30 && num <= 39) return 'Resp./Intratoráx';
  if (num >= 40 && num <= 49) return 'Osso/Tecido Conj.';
  if (num >= 51 && num <= 68) return 'Geniturinário';
  if (num >= 69 && num <= 80) return 'Sist. Nervoso/Endo';
  if (num >= 81 && num <= 96) return 'Hematopoiético';
  if (c.startsWith('D')) return 'In situ / Benigno';
  return 'Outro';
}

function parseBrDate(str) {
  if (!str || str.trim() === '' || str === '00/00/0000') return null;
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length < 4) return null;
  const ts = Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return isNaN(ts) ? null : ts;
}

function daysBetween(a, b) {
  if (a == null || b == null) return null;
  const days = Math.round((b - a) / 86400000);
  return (days >= 0 && days <= 3650) ? days : null;
}

// ── acumuladores ─────────────────────────────────────────────────────────────
// groupAvg: key → { sum, count, min, max }
const stateAcc     = {};
const instrucAcc   = {};
const tabagismAcc  = {};
const alcoolAcc    = {};
const sexoAvgAcc   = {};
const racaAvgAcc   = {};
const stadiamAcc   = {};
const tumorAcc     = {};
// groupCount: key → count
const sexoCountAcc = {};
const racaCountAcc = {};
// groupStats: key → diasEspera[]
const racaStats    = {};
const instrucStats = {};
const sexoStats    = {};
const tabagismStats = {};
const alcoolStats  = {};
// byYear: year → { sum, count, total, ab60, min, max }
const yearAcc = {};
// cross-tabs
const raceByTumorAcc   = {}; // raceCode → { total, tumorCounts: {} }
const raceByStagingAcc = {}; // raceCode → { total, advanced }
const eduByStagingAcc  = {}; // instrucCode → { total, advanced }
const tumorStagingAcc  = {}; // tumorLabel → { sum, validCount, totalCount, advanced }
const tumorFreqAcc     = {}; // tumorLabel → { count, validCount, sum }

// métricas globais
let totalCases    = 0;
let totalWithWait = 0;
let sumDias       = 0;
let globalAb60    = 0;
let globalAb30    = 0;
let advancedAtDiag = 0;
let diagStaged    = 0;
let ignoredRaceCount = 0;
let ignoredEduCount  = 0;

// histograma global para mediana (0–3650 dias)
const globalHist = new Uint32Array(3651);

// distribuição de espera (4 buckets)
let distB1 = 0, distB2 = 0, distB3 = 0, distB4 = 0;

// ── SmartFilters: lookup pré-computado ───────────────────────────────────────
// Valores aceitos por cada dimensão (coincidem com as opções do SmartFilters)
const VALID_SEXO   = new Set(['1', '2']);
const VALID_RACA   = new Set(['1', '2', '3', '4', '5']);
const VALID_INSTRUC = new Set(['1', '2', '3', '4', '5']);
const VALID_TUMOR  = new Set([
  'Mama', 'Geniturinário', 'Cólon/Reto', 'Resp./Intratoráx',
  'Hematopoiético', 'Lábio/Cavid.Oral', 'Faringe/Esôfago', 'Sist. Nervoso/Endo',
]);

// profiles: key "sexo|raca|instruc|tumor" → { count, validCount, sum, ab60, hist }
const profiles = {};

// ── helpers ───────────────────────────────────────────────────────────────────
function addGA(acc, key, dias) {
  if (!key || dias == null) return;
  if (!acc[key]) acc[key] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
  acc[key].sum += dias;
  acc[key].count++;
  if (dias < acc[key].min) acc[key].min = dias;
  if (dias > acc[key].max) acc[key].max = dias;
}

function addGS(acc, key, dias) {
  if (!key || dias == null) return;
  if (!acc[key]) acc[key] = [];
  acc[key].push(dias);
}

function addGC(acc, key) {
  if (!key) return;
  acc[key] = (acc[key] || 0) + 1;
}

function finishGroupAvg(acc, labelMap) {
  return Object.entries(acc)
    .map(([label, { sum, count, min, max }]) => ({
      label: labelMap ? (labelMap[label] || label) : label,
      avgDias: Math.round(sum / count),
      minDias: min,
      maxDias: max,
      count,
    }))
    .sort((a, b) => b.avgDias - a.avgDias);
}

function finishGroupCount(acc, labelMap) {
  return Object.entries(acc)
    .map(([label, count]) => ({ label: labelMap ? (labelMap[label] || label) : label, count }));
}

function finishGroupStats(acc, labelMap) {
  return Object.entries(acc)
    .map(([label, vals]) => {
      const sorted = vals.sort((a, b) => a - b);
      const avg    = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
      const median = sorted[Math.floor(sorted.length / 2)];
      const pct60  = Math.round((vals.filter((v) => v > 60).length / vals.length) * 100);
      return { label: labelMap ? (labelMap[label] || label) : label, avgDias: avg, medianDias: median, pct60, count: vals.length };
    })
    .sort((a, b) => b.avgDias - a.avgDias);
}

// ── processar uma linha ───────────────────────────────────────────────────────
function processRow(row) {
  const diasEspera = daysBetween(parseBrDate(row.DTDIAGNO), parseBrDate(row.DATAINITRT));
  const estadRes   = (row.ESTADRES  || '').trim().toUpperCase();
  const instruc    = (row.INSTRUC   || '9').trim();
  const alcool     = (row.ALCOOLIS  || '9').trim();
  const tabagism   = (row.TABAGISM  || '9').trim();
  const sexo       = (row.SEXO      || '').trim();
  const raca       = (row.RACACOR   || '').trim();
  const estadiam   = (row.ESTADIAM  || '9').trim();
  const tumor      = tumorGroup(row.LOCTUDET || row.LOCTUPRI);
  const anopridi   = parseInt(row.ANOPRIDI   || '0', 10);

  totalCases++;
  if (!raca || raca === '9') ignoredRaceCount++;
  if (!instruc || instruc === '9') ignoredEduCount++;

  // byYear
  if (anopridi >= 2015 && anopridi <= 2024) {
    if (!yearAcc[anopridi]) yearAcc[anopridi] = { sum: 0, count: 0, total: 0, ab60: 0, min: Infinity, max: -Infinity };
    yearAcc[anopridi].total++;
    if (diasEspera != null) {
      yearAcc[anopridi].sum += diasEspera;
      yearAcc[anopridi].count++;
      if (diasEspera > 60) yearAcc[anopridi].ab60++;
      if (diasEspera < yearAcc[anopridi].min) yearAcc[anopridi].min = diasEspera;
      if (diasEspera > yearAcc[anopridi].max) yearAcc[anopridi].max = diasEspera;
    }
  }

  // staging
  if (estadiam && estadiam !== '9') diagStaged++;
  if (estadiam === '3' || estadiam === '4') advancedAtDiag++;

  // cross-tabs
  if (raca && raca !== '9') {
    if (!raceByTumorAcc[raca]) raceByTumorAcc[raca] = { total: 0, tumorCounts: {} };
    raceByTumorAcc[raca].total++;
    if (tumor && tumor !== 'Outro') {
      raceByTumorAcc[raca].tumorCounts[tumor] = (raceByTumorAcc[raca].tumorCounts[tumor] || 0) + 1;
    }
    if (!raceByStagingAcc[raca]) raceByStagingAcc[raca] = { total: 0, advanced: 0 };
    raceByStagingAcc[raca].total++;
    if (estadiam === '3' || estadiam === '4') raceByStagingAcc[raca].advanced++;
  }
  if (instruc && instruc !== '9' && instruc !== '6') {
    if (!eduByStagingAcc[instruc]) eduByStagingAcc[instruc] = { total: 0, advanced: 0 };
    eduByStagingAcc[instruc].total++;
    if (estadiam === '3' || estadiam === '4') eduByStagingAcc[instruc].advanced++;
  }
  if (tumor && tumor !== 'Outro' && tumor !== 'In situ / Benigno') {
    if (!tumorStagingAcc[tumor]) tumorStagingAcc[tumor] = { sum: 0, validCount: 0, totalCount: 0, advanced: 0 };
    tumorStagingAcc[tumor].totalCount++;
    if (diasEspera != null) { tumorStagingAcc[tumor].sum += diasEspera; tumorStagingAcc[tumor].validCount++; }
    if (estadiam === '3' || estadiam === '4') tumorStagingAcc[tumor].advanced++;
  }

  // contagens brutas
  addGC(sexoCountAcc, sexo || null);
  addGC(racaCountAcc, raca || null);

  // tumorFreq (todas as linhas)
  if (tumor && tumor !== 'Outro' && tumor !== 'In situ / Benigno') {
    if (!tumorFreqAcc[tumor]) tumorFreqAcc[tumor] = { count: 0, validCount: 0, sum: 0 };
    tumorFreqAcc[tumor].count++;
    if (diasEspera != null) { tumorFreqAcc[tumor].sum += diasEspera; tumorFreqAcc[tumor].validCount++; }
  }

  // métricas só para linhas com espera válida
  if (diasEspera != null) {
    totalWithWait++;
    sumDias += diasEspera;
    if (diasEspera > 60) globalAb60++;
    if (diasEspera > 30) globalAb30++;
    globalHist[diasEspera]++;
    if (diasEspera <= 30)       distB1++;
    else if (diasEspera <= 60)  distB2++;
    else if (diasEspera <= 120) distB3++;
    else                        distB4++;

    if (estadRes) addGA(stateAcc,    estadRes, diasEspera);
    if (instruc)  addGA(instrucAcc,  instruc,  diasEspera);
    if (tabagism) addGA(tabagismAcc, tabagism, diasEspera);
    if (alcool)   addGA(alcoolAcc,   alcool,   diasEspera);
    if (sexo)     addGA(sexoAvgAcc,  sexo,     diasEspera);
    if (raca)     addGA(racaAvgAcc,  raca,     diasEspera);
    if (estadiam) addGA(stadiamAcc,  estadiam, diasEspera);
    if (tumor)    addGA(tumorAcc,    tumor,    diasEspera);

    if (raca)     addGS(racaStats,    raca,    diasEspera);
    if (instruc)  addGS(instrucStats, instruc, diasEspera);
    if (sexo)     addGS(sexoStats,    sexo,    diasEspera);
    if (tabagism) addGS(tabagismStats, tabagism, diasEspera);
    if (alcool)   addGS(alcoolStats,  alcool,  diasEspera);
  }

  // ── SmartFilters lookup ─────────────────────────────────────────────────────
  const sVal = VALID_SEXO.has(sexo)    ? sexo    : null;
  const rVal = VALID_RACA.has(raca)    ? raca    : null;
  const iVal = VALID_INSTRUC.has(instruc) ? instruc : null;
  const tVal = VALID_TUMOR.has(tumor)  ? tumor   : null;

  const sVals = sVal ? [sVal, ''] : [''];
  const rVals = rVal ? [rVal, ''] : [''];
  const iVals = iVal ? [iVal, ''] : [''];
  const tVals = tVal ? [tVal, ''] : [''];

  for (const s of sVals) {
    for (const r of rVals) {
      for (const i of iVals) {
        for (const t of tVals) {
          if (!s && !r && !i && !t) continue; // pula o combo "tudo vazio"
          const key = `${s}|${r}|${i}|${t}`;
          let g = profiles[key];
          if (!g) {
            g = { count: 0, validCount: 0, sum: 0, ab60: 0, hist: new Uint32Array(3651) };
            profiles[key] = g;
          }
          g.count++;
          if (diasEspera != null) {
            g.validCount++;
            g.sum += diasEspera;
            if (diasEspera > 60) g.ab60++;
            g.hist[diasEspera]++;
          }
        }
      }
    }
  }
}

// ── streaming do CSV ─────────────────────────────────────────────────────────
console.log('Iniciando pré-processamento de rhc.csv...');
const start = Date.now();

let headers = null;
let lineCount = 0;

const rl = createInterface({
  input: createReadStream(CSV_PATH, { encoding: 'latin1' }),
  crlfDelay: Infinity,
});

await new Promise((resolve, reject) => {
  rl.on('line', (line) => {
    lineCount++;
    if (lineCount === 1) {
      headers = line.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      return;
    }
    if (!line.trim()) return;
    const parts = line.split(',');
    const row = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = (parts[i] || '').replace(/^"|"$/g, '');
    }
    processRow(row);
    if (lineCount % 200000 === 0) {
      process.stdout.write(`\r  Linhas processadas: ${(lineCount / 1e6).toFixed(2)}M`);
    }
  });
  rl.on('close', resolve);
  rl.on('error', reject);
});

console.log(`\n  Total: ${lineCount.toLocaleString('pt-BR')} linhas`);

// ── finalizar agregados ───────────────────────────────────────────────────────

// mediana global por histograma
let medTarget = Math.floor(totalWithWait / 2);
let cumS = 0;
let medianDias = 0;
for (let d = 0; d <= 3650; d++) {
  cumS += globalHist[d];
  if (cumS > medTarget) { medianDias = d; break; }
}

const avgDias    = totalWithWait ? Math.round(sumDias / totalWithWait) : 0;
const pctAbove60 = totalWithWait ? Math.round((globalAb60 / totalWithWait) * 100) : 0;
const pctAbove30 = totalWithWait ? Math.round((globalAb30 / totalWithWait) * 100) : 0;

// byState
const byState = finishGroupAvg(stateAcc);
const stateMap = Object.fromEntries(byState.map((d) => [d.label, d.avgDias]));
const statesOK = byState.filter((d) => d.count >= 100);
const worstState = statesOK[0] ?? null;
const bestState  = statesOK[statesOK.length - 1] ?? null;

// byYear
const byYear = Object.entries(yearAcc)
  .map(([year, { sum, count, total, ab60, min, max }]) => ({
    year: parseInt(year, 10),
    avgDias: count ? Math.round(sum / count) : null,
    pct60:   count ? Math.round((ab60 / count) * 100) : null,
    minDias: count ? min : null,
    maxDias: count ? max : null,
    total,
    count,
  }))
  .sort((a, b) => a.year - b.year);

// educação
const byEducation = finishGroupAvg(instrucAcc, EDUCATION_LABELS);
const eduFilt = byEducation.filter((d) => d.label !== 'Ignorado' && d.label !== 'Não se aplica' && d.count >= 50);
const educationGap = eduFilt.length >= 2 ? Math.abs(eduFilt[0].avgDias - eduFilt[eduFilt.length - 1].avgDias) : 0;

const byTobacco = finishGroupAvg(tabagismAcc, TOBACCO_LABELS);
const byAlcohol = finishGroupAvg(alcoolAcc,   ALCOHOL_LABELS);
const bySex     = finishGroupCount(sexoCountAcc, SEX_LABELS);
const byRace    = finishGroupCount(racaCountAcc, RACE_LABELS);
const byRaceAvg = finishGroupAvg(racaAvgAcc, RACE_LABELS);
const bySexAvg  = finishGroupAvg(sexoAvgAcc, SEX_LABELS);
const byStaging = finishGroupAvg(stadiamAcc, STAGING_LABELS).filter((d) => d.label !== 'Ignorado');
const byTumor   = finishGroupAvg(tumorAcc).slice(0, 10);

const byRaceStats = finishGroupStats(racaStats, RACE_LABELS)
  .filter((d) => d.label !== 'Ignorado' && d.count >= 50);
const byEducationStats = finishGroupStats(instrucStats, EDUCATION_LABELS)
  .filter((d) => d.label !== 'Ignorado' && d.label !== 'Não se aplica' && d.count >= 50);
const bySexStats = finishGroupStats(sexoStats, SEX_LABELS)
  .filter((d) => d.label !== 'Ignorado');
const byTobaccoStats = finishGroupStats(tabagismStats, TOBACCO_LABELS)
  .filter((d) => d.label !== 'Ignorado' && d.count >= 100);
const byAlcoholStats = finishGroupStats(alcoolStats, ALCOHOL_LABELS)
  .filter((d) => d.label !== 'Ignorado' && d.count >= 100);

// raceByTumor
const topRaces = Object.entries(raceByTumorAcc)
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 4)
  .map(([k]) => k);
const raceByTumor = topRaces.map((rc) => {
  const { total, tumorCounts } = raceByTumorAcc[rc];
  const tumorDist = Object.entries(tumorCounts)
    .map(([t, cnt]) => ({ tumor: t, pct: Math.round((cnt / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
  return { race: RACE_LABELS[rc] || rc, total, tumorDist };
});

// raceByStaging
const raceByStaging = Object.entries(raceByStagingAcc)
  .filter(([, v]) => v.total >= 100)
  .map(([label, { total, advanced }]) => ({
    label: RACE_LABELS[label] || label,
    pctAdvanced: Math.round((advanced / total) * 100),
    count: total,
  }))
  .sort((a, b) => b.pctAdvanced - a.pctAdvanced);

// eduByStaging
const eduOrder = ['Nenhuma', 'Fundamental I', 'Fundamental II', 'Médio', 'Superior'];
const eduByStaging = Object.entries(eduByStagingAcc)
  .filter(([, v]) => v.total >= 50)
  .map(([label, { total, advanced }]) => ({
    label: EDUCATION_LABELS[label] || label,
    pctAdvanced: Math.round((advanced / total) * 100),
    count: total,
  }))
  .sort((a, b) => eduOrder.indexOf(a.label) - eduOrder.indexOf(b.label));

// tumorWithStaging
const tumorWithStaging = Object.entries(tumorStagingAcc)
  .filter(([, v]) => v.validCount >= 50)
  .map(([label, v]) => ({
    label,
    avgDias: Math.round(v.sum / v.validCount),
    pctAdvanced: Math.round((v.advanced / v.totalCount) * 100),
    count: v.validCount,
  }))
  .sort((a, b) => b.avgDias - a.avgDias);

// tumorFreq
const tumorFreq = Object.entries(tumorFreqAcc)
  .map(([label, v]) => ({
    label,
    count: v.count,
    avgDias: v.validCount ? Math.round(v.sum / v.validCount) : 0,
  }))
  .sort((a, b) => b.count - a.count);

const ignoredRacePct = Math.round((ignoredRaceCount / totalCases) * 100);
const ignoredEduPct  = Math.round((ignoredEduCount  / totalCases) * 100);
const pctAdvancedDiag = diagStaged > 0 ? Math.round((advancedAtDiag / diagStaged) * 100) : 0;

// distribuição de espera (substitui WaitDistribution rows)
const waitDistribution = {
  total: totalWithWait,
  buckets: [
    { label: 'Até 30 dias',       color: '#00a67c', count: distB1, pct: Math.round((distB1 / totalWithWait) * 100) },
    { label: '31 a 60 dias',      color: '#c8860a', count: distB2, pct: Math.round((distB2 / totalWithWait) * 100) },
    { label: '61 a 120 dias',     color: '#e05c2a', count: distB3, pct: Math.round((distB3 / totalWithWait) * 100) },
    { label: 'Acima de 120 dias', color: '#c0392b', count: distB4, pct: Math.round((distB4 / totalWithWait) * 100) },
  ],
};

// ── escrever aggregates.json ──────────────────────────────────────────────────
const aggregates = {
  totalCases, totalWithWait, avgDias, medianDias,
  pctAbove60, pctAbove30, worstState, bestState, educationGap,
  byState, byYear, byEducation, byEducationStats,
  byTobacco, byAlcohol, bySex, bySexAvg, bySexStats,
  byRace, byRaceAvg, byRaceStats,
  byStaging, byTumor, byTobaccoStats, byAlcoholStats,
  tumorFreq, pctAdvancedDiag,
  raceByTumor, raceByStaging, eduByStaging, tumorWithStaging,
  ignoredRacePct, ignoredEduPct, stateMap, waitDistribution,
};

writeFileSync(OUT_AGG, JSON.stringify(aggregates));
const aggKB = (JSON.stringify(aggregates).length / 1024).toFixed(0);
console.log(`  aggregates.json: ${aggKB} KB`);

// ── escrever profiles.json ────────────────────────────────────────────────────
const profilesOut = {};
for (const [key, g] of Object.entries(profiles)) {
  if (!g.validCount) {
    profilesOut[key] = { count: g.count, validCount: 0, avg: null, pct60: null, median: null };
    continue;
  }
  const avg   = Math.round(g.sum / g.validCount);
  const pct60 = Math.round((g.ab60 / g.validCount) * 100);
  // mediana pelo histograma
  const half = Math.floor(g.validCount / 2);
  let cSum = 0, median = 0;
  for (let d = 0; d <= 3650; d++) {
    cSum += g.hist[d];
    if (cSum > half) { median = d; break; }
  }
  profilesOut[key] = { count: g.count, validCount: g.validCount, avg, pct60, median };
}

writeFileSync(OUT_PROF, JSON.stringify(profilesOut));
const profKB = (JSON.stringify(profilesOut).length / 1024).toFixed(0);
console.log(`  profiles.json: ${profKB} KB`);
console.log(`  Concluído em ${((Date.now() - start) / 1000).toFixed(1)}s`);
