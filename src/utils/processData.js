// ── label mappings ───────────────────────────────────────────────────────────
export const EDUCATION_LABELS = {
  '1': 'Nenhuma',
  '2': 'Fundamental I',
  '3': 'Fundamental II',
  '4': 'Médio',
  '5': 'Superior',
  '6': 'Não se aplica',
  '9': 'Ignorado',
};

export const TOBACCO_LABELS = {
  '1': 'Nunca fumou',
  '2': 'Ex-fumante',
  '3': 'Fumante',
  '9': 'Ignorado',
};

export const ALCOHOL_LABELS = {
  '1': 'Não',
  '2': 'Ex-etilista',
  '3': 'Sim',
  '9': 'Ignorado',
};

export const SEX_LABELS = {
  '1': 'Masculino',
  '2': 'Feminino',
};

export const RACE_LABELS = {
  '1': 'Branca',
  '2': 'Preta',
  '3': 'Amarela',
  '4': 'Parda',
  '5': 'Indígena',
  '9': 'Ignorado',
};

export const STAGING_LABELS = {
  '0': 'In situ',
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
  '9': 'Ignorado',
};

export const TUMOR_LABELS = {
  'C00-C09': 'Lábio/Cavid.Oral',
  'C10-C19': 'Faringe/Esôfago',
  'C20-C26': 'Cólon/Reto',
  'C30-C39': 'Resp./Intratoráx',
  'C40-C49': 'Osso/Tecido Conj.',
  'C50': 'Mama',
  'C51-C68': 'Geniturinário',
  'C69-C80': 'Sist. Nervoso/Endo',
  'C81-C96': 'Hematopoiético',
  'D': 'In situ / Benigno',
};

// ── main load function ────────────────────────────────────────────────────────
// Carrega agregados e lookup de perfis pré-computados (gerados por scripts/preprocess.js)
// em vez de baixar o CSV bruto de 300+ MB no navegador.
export async function loadAndProcess() {
  const [aggregates, profileLookup] = await Promise.all([
    fetch('/data/aggregates.json').then((r) => r.json()),
    fetch('/data/profiles.json').then((r) => r.json()),
  ]);
  return { ...aggregates, profileLookup };
}


