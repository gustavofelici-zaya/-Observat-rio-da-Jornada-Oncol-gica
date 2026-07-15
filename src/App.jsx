import { useState, useEffect, useMemo } from 'react';
import { loadAndProcess } from './utils/processData';
import MetricsPanel from './components/MetricsPanel';
import BrazilMap from './components/BrazilMap';
import InequalityAnalysis from './components/InequalityAnalysis';
import SmartFilters from './components/SmartFilters';

// ── Design System tokens (mirrored from CSS vars for inline use) ─────────────
const INK      = '#1a1a2e';
const INK60    = '#5a5a7a';
const INK30    = '#b0b0c8';
const INK10    = '#f0f0f5';
const HOPE     = '#00a67c';
const SURFACE  = '#fafaf8';
const WHITE    = '#ffffff';

function SectionTag({ number, label, onDark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: HOPE }}>
        {number}
      </span>
      <span style={{ height: 1, width: 32, background: onDark ? '#2a2a4a' : INK10 }} />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: onDark ? '#5a5a7a' : INK30 }}>
        {label}
      </span>
    </div>
  );
}

function daysToAnchor(days) {
  if (days <= 14)  return 'duas semanas';
  if (days <= 30)  return 'um mês';
  if (days <= 45)  return 'seis semanas';
  if (days <= 60)  return 'dois meses — o limite da lei';
  if (days <= 75)  return `${days - 60} dias além do prazo legal`;
  if (days <= 90)  return 'três meses — tempo de um trimestre';
  if (days <= 120) return 'quatro meses — um terço do ano';
  if (days <= 180) return 'seis meses — metade de um ano';
  return `${Math.round(days / 30)} meses de espera`;
}

