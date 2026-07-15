// Design System tokens
const INK     = '#1a1a2e';
const INK60   = '#5a5a7a';
const INK30   = '#b0b0c8';
const INK10   = '#f0f0f5';
const HOPE    = '#00a67c';
const HOPE_L  = '#e0f5ef';
const HOPE_D  = '#006b52';
const ALERT   = '#e05c2a';
const WAIT    = '#c8860a';
const WAIT_L  = '#fdf6e3';
const WHITE   = '#ffffff';
const SURFACE = '#fafaf8';

function waitColor(days) {
  if (days <= 30) return HOPE;
  if (days <= 60) return WAIT;
  return ALERT;
}

function NarrativeBlock({ title, children, callout }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: INK, lineHeight: 1.3, marginBottom: 12 }}>
        {title}
      </h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: INK60, lineHeight: 1.75 }}>{children}</p>
      {callout && (
        <div style={{ marginTop: 16, borderLeft: `2px solid ${HOPE}`, paddingLeft: 16 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: INK60, fontStyle: 'italic', lineHeight: 1.65 }}>{callout}</p>
        </div>
      )}
    </div>
  );
}

// Table showing avg, median, pct60 per group
function MetricTable({ data }) {
  return (
    <div style={{ background: SURFACE, border: `0.5px solid ${INK10}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 130px 76px', padding: '10px 20px', background: INK10 }}>
        {['Grupo', 'Média', 'Mediana', '% acima de 60 dias', 'Casos'].map((h) => (
          <span key={h} style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK30 }}>{h}</span>
        ))}
      </div>
      {data.map((d, i) => {
        const avgColor = waitColor(d.avgDias);
        const pctColor = d.pct60 > 60 ? ALERT : d.pct60 > 40 ? WAIT : HOPE_D;
        return (
          <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 130px 76px', padding: '13px 20px', borderBottom: i < data.length - 1 ? `0.5px solid ${INK10}` : 'none', background: WHITE }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: INK }}>{d.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: avgColor, lineHeight: 1 }}>{d.avgDias}<span style={{ fontSize: 11, color: INK30, fontFamily: 'var(--font-body)' }}> d</span></span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: INK60, alignSelf: 'center' }}>{d.medianDias} dias</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 5, background: INK10, borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, d.pct60)}%`, background: pctColor, borderRadius: 100 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: pctColor, minWidth: 30 }}>{d.pct60}%</span>
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, alignSelf: 'center' }}>{d.count.toLocaleString('pt-BR')}</span>
          </div>
        );
      })}
    </div>
  );
}

