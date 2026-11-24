'use client';

import Link from 'next/link';
import Header from '../components/Header';
import { IconGenerator, IconMovie } from '../components/Icons';
import { useLang } from '../utils/useLang';

export default function HelpPage() {
  const { lang, setLang, dict } = useLang();
  const t = dict.help;

  return (
    <>
      <Header currentLang={lang} onLangChange={setLang} />
      <main id="main-content" className="main-layout">
        <div className="page-header">
          <h1 className="page-title">{t.title}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/" className="neo-btn neo-btn-subtle">
              <IconGenerator size={14} />
              {t.games_btn}
            </Link>
            <Link href="/movies" className="neo-btn neo-btn-subtle">
              <IconMovie size={14} />
              {t.movies_btn}
            </Link>
          </div>
        </div>

        <div className="neo-card">
          <div className="neo-card-body">
            <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 24, lineHeight: 1.6 }}>
              {t.intro_pre}<strong>BBCode Gen (VHSTaPE)</strong>{t.intro_post}
            </p>

            {/* Section 1: Workflow */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-text)', marginBottom: 12 }}>
                {t.s1_title}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ color: 'var(--text-white)', fontWeight: 600, marginBottom: 4 }}>
                    {t.step1_t}
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>{t.step1_p}</p>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ color: 'var(--text-white)', fontWeight: 600, marginBottom: 4 }}>
                    {t.step2_t}
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>{t.step2_p}</p>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ color: 'var(--text-white)', fontWeight: 600, marginBottom: 4 }}>
                    {t.step3_t}
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>{t.step3_p}</p>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div style={{ color: 'var(--text-white)', fontWeight: 600, marginBottom: 4 }}>
                    {t.step4_t}
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>{t.step4_p}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Store Syntax */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-text)', marginBottom: 12 }}>
                {t.s2_title}
              </h2>
              <div className="table-scroll">
                <table className="help-tbl">
                  <thead>
                    <tr>
                      <th>{t.th_store}</th>
                      <th>{t.th_format}</th>
                      <th>{t.th_example}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--steam)', fontWeight: 600 }}>Steam</td>
                      <td>{t.steam_fmt}</td>
                      <td className="mono">3500390 or https://store.steampowered.com/app/3500390/</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--gog)', fontWeight: 600 }}>GOG</td>
                      <td>{t.gog_fmt}</td>
                      <td className="mono">https://www.gog.com/en/game/dark_fall_lost_souls</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--epic)', fontWeight: 600 }}>Epic Games</td>
                      <td>{t.epic_fmt}</td>
                      <td className="mono">https://store.epicgames.com/p/goat-simulator-3</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--itch)', fontWeight: 600 }}>itch.io</td>
                      <td>{t.itch_fmt}</td>
                      <td className="mono">https://developer.itch.io/game-title</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--accent-text)', fontWeight: 600 }}>{t.imdb_label}</td>
                      <td>{t.imdb_fmt}</td>
                      <td className="mono">tt43739386 or https://www.imdb.com/title/tt43739386/</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Direct Image Hosting */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-text)', marginBottom: 12 }}>
                {t.s3_title}
              </h2>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <p style={{ color: 'var(--text)', marginBottom: 10 }}>{t.s3_intro}</p>
                <ul style={{ paddingLeft: 20, color: 'var(--text-dim)', lineHeight: 1.8 }}>
                  <li>{t.s3_pt}</li>
                  <li>{t.s3_imgbb}</li>
                  <li>{t.s3_clip}</li>
                </ul>
              </div>
            </div>

            {/* Section 4: Account Isolation */}
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-text)', marginBottom: 12 }}>
                {t.s4_title}
              </h2>
              <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
                {t.s4_pre}
                <Link href="/account" style={{ color: 'var(--accent-text)', textDecoration: 'underline' }}>{t.s4_link}</Link>
                {t.s4_post}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
