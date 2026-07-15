// SmartFilters — Profile Explorer
// Used in the "Explore" section (dark bg) and as a drawer (drawerMode=true)

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
const WHITE    = '#ffffff';

const SEX_OPTIONS = [
  { value: '1', label: 'Masculino' },
  { value: '2', label: 'Feminino' },
];

const RACE_OPTIONS = [
  { value: '1', label: 'Branca' },
  { value: '2', label: 'Preta' },
  { value: '4', label: 'Parda' },
  { value: '3', label: 'Amarela' },
  { value: '5', label: 'Indígena' },
];

const INSTRUC_OPTIONS = [
  { value: '1', label: 'Sem escolaridade' },
  { value: '2', label: 'Fundamental I' },
  { value: '3', label: 'Fundamental II' },
  { value: '4', label: 'Ensino Médio' },
  { value: '5', label: 'Ensino Superior' },
];

const TUMOR_OPTIONS = [
  { value: 'Mama', label: 'Mama' },
  { value: 'Geniturinário', label: 'Geniturinário' },
  { value: 'Cólon/Reto', label: 'Cólon/Reto' },
  { value: 'Resp./Intratoráx', label: 'Pulmão/Tórax' },
  { value: 'Hematopoiético', label: 'Hematopoiético' },
  { value: 'Lábio/Cavid.Oral', label: 'Cabeça/Pescoço' },
  { value: 'Faringe/Esôfago', label: 'Faringe/Esôfago' },
  { value: 'Sist. Nervoso/Endo', label: 'S. Nervoso/Endo' },
];

function pillStyle(active, dark) {
  if (active) {
    return {
      background: dark ? HOPE : INK,
      color: WHITE,
      border: 'none',
      borderRadius: 100,
      padding: '7px 14px',
      fontSize: 12,
      fontWeight: 600,
      fontFamily: 'var(--font-body)',
      cursor: 'pointer',
      transition: 'all 0.15s',
    };
  }
  return {
    background: dark ? '#1e1e38' : WHITE,
    color: dark ? '#5a5a7a' : INK60,
    border: dark ? '0.5px solid #2a2a4a' : '0.5px solid rgba(0,0,0,0.12)',
    borderRadius: 100,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };
}

function ProfileGroup({ label, options, selected, onChange, dark }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? '#3a3a5a' : INK30, marginBottom: 10 }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button style={pillStyle(!selected, dark)} onClick={() => onChange('')}>Todos</button>
        {options.map((opt) => (
          <button
            key={opt.value}
            style={pillStyle(selected === opt.value, dark)}
            onClick={() => onChange(selected === opt.value ? '' : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SmartFilters({
  profile,
  onChange,
  profileData,
  globalAvg,
  globalPct60,
  drawerMode = false,
}) {
  const dark = !drawerMode;
  const { sexo, raca, instruc, tumor } = profile;
  const hasAny = sexo || raca || instruc || tumor;

  const diff = profileData?.avg != null ? profileData.avg - globalAvg : null;

  const diffBadge = diff !== null ? {
    bg:    diff > 0 ? ALERT_L : HOPE_L,
    color: diff > 0 ? ALERT    : HOPE_D,
    text:  diff > 0 ? `+${diff} dias vs. média (${globalAvg}d)` : `${diff} dias vs. média (${globalAvg}d)`,
  } : null;

  return (
    <div>
      {/* Profile selectors */}
      <div style={{ marginBottom: hasAny ? 0 : 40 }}>
        <ProfileGroup label="Sexo" options={SEX_OPTIONS} selected={sexo} onChange={(v) => onChange({ ...profile, sexo: v })} dark={dark} />
        <ProfileGroup label="Raça / Cor" options={RACE_OPTIONS} selected={raca} onChange={(v) => onChange({ ...profile, raca: v })} dark={dark} />
        <ProfileGroup label="Escolaridade" options={INSTRUC_OPTIONS} selected={instruc} onChange={(v) => onChange({ ...profile, instruc: v })} dark={dark} />
        <ProfileGroup label="Tipo de câncer" options={TUMOR_OPTIONS} selected={tumor} onChange={(v) => onChange({ ...profile, tumor: v })} dark={dark} />

        {hasAny && (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11, color: dark ? '#3a3a5a' : INK30, marginTop: 4, padding: 0 }}
            onClick={() => onChange({ sexo: '', raca: '', instruc: '', tumor: '' })}
          >
            Limpar seleção
          </button>
        )}
      </div>

      {/* Result card */}
      {profileData && profileData.avg != null && (
        <div style={{
          borderRadius: 16, padding: '28px 28px', marginTop: 16,
          background: dark ? '#1a1a2e' : '#fafaf8',
          border: dark ? '0.5px solid #2a2a4a' : '0.5px solid rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? '#3a3a5a' : INK30, marginBottom: 20 }}>
            Resultado para esse perfil
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {/* Main number */}
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,7vw,3.5rem)', lineHeight: 1, color: dark ? WHITE : INK }}>
                {profileData.avg}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: dark ? '#5a5a7a' : INK60, marginTop: 6 }}>dias em média</p>
              {diffBadge && (
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, marginTop: 10, padding: '3px 10px', borderRadius: 100, background: diffBadge.bg, color: diffBadge.color }}>
                  {diffBadge.text}
                </span>
              )}
            </div>

            {/* Pct60 */}
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,5vw,2.4rem)', lineHeight: 1, color: profileData.pct60 > globalPct60 ? ALERT : HOPE }}>
                {profileData.pct60}%
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: dark ? '#5a5a7a' : INK60, marginTop: 6, lineHeight: 1.5 }}>
                aguardaram além dos 60 dias
              </p>
            </div>

            {/* Median */}
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,5vw,2.4rem)', lineHeight: 1, color: dark ? '#b0b0c8' : INK }}>
                {profileData.median ?? '—'}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: dark ? '#5a5a7a' : INK60, marginTop: 6, lineHeight: 1.5 }}>
                dias (mediana)
              </p>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: dark ? '#3a3a5a' : INK30, marginTop: 16 }}>
            Baseado em {profileData.validCount?.toLocaleString('pt-BR') ?? '—'} registros ({profileData.count?.toLocaleString('pt-BR') ?? '—'} total nesse perfil)
          </p>
        </div>
      )}

      {/* Placeholder when nothing selected */}
      {!hasAny && (
        <div style={{
          borderRadius: 16, padding: '32px', border: dark ? '1px dashed #2a2a4a' : '1px dashed rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: dark ? '#3a3a5a' : INK30, lineHeight: 1.6 }}>
            Selecione características acima para ver<br />os dados do seu perfil
          </p>
        </div>
      )}

      {hasAny && !profileData && (
        <div style={{
          borderRadius: 16, padding: '32px', border: dark ? '1px dashed #2a2a4a' : '1px dashed rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: dark ? '#3a3a5a' : INK30 }}>Calculando…</p>
        </div>
      )}
    </div>
  );
}
