import {
  ComposedChart, AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, BarChart, Bar, Cell, Legend,
} from 'recharts';

// Design System tokens
const INK      = '#1a1a2e';
const INK60    = '#5a5a7a';
const INK30    = '#b0b0c8';
const INK10    = '#f0f0f5';
const HOPE     = '#00a67c';
const HOPE_L   = '#e0f5ef';
const HOPE_D   = '#006b52';
const ALERT    = '#e05c2a';
const ALERT_L  = '#fdf0e8';
const WAIT     = '#c8860a';
const WAIT_L   = '#fdf6e3';
const WHITE    = '#ffffff';

const TIP = {
  background: WHITE,
  borderRadius: 10,
  border: `0.5px solid ${INK10}`,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: INK,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
};

// Semantic color for a wait value
function waitColor(days) {
  if (days <= 30) return HOPE;
  if (days <= 60) return WAIT;
  return ALERT;
}

function MetricCard({ eyebrow, value, label, delta, deltaKind }) {
  const deltaColors = {
    neg:  { bg: ALERT_L, color: ALERT },
    pos:  { bg: HOPE_L,  color: HOPE_D },
    warn: { bg: WAIT_L,  color: WAIT },
  };
  const dc = delta && deltaColors[deltaKind] ? deltaColors[deltaKind] : null;
  return (
    <div style={{ background: WHITE, border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '20px 22px' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK30, marginBottom: 10 }}>
        {eyebrow}
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 1, color: typeof value === 'object' ? value.color : INK, marginBottom: 4 }}>
        {typeof value === 'object' ? value.text : value}
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK60 }}>{label}</p>
      {delta && dc && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, marginTop: 8, padding: '2px 10px', borderRadius: 100, background: dc.bg, color: dc.color }}>
          {delta}
        </span>
      )}
    </div>
  );
}

