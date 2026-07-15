import { useState, useEffect, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';

// Design System tokens
const INK      = '#1a1a2e';
const INK60    = '#5a5a7a';
const INK30    = '#b0b0c8';
const INK10    = '#f0f0f5';
const HOPE     = '#00a67c';
const ALERT    = '#e05c2a';
const WAIT     = '#c8860a';
const WHITE    = '#ffffff';

// Semantic gradient: HOPE (green) → WAIT (amber) → ALERT (orange-red)
function getColor(value, min, max) {
  if (value == null) return INK10;
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  if (t < 0.5) {
    const s = t * 2;
    const r = Math.round(0   + s * (200 - 0));
    const g = Math.round(166 + s * (134 - 166));
    const b = Math.round(124 + s * (10  - 124));
    return `rgb(${r},${g},${b})`;
  } else {
    const s = (t - 0.5) * 2;
    const r = Math.round(200 + s * (224 - 200));
    const g = Math.round(134 + s * (92  - 134));
    const b = Math.round(10  + s * (42  - 10));
    return `rgb(${r},${g},${b})`;
  }
}

export default function BrazilMap({ stateMap, byState }) {
  const [geo, setGeo]       = useState(null);
  const [paths, setPaths]   = useState([]);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    fetch('/data/brazil-states.json').then((r) => r.json()).then(setGeo).catch(console.error);
  }, []);

  useEffect(() => {
    if (!geo) return;
    const projection = geoMercator().fitSize([500, 540], geo);
    const pathGen = geoPath().projection(projection);
    setPaths(geo.features.map((f) => ({
      sigla: f.properties.SIGLA || f.properties.PK_sigla || '',
      d: pathGen(f),
      name: f.properties.Estado || '',
    })));
  }, [geo]);

  const values = Object.values(stateMap).filter((v) => v != null);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  const byStateEntry = useMemo(
    () => Object.fromEntries((byState ?? []).map((d) => [d.label, d])),
    [byState]
  );

  const ranking = (byState ?? [])
    .filter((d) => d.count >= 30)
    .slice(0, 12);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

      {/* Map */}
      <div>
        <div style={{ background: WHITE, borderRadius: 16, border: '0.5px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <svg viewBox="0 0 500 540" style={{ width: '100%', display: 'block' }}>
            {paths.map(({ sigla, d, name }) => (
              <path
                key={sigla}
                d={d}
                fill={getColor(stateMap[sigla], min, max)}
                stroke={WHITE}
                strokeWidth={1}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => {
                  const entry = byStateEntry[sigla] || {};
                  setTooltip({ x: e.clientX, y: e.clientY, sigla, name, val: stateMap[sigla], count: entry.count, minDias: entry.minDias, maxDias: entry.maxDias });
                }}
                onMouseMove={(e) => setTooltip((t) => t && { ...t, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </svg>
        </div>
        {/* Gradient legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '0 4px' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, flexShrink: 0 }}>Menor espera</span>
          <div style={{ flex: 1, height: 8, borderRadius: 100, background: `linear-gradient(to right, ${HOPE}, ${WAIT}, ${ALERT})` }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, flexShrink: 0 }}>Maior espera</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 4px 0', marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30 }}>{min} dias</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30 }}>{max} dias</span>
        </div>
      </div>

      {/* Ranking panel */}
      <div style={{ background: WHITE, border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '22px 24px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK30, marginBottom: 4 }}>Ranking</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: INK, marginBottom: 20 }}>Estados por espera média</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ranking.map((d, i) => {
            const pct = max > min ? ((d.avgDias - min) / (max - min)) * 100 : 50;
            const color = getColor(d.avgDias, min, max);
            return (
              <div key={d.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: INK60, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: INK30, width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    {d.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color }}>{d.avgDias}d</span>
                </div>
                <div style={{ height: 4, background: INK10, borderRadius: 100, overflow: 'hidden', marginLeft: 24 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', zIndex: 60,
          left: tooltip.x + 14, top: tooltip.y - 54,
          background: WHITE, border: '0.5px solid rgba(0,0,0,0.08)',
          borderRadius: 10, padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
        }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: INK }}>{tooltip.name}</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30 }}>{tooltip.sigla}</p>
          {tooltip.val != null ? (
            <>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: getColor(tooltip.val, min, max), marginTop: 4 }}>
                {tooltip.val} dias em média
              </p>
              {tooltip.minDias != null && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK60, marginTop: 4 }}>
                  Mín: {tooltip.minDias}d · Máx: {tooltip.maxDias}d
                </p>
              )}
              {tooltip.count != null && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: INK30, marginTop: 2 }}>
                  {tooltip.count.toLocaleString('pt-BR')} casos
                </p>
              )}
            </>
          ) : (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: INK30, marginTop: 4 }}>Sem dados</p>
          )}
        </div>
      )}
    </div>
  );
}