// Horizontal bars showing % in advanced staging per group
function StagingBars({ data, title, sub }) {
  return (
    <div style={{ background: WHITE, border: `0.5px solid ${INK10}`, borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK30, marginBottom: 6 }}>{title}</p>
      {sub && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: INK60, marginBottom: 18, lineHeight: 1.6 }}>{sub}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {data.map((d) => {
          const barColor = d.pctAdvanced > 35 ? ALERT : d.pctAdvanced > 25 ? WAIT : HOPE;
          return (
            <div key={d.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: INK60 }}>{d.label}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: barColor }}>{d.pctAdvanced}% em estágio III/IV</span>
              </div>
              <div style={{ height: 7, background: INK10, borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, d.pctAdvanced)}%`, background: barColor, borderRadius: 100 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Table for tumor type: avg wait + % advanced staging
function TumorTable({ data }) {
  return (
    <div style={{ background: SURFACE, border: `0.5px solid ${INK10}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 150px 76px', padding: '10px 20px', background: INK10 }}>
        {['Tipo de câncer', 'Espera média', '% estágio III/IV', 'Casos'].map((h) => (
          <span key={h} style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK30 }}>{h}</span>
        ))}
      </div>
      {data.map((d, i) => {
        const avgColor = waitColor(d.avgDias);
        const advColor = d.pctAdvanced > 35 ? ALERT : d.pctAdvanced > 25 ? WAIT : HOPE_D;
        return (
          <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 150px 76px', padding: '13px 20px', borderBottom: i < data.length - 1 ? `0.5px solid ${INK10}` : 'none', background: WHITE }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: INK }}>{d.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: avgColor, lineHeight: 1 }}>{d.avgDias}<span style={{ fontSize: 11, color: INK30, fontFamily: 'var(--font-body)' }}> dias</span></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 5, background: INK10, borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, d.pctAdvanced)}%`, background: advColor, borderRadius: 100 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: advColor, minWidth: 30 }}>{d.pctAdvanced}%</span>
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, alignSelf: 'center' }}>{d.count.toLocaleString('pt-BR')}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function InequalityAnalysis({ data }) {
  const {
    byEducationStats,
    byRaceStats,
    tumorWithStaging,
    tumorFreq,
    pctAdvancedDiag,
    eduByStaging,
    raceByStaging,
    raceByTumor,
    educationGap,
    ignoredRacePct,
    ignoredEduPct,
  } = data;

  const eduData = (byEducationStats ?? []);
  const raceData = (byRaceStats ?? []);
  const tumData = (tumorWithStaging ?? []).slice(0, 9);
  const goodTumors = tumData.filter((d) => d.avgDias <= 60);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 72 }}>

      {/* ── ESCOLARIDADE ────────────────────────────────────────────────── */}
      <div>
        <NarrativeBlock
          title="Escolaridade: as barreiras antes da fila"
          callout={
            educationGap > 0
              ? `Diferença de ${educationGap} dias entre os grupos de menor e maior escolaridade — mais de ${Math.round(educationGap / 30)} meses de espera adicional.`
              : undefined
          }
        >
          Pacientes com menor escolaridade tendem a chegar ao diagnóstico mais tarde e a esperar
          mais pelo tratamento. A tabela abaixo mostra três perspectivas para cada grupo: a
          espera média, a mediana (que elimina a distorção de casos extremos) e o percentual de
          pacientes que ultrapassaram o prazo legal de 60 dias.
        </NarrativeBlock>

        {eduData.length > 0 && <MetricTable data={eduData} />}

        {(eduByStaging ?? []).length > 0 && (
          <StagingBars
            data={eduByStaging}
            title="Diagnóstico tardio por escolaridade"
            sub="Parte da diferença na espera pode refletir diagnóstico em estágio mais avançado — pacientes com menor escolaridade chegam com tumores mais avançados, que exigem protocolos mais complexos antes do início do tratamento. Isso aponta para um problema de acesso à prevenção, não apenas à fila."
          />
        )}

        {ignoredEduPct > 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK30, marginTop: 4, fontStyle: 'italic', lineHeight: 1.6 }}>
            Nota: {ignoredEduPct}% dos registros não possuem informação de escolaridade. Ausência de dado também é um dado — quem não é registrado tende a ser mais invisível ao sistema.
          </p>
        )}
      </div>

      {/* ── RAÇA ────────────────────────────────────────────────────────── */}
      <div>
        <NarrativeBlock title="Raça: o que os números dizem — e o que não dizem">
          Os dados mostram diferenças na espera entre grupos raciais. Mas antes de qualquer
          conclusão, é necessário separar dois fenômenos distintos: a desigualdade na fila de
          tratamento e a desigualdade no acesso ao diagnóstico precoce. Ambas existem — mas
          têm causas e soluções diferentes.
        </NarrativeBlock>

        {raceData.length > 0 && <MetricTable data={raceData} />}

        {/* Confounders explanation */}
        <div style={{ background: WAIT_L, border: `0.5px solid rgba(200,134,10,0.25)`, borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: WAIT, marginBottom: 12 }}>
            Antes de concluir: contextualizando os dados
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: INK60, lineHeight: 1.75, marginBottom: 12 }}>
            <strong style={{ color: INK }}>Mix de tumores:</strong> grupos raciais apresentam distribuições distintas de tipos de câncer. Cânceres hematológicos, por exemplo, têm protocolos naturalmente mais longos. Se um grupo concentra mais casos desse tipo, sua espera média sobe sem que o sistema necessariamente trate esse grupo de forma diferente.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: INK60, lineHeight: 1.75 }}>
            <strong style={{ color: INK }}>Diagnóstico tardio:</strong> pacientes com tumores em estágio III ou IV ao diagnóstico passam por processos de estadiamento mais longos antes de iniciar o tratamento. O gráfico abaixo mostra se grupos raciais chegam com diagnósticos mais avançados — sinal de acesso à prevenção, não apenas de velocidade de atendimento.
          </p>
        </div>

        {/* Tumor mix by race */}
        {(raceByTumor ?? []).length > 0 && (
          <div style={{ background: WHITE, border: `0.5px solid ${INK10}`, borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK30, marginBottom: 14 }}>
              Distribuição de tipos de tumor por grupo racial (% dos casos)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {raceByTumor.map((rg) => (
                <div key={rg.race}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>
                    {rg.race}{' '}
                    <span style={{ fontWeight: 400, color: INK30, fontSize: 12 }}>({rg.total.toLocaleString('pt-BR')} casos)</span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rg.tumorDist.map((t) => (
                      <span key={t.tumor} style={{ fontFamily: 'var(--font-body)', fontSize: 11, background: INK10, borderRadius: 100, padding: '3px 10px', color: INK60 }}>
                        {t.tumor} {t.pct}%
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Race × staging */}
        {(raceByStaging ?? []).length > 0 && (
          <StagingBars
            data={raceByStaging}
            title="% em estágio avançado (III/IV) ao diagnóstico, por raça"
            sub="Chegar em estágio avançado é um sinal de acesso tardio à prevenção — não necessariamente da fila de tratamento. Onde há mais diagnóstico tardio, a prioridade é investir em rastreamento e atenção primária."
          />
        )}

        {ignoredRacePct > 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK30, marginTop: 4, fontStyle: 'italic', lineHeight: 1.6 }}>
            Nota: {ignoredRacePct}% dos registros não possuem informação de raça/cor. Invisibilidade nos dados é, em si, uma forma de desigualdade — quem não é contado, não é atendido.
          </p>
        )}
      </div>

      {/* ── TIPO DE TUMOR ────────────────────────────────────────────────── */}
      <div>
        <NarrativeBlock title="Tipo de tumor: urgência médica vs. urgência do sistema">
          O tipo de câncer determina o tempo de espera por razões que vão além da fila.
          Cânceres mais complexos exigem protocolos de estadiamento antes do início do tratamento.
          A coluna "% em estágio III/IV" ajuda a distinguir: quando a espera é longa, é porque
          o câncer é mais grave — ou porque o sistema é mais lento?
        </NarrativeBlock>
        {/* Global staging alert */}
        {pctAdvancedDiag != null && (
          <div style={{ background: '#fdf0e8', border: '0.5px solid rgba(224,92,42,0.25)', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: ALERT, marginBottom: 12 }}>
              Diagnóstico tardio — panorama geral
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,40px)', color: ALERT, lineHeight: 1, marginBottom: 12 }}>
              {pctAdvancedDiag}%
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: INK60, lineHeight: 1.75, maxWidth: 560 }}>
              dos pacientes chegam ao tratamento já com{' '}
              <strong style={{ color: INK }}>câncer em estágio III ou IV</strong> — tumores avançados que demandam protocolos mais longos antes de iniciar o tratamento.
              Isso não é apenas um problema de fila: é uma falha de acesso à prevenção e detecção precoce.
            </p>
          </div>
        )}

        {/* Tumor frequency ranking */}
        {(tumorFreq ?? []).length > 0 && (
          <div style={{ background: WHITE, border: `0.5px solid ${INK10}`, borderRadius: 16, padding: '22px 24px', marginBottom: 24 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK30, marginBottom: 4 }}>
              Frequência de incidência
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: INK, marginBottom: 4 }}>Os cânceres mais comuns no Brasil</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK30, marginBottom: 18, lineHeight: 1.5 }}>
              Volume total de casos registrados por tipo de tumor. Os mais frequentes não são necessariamente os de maior espera.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tumorFreq.slice(0, 8).map((d, i) => {
                const maxCount = tumorFreq[0].count;
                const pct = Math.round((d.count / maxCount) * 100);
                return (
                  <div key={d.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: INK60, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: INK30, width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                        {d.label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK30 }}>
                        {d.count.toLocaleString('pt-BR')} casos · <span style={{ color: waitColor(d.avgDias), fontWeight: 600 }}>{d.avgDias}d</span>
                      </span>
                    </div>
                    <div style={{ height: 5, background: INK10, borderRadius: 100, overflow: 'hidden', marginLeft: 24 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: waitColor(d.avgDias), borderRadius: 100 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {tumData.length > 0 && <TumorTable data={tumData} />}

        {goodTumors.length > 0 && (
          <div style={{ background: HOPE_L, border: `0.5px solid rgba(0,166,124,0.2)`, borderRadius: 16, padding: '20px 24px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: HOPE_D, marginBottom: 10 }}>
              Uma boa notícia
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: INK60, lineHeight: 1.75 }}>
              <strong style={{ color: INK }}>{goodTumors.map((t) => t.label).join(', ')}</strong> —{' '}
              {goodTumors.length === 1 ? 'esse tipo de câncer tem' : 'esses tipos de câncer têm'} espera
              média dentro do prazo legal de 60 dias. Entender o que funciona nesses fluxos pode
              ajudar a melhorar os demais.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