export default function App() {
  const [rawData, setRawData]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile]   = useState({ sexo: '', raca: '', instruc: '', tumor: '' });

  useEffect(() => {
    loadAndProcess()
      .then(setRawData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const profileData = useMemo(() => {
    if (!rawData) return null;
    const { sexo, raca, instruc, tumor } = profile;
    if (!sexo && !raca && !instruc && !tumor) return null;
    const key = `${sexo}|${raca}|${instruc}|${tumor}`;
    return rawData.profileLookup[key] ?? null;
  }, [rawData, profile]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100svh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `2px solid ${HOPE}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontFamily: 'var(--font-body)', color: INK30, fontSize: 14 }}>Carregando dados…</p>
          <p style={{ fontFamily: 'var(--font-body)', color: '#3a3a5a', fontSize: 12, marginTop: 6 }}>Aguarde um momento</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100svh', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#1e1e38', border: '0.5px solid #2a2a4a', borderRadius: 16, padding: '2rem', maxWidth: 400, textAlign: 'center' }}>
          <p style={{ color: '#e05c2a', fontWeight: 600, marginBottom: 8 }}>Erro ao carregar dados</p>
          <p style={{ color: INK30, fontSize: 13 }}>{String(error)}</p>
        </div>
      </div>
    );
  }

  const { avgDias, pctAbove60, totalCases, totalWithWait, worstState, bestState } = rawData;

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: SURFACE, color: INK }}>

      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(250,250,248,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `0.5px solid ${INK10}`,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: HOPE, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: INK }}>
              Observatório da Jornada Oncológica
            </span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {[['#lei','A lei'],['#mapa','Mapa'],['#desigualdade','Desigualdade'],['#explore','Explore'],['#metodologia','Metodologia'],['#sobre','Sobre']].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 12, color: INK60, textDecoration: 'none', fontWeight: 500, letterSpacing: '0.01em' }}
                onMouseEnter={e => e.target.style.color = INK}
                onMouseLeave={e => e.target.style.color = INK60}>
                {label}
              </a>
            ))}
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: INK, background: WHITE, border: `0.5px solid rgba(0,0,0,0.15)`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 9h13M3 14h8" />
              </svg>
              Filtrar
            </button>
          </nav>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{ background: INK, minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px 64px' }}>
        <div style={{ maxWidth: 640 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: HOPE, marginBottom: 56 }}>
            Brasil · 2018–2023 · Registro Hospitalar de Câncer
          </p>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 300, color: INK30, lineHeight: 1.6, marginBottom: 8 }}>
            Entre 2018 e 2023, <span style={{ color: WHITE, fontWeight: 400 }}>{totalCases.toLocaleString('pt-BR')} brasileiros</span> receberam diagnóstico de câncer.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 300, color: '#3a3a5a', marginBottom: 56 }}>
            Para eles, o relógio começou no dia do diagnóstico.
          </p>

          {/* Big number */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(5rem,20vw,9rem)', lineHeight: 1, color: WHITE, fontWeight: 400 }}>
              {avgDias}
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: INK30, marginBottom: 6 }}>dias de espera, em média</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: INK30, marginBottom: 8, lineHeight: 1.5 }}>
            {daysToAnchor(avgDias)} entre diagnóstico e tratamento.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#3a3a5a', marginBottom: 56 }}>
            Tempo que o câncer tem para avançar.
          </p>

          {/* Violation callout */}
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'rgba(224,92,42,0.1)', border: '0.5px solid rgba(224,92,42,0.3)', borderRadius: 16, padding: '24px 40px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,8vw,4rem)', lineHeight: 1, color: '#e05c2a' }}>
              {pctAbove60}%
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: INK30, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
              dos pacientes esperaram além dos <strong style={{ color: WHITE, fontWeight: 600 }}>60 dias garantidos por lei</strong>
            </span>
          </div>

          <div style={{ marginTop: 64, color: '#2a2a4a', animation: 'bounce 1.5s ease-in-out infinite' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto', display: 'block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(8px)} }`}</style>
      </section>

      {/* ── 01 · A LEI ────────────────────────────────────────────────── */}
      <section id="lei" style={{ background: WHITE, padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <SectionTag number="01" label="A lei" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,38px)', fontWeight: 400, color: INK, lineHeight: 1.25, marginBottom: 24 }}>
            O sistema tem um prazo.{' '}
            <em style={{ color: HOPE, fontStyle: 'italic' }}>A realidade tem outro.</em>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: INK60, lineHeight: 1.75, marginBottom: 16, maxWidth: 560 }}>
            A <strong style={{ color: INK }}>Lei nº 12.732 de 2012</strong> garante que todo paciente
            com diagnóstico confirmado de câncer tem o direito de iniciar o tratamento em até{' '}
            <strong style={{ color: INK }}>60 dias</strong> pelo SUS.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: INK60, lineHeight: 1.75, marginBottom: 64, maxWidth: 560 }}>
            A espera média de <strong style={{ color: '#e05c2a' }}>{avgDias} dias</strong> representa{' '}
            {avgDias > 60 ? <><strong style={{ color: '#e05c2a' }}>{avgDias - 60} dias além do prazo</strong> garantido em lei.</> : <>menos que o prazo legal — mas os números individuais contam outra história.</>}{' '}
            Para <strong style={{ color: '#e05c2a' }}>{pctAbove60}%</strong> dos pacientes, esse direito simplesmente não se cumpre.
          </p>
          <MetricsPanel data={rawData} />
        </div>
      </section>

      {/* ── 02 · A GEOGRAFIA ──────────────────────────────────────────── */}
      <section id="mapa" style={{ background: SURFACE, padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto 56px' }}>
          <SectionTag number="02" label="A geografia" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,38px)', fontWeight: 400, color: INK, lineHeight: 1.25, marginBottom: 24 }}>
            Onde você mora determina<br />quanto tempo você espera.
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: INK60, lineHeight: 1.75, marginBottom: 32, maxWidth: 560 }}>
            No Brasil, um paciente oncológico pode aguardar semanas a menos — ou a mais — dependendo
            apenas do estado onde vive.
          </p>
          {worstState && bestState && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#fdf0e8', border: '0.5px solid rgba(224,92,42,0.2)', borderRadius: 16, padding: '20px 24px' }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e05c2a', marginBottom: 8 }}>Maior espera</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: '#e05c2a', lineHeight: 1 }}>{worstState.label}</p>
                <p style={{ fontSize: 13, color: INK60, marginTop: 6 }}>{worstState.avgDias} dias em média</p>
                <p style={{ fontSize: 11, color: INK30, marginTop: 2 }}>{worstState.count.toLocaleString('pt-BR')} casos</p>
              </div>
              <div style={{ background: '#e0f5ef', border: '0.5px solid rgba(0,166,124,0.2)', borderRadius: 16, padding: '20px 24px' }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: HOPE, marginBottom: 8 }}>Menor espera</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: HOPE, lineHeight: 1 }}>{bestState.label}</p>
                <p style={{ fontSize: 13, color: INK60, marginTop: 6 }}>{bestState.avgDias} dias em média</p>
                <p style={{ fontSize: 11, color: INK30, marginTop: 2 }}>{bestState.count.toLocaleString('pt-BR')} casos</p>
              </div>
            </div>
          )}
        </div>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <BrazilMap stateMap={rawData.stateMap} byState={rawData.byState} />
        </div>
      </section>

      {/* ── 03 · A DESIGUALDADE ───────────────────────────────────────── */}
      <section id="desigualdade" style={{ background: WHITE, padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto 56px' }}>
          <SectionTag number="03" label="A desigualdade" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,38px)', fontWeight: 400, color: INK, lineHeight: 1.25, marginBottom: 24 }}>
            A espera não é igual<br />para todos.
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: INK60, lineHeight: 1.75, maxWidth: 560 }}>
            Escolaridade, raça e o tipo de câncer também determinam quanto tempo um paciente aguarda.
            Os dados revelam desigualdades estruturais que se manifestam diretamente na saúde.
          </p>
        </div>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <InequalityAnalysis data={rawData} />
        </div>
      </section>

      {/* ── 04 · EXPLORE ────────────────────────────────────────────── */}
      <section id="explore" style={{ background: INK, padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <SectionTag number="04" label="Explore" onDark />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,38px)', fontWeight: 400, color: WHITE, lineHeight: 1.25, marginBottom: 16 }}>
            E para alguém como você?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: INK30, lineHeight: 1.75, marginBottom: 56, maxWidth: 520 }}>
            Selecione as características que mais se aproximam do seu perfil e veja como foi a jornada de pacientes similares.
          </p>
          <SmartFilters
            profile={profile}
            onChange={setProfile}
            profileData={profileData}
            globalAvg={rawData.avgDias}
            globalPct60={rawData.pctAbove60}
          />
        </div>
      </section>

      {/* ── 05 · METODOLOGIA ────────────────────────────────── */}
      <section id="metodologia" style={{ background: SURFACE, padding: '72px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <SectionTag number="05" label="Metodologia" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 400, color: INK, lineHeight: 1.25, marginBottom: 32 }}>
            Como lemos esses dados
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ background: WHITE, borderRadius: 12, padding: '20px 24px', border: `0.5px solid ${INK10}` }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK30, marginBottom: 8 }}>Fonte dos dados</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: INK60, lineHeight: 1.75 }}>
                <strong style={{ color: INK }}>Registro Hospitalar de Câncer (IRHC) 2018–2023</strong> — Hospital de Amor, Barretos (SP).
                O RHC é o sistema nacional de registro de pacientes oncológicos, alimentado por hospitais habilitados pelo SUS para tratamento de câncer.
              </p>
            </div>

            <div style={{ background: WHITE, borderRadius: 12, padding: '20px 24px', border: `0.5px solid ${INK10}` }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK30, marginBottom: 8 }}>O que é “tempo de espera”</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: INK60, lineHeight: 1.75 }}>
                Calculamos o número de dias entre o campo <strong style={{ color: INK }}>DTDIAGNO</strong> (data do diagnóstico) e{' '}
                <strong style={{ color: INK }}>DATAINITRT</strong> (data de início do tratamento). Registros com datas ausentes,
                inválidas ou com intervalo superior a 10 anos foram excluídos.
              </p>
            </div>

            <div style={{ background: WHITE, borderRadius: 12, padding: '20px 24px', border: `0.5px solid ${INK10}` }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK30, marginBottom: 8 }}>Registros analisados</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: INK60, lineHeight: 1.75 }}>
                De <strong style={{ color: INK }}>{totalCases.toLocaleString('pt-BR')}</strong> registros totais,{' '}
                <strong style={{ color: INK }}>{totalWithWait.toLocaleString('pt-BR')}</strong> possuíam datas válidas para calcular o tempo de espera{' '}
                ({Math.round((totalWithWait / totalCases) * 100)}% do total). Os demais foram excluídos das análises de espera,
                mas incluídos nas contagens gerais.
              </p>
            </div>

            <div style={{ background: WHITE, borderRadius: 12, padding: '20px 24px', border: `0.5px solid ${INK10}` }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK30, marginBottom: 8 }}>Limitações e cuidados</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: INK60, lineHeight: 1.75 }}>
                Diferenças entre grupos (raça, escolaridade) podem refletir variáveis confundidoras como tipo de tumor
                e estágio ao diagnóstico. Analisamos essas variáveis separadamente para distinguir os fenômenos.
                Os dados cobrem apenas pacientes registrados em hospitais habilitados — casos tratados exclusivamente
                em atenção básica não estão incluídos.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 06 · SOBRE ────────────────────────────────────────────────── */}
      <section id="sobre" style={{ background: INK, padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <SectionTag number="06" label="Fontes e missão" onDark />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,38px)', fontWeight: 400, color: WHITE, lineHeight: 1.25, marginBottom: 40 }}>
            De onde vêm esses dados —<br />e por que existem.
          </h2>

          {/* Data source card */}
          <div style={{ background: '#0e0e22', border: '0.5px solid #2a2a4a', borderRadius: 16, padding: '28px 32px', marginBottom: 16 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: HOPE, marginBottom: 14 }}>
              Fonte dos dados
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: WHITE, marginBottom: 14, lineHeight: 1.3 }}>
              Registro Hospitalar de Câncer — IRHC/INCA
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: INK30, lineHeight: 1.8, marginBottom: 24 }}>
              Os dados utilizados nesta plataforma são provenientes do{' '}
              <strong style={{ color: WHITE }}>Sistema de Informações do Registro Hospitalar de Câncer (IRHC)</strong>,
              mantido pelo Instituto Nacional de Câncer (INCA). O IRHC é o sistema nacional de registro
              de pacientes oncológicos, alimentado por hospitais habilitados pelo SUS em todo o Brasil.
              Os dados de 2018 a 2023 cobrem {totalCases.toLocaleString('pt-BR')} registros de pacientes.
            </p>
            <a
              href="https://irhc.inca.gov.br/RHCNet/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                color: HOPE, textDecoration: 'none',
                border: '1px solid rgba(0,166,124,0.35)', borderRadius: 10,
                padding: '10px 18px',
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Acessar portal IRHC — irhc.inca.gov.br
            </a>
          </div>

          {/* Public data card */}
          <div style={{ background: '#0e0e22', border: '0.5px solid #2a2a4a', borderRadius: 16, padding: '28px 32px', marginBottom: 16 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: HOPE, marginBottom: 14 }}>
              Dados públicos
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: WHITE, marginBottom: 14, lineHeight: 1.3 }}>
              Qualquer pessoa pode consultar essas informações
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: INK30, lineHeight: 1.8 }}>
              O IRHC disponibiliza seus dados de forma pública e gratuita. Pacientes, familiares,
              pesquisadores e qualquer cidadão podem acessar o portal e buscar informações sobre
              o sistema de atenção oncológica no Brasil. Transparência nos dados de saúde é um
              direito — e usar esses dados para entender o sistema é uma forma de exercer a cidadania.
            </p>
          </div>

          {/* Mission card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,166,124,0.07) 0%, rgba(0,107,82,0.10) 100%)',
            border: '0.5px solid rgba(0,166,124,0.22)', borderRadius: 16, padding: '36px 32px',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: HOPE, marginBottom: 16 }}>
              Nossa intenção
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,30px)', color: WHITE, lineHeight: 1.35, marginBottom: 24 }}>
              Feito de coração, para quem precisa.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: INK30, lineHeight: 1.85, marginBottom: 16 }}>
              Esta plataforma foi criada com uma única intenção:{' '}
              <strong style={{ color: WHITE }}>tornar visível o que é muitas vezes invisível</strong>.
              Para que qualquer pessoa — paciente, familiar, cuidador ou cidadão — possa compreender
              a realidade da espera oncológica no Brasil com dados reais, linguagem acessível e
              respeito pela gravidade do tema.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: INK30, lineHeight: 1.85, marginBottom: 24 }}>
              Não há interesse comercial, político ou institucional aqui. Só a convicção de que{' '}
              <strong style={{ color: WHITE }}>informação é cuidado</strong> — e que ninguém deve
              esperar mais do que o necessário para receber um tratamento que pode salvar sua vida.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#4a4a6a', lineHeight: 1.75, fontStyle: 'italic' }}>
              Se este projeto ajudou você a entender algo, a fazer uma pergunta melhor ao médico,
              a exigir um direito ou simplesmente a saber que não está sozinho — já valeu a pena.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ background: '#07070f', padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: HOPE }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: INK30, letterSpacing: '0.06em' }}>
              Observatório da Jornada Oncológica
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#3a3a5a', lineHeight: 1.7, marginBottom: 10 }}>
            Feito com ♥ e intenção de caridade — para ajudar a todos.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#2a2a4a', lineHeight: 1.6, marginBottom: 4 }}>
            Dados: Registro Hospitalar de Câncer (IRHC) 2018–2023 · INCA ·{' '}
            <a href="https://irhc.inca.gov.br/RHCNet/" target="_blank" rel="noopener noreferrer"
              style={{ color: '#2a4a3a', textDecoration: 'underline' }}>irhc.inca.gov.br</a>
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#1e1e30', marginTop: 6 }}>
            {totalCases.toLocaleString('pt-BR')} registros · dados públicos
          </p>
        </div>
      </footer>

      {/* ── FILTER DRAWER ─────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, backdropFilter: 'blur(4px)' }}
            onClick={() => setDrawerOpen(false)}
          />
          <div style={{ position: 'fixed', right: 0, top: 0, height: '100%', width: 360, background: WHITE, zIndex: 51, boxShadow: '-8px 0 40px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `0.5px solid ${INK10}`, flexShrink: 0 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: INK }}>Explorar perfil</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK30, marginTop: 2 }}>Filtre por características</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: INK30, padding: 4 }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <SmartFilters
                profile={profile}
                onChange={setProfile}
                profileData={profileData}
                globalAvg={rawData.avgDias}
                globalPct60={rawData.pctAbove60}
                drawerMode
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