// Distribution bar (≤30 / 31–60 / 61–120 / 120+)
function WaitDistribution({ waitDistribution }) {
  if (!waitDistribution || !waitDistribution.total) return null;
  const { total, buckets } = waitDistribution;
  return (
    <div style={{ background: WHITE, border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '22px 24px' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK30, marginBottom: 4 }}>
        Distribuição da espera
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: INK60, marginBottom: 20 }}>
        Como os pacientes se distribuem pelo tempo de espera
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {buckets.map(({ label, color, count, pct }) => {
          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: INK60 }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: INK }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: INK10, borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MetricsPanel({ data }) {
  const { totalCases, totalWithWait, avgDias, medianDias, pctAbove60, pctAbove30, byYear, byStaging, waitDistribution } = data;

  const yearData = byYear.filter((d) => d.year >= 2018 && d.year <= 2023 && d.avgDias != null && d.total >= 500);
  const volumeData = byYear.filter((d) => d.year >= 2018 && d.year <= 2023 && d.total > 0);
  const stagingOrder = ['In situ', 'I', 'II', 'III', 'IV'];
  const stagingData = stagingOrder.map((l) => byStaging.find((d) => d.label === l)).filter(Boolean);
  const scaleMax = Math.max(avgDias * 1.6, 100);
  const pctWithin = 100 - pctAbove60;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Visual: Lei vs Realidade */}
      <div style={{ background: WHITE, border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px 28px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK30, marginBottom: 20 }}>
          Prazo legal vs. espera real
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30 }}>0 dias</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: HOPE, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: HOPE, display: 'inline-block' }} />
            60 dias — prazo legal (Lei 12.732)
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30 }}>{Math.round(scaleMax)} dias</span>
        </div>
        <div style={{ position: 'relative', height: 22, background: INK10, borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 100,
            width: `${Math.min(100, (avgDias / scaleMax) * 100)}%`,
            background: `linear-gradient(to right, ${WAIT}, ${ALERT})`,
            transition: 'width 0.8s ease',
          }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(60 / scaleMax) * 100}%`, width: 2, background: HOPE }} />
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: INK60, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          A espera média é de <strong style={{ color: ALERT }}>{avgDias} dias</strong>{' '}
          {avgDias > 60 ? <> — <strong style={{ color: ALERT }}>{avgDias - 60} dias além</strong> do prazo garantido por lei.</> : ' — dentro do prazo legal, mas a média esconde casos extremos.'}
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <MetricCard
          eyebrow="Ultrapassam 60 dias"
          value={{ text: `${pctAbove60}%`, color: ALERT }}
          label="dos casos com data válida"
          delta={`▲ ${pctAbove60}% fora do prazo`}
          deltaKind="neg"
        />
        <MetricCard
          eyebrow="Dentro do prazo"
          value={{ text: `${pctWithin}%`, color: HOPE }}
          label="tratados em até 60 dias"
          delta={`▼ ${100 - pctWithin}% fora do prazo`}
          deltaKind="pos"
        />
        <MetricCard
          eyebrow="Espera média"
          value={`${avgDias}`}
          label="dias até o 1º tratamento"
          delta={avgDias > 60 ? `▲ +${avgDias - 60} vs meta SUS` : '✓ dentro do prazo'}
          deltaKind={avgDias > 60 ? 'neg' : 'pos'}
        />
        <MetricCard
          eyebrow="Mediana"
          value={`${medianDias}`}
          label="dias (50% espera mais)"
          delta={medianDias > 60 ? `▲ +${medianDias - 60} vs meta` : '✓ dentro do prazo'}
          deltaKind={medianDias > 60 ? 'warn' : 'pos'}
        />
        <MetricCard
          eyebrow="Mais de 30 dias"
          value={{ text: `${pctAbove30}%`, color: WAIT }}
          label="aguardam além de 30 dias"
          delta="mesmo antes do limite legal"
          deltaKind="warn"
        />
      </div>

      {/* Distribution */}
      <WaitDistribution waitDistribution={waitDistribution} />

      {/* Charts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Trend over years */}
        <div style={{ background: WHITE, border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '22px 24px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK30, marginBottom: 4 }}>Evolução recente</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: INK, marginBottom: 4 }}>A lei mudou alguma coisa?</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK30, marginBottom: 16, lineHeight: 1.5 }}>Espera média (dias) e % acima de 60 dias por ano de primeiro diagnóstico. A linha horizontal marca o prazo legal (Lei 12.732/2013).</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={yearData} margin={{ top: 10, right: 40, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={INK10} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: INK30, fontFamily: 'var(--font-body)' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: INK30, fontFamily: 'var(--font-body)' }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: INK30, fontFamily: 'var(--font-body)' }} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ ...TIP, padding: '10px 14px', minWidth: 190 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: INK, marginBottom: 6 }}>{label}</p>
                      {payload.map((p) => (
                        <p key={p.dataKey} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: p.stroke, marginBottom: 2 }}>
                          {p.dataKey === 'avgDias' ? `Espera média: ${p.value} dias` : `Acima de 60d: ${p.value}%`}
                        </p>
                      ))}
                      {d.minDias != null && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, marginTop: 6 }}>
                          Mín: {d.minDias}d · Máx: {d.maxDias}d
                        </p>
                      )}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, marginTop: 2 }}>
                        {d.count?.toLocaleString('pt-BR')} casos analisados
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                formatter={(value) => value === 'avgDias' ? 'Espera média (dias)' : '% acima de 60 dias'}
                wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK60 }}
              />
              <ReferenceLine yAxisId="left" y={60} stroke={HOPE} strokeDasharray="5 4"
                label={{ value: '60d (Lei 12.732)', position: 'insideTopRight', fill: HOPE, fontSize: 9, fontFamily: 'var(--font-body)' }} />
              <Line yAxisId="left" type="monotone" dataKey="avgDias" stroke={ALERT} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: ALERT }} />
              <Line yAxisId="right" type="monotone" dataKey="pct60" stroke={WAIT} strokeWidth={1.5} dot={false} strokeDasharray="4 3" activeDot={{ r: 4, fill: WAIT }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* By staging */}
        <div style={{ background: WHITE, border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '22px 24px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK30, marginBottom: 4 }}>Estágio do câncer</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: INK, marginBottom: 4 }}>Quanto mais avançado, maior a espera</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK30, marginBottom: 16, lineHeight: 1.5 }}>
            Diagnóstico tardio significa tratamento mais tardio.
          </p>
          <ResponsiveContainer width="100%" height={166}>
            <BarChart data={stagingData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={INK10} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 13, fill: INK60, fontFamily: 'var(--font-body)' }} />
              <YAxis tick={{ fontSize: 11, fill: INK30, fontFamily: 'var(--font-body)' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ ...TIP, padding: '10px 14px', minWidth: 170 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: INK, marginBottom: 6 }}>Estágio {d.label}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: waitColor(d.avgDias), marginBottom: 4 }}>Espera média: {d.avgDias} dias</p>
                      {d.minDias != null && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, marginTop: 4 }}>
                          Mín: {d.minDias}d · Máx: {d.maxDias}d
                        </p>
                      )}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, marginTop: 2 }}>
                        {d.count?.toLocaleString('pt-BR')} casos
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={60} stroke={HOPE} strokeDasharray="4 4" />
              <Bar dataKey="avgDias" radius={[6, 6, 0, 0]}>
                {stagingData.map((d) => (
                  <Cell key={d.label} fill={waitColor(d.avgDias)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Volume over years */}
        {volumeData.length > 0 && (
          <div style={{ background: WHITE, border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '22px 24px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK30, marginBottom: 4 }}>Casos por ano</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: INK, marginBottom: 4 }}>Evolução do volume de registros</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK30, marginBottom: 16, lineHeight: 1.5 }}>
              Total de pacientes registrados por ano de primeiro diagnóstico. Variações refletem tanto mudanças na incidência quanto na cobertura dos registros hospitalares.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={volumeData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={HOPE} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={HOPE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={INK10} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: INK30, fontFamily: 'var(--font-body)' }} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: INK30, fontFamily: 'var(--font-body)' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ ...TIP, padding: '10px 14px', minWidth: 170 }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: INK, marginBottom: 6 }}>{label}</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: HOPE, marginBottom: 2 }}>
                          {d.total?.toLocaleString('pt-BR')} casos registrados
                        </p>
                        {d.count != null && d.count !== d.total && (
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, marginTop: 4 }}>
                            {d.count?.toLocaleString('pt-BR')} com data de tratamento válida
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="total" stroke={HOPE} strokeWidth={2} fill="url(#volumeGrad)" dot={false} activeDot={{ r: 5, fill: HOPE }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}


