'use client';

import Link from 'next/link';
import Header from '../components/Header';
import { IconGenerator } from '../components/Icons';

export default function HelpPage() {
  return (
    <>
      <Header />
      <main className="main-layout">
        <div className="neo-card">
          <div className="neo-card-header">
            <span className="neo-card-title">
              Documentation & BBCode Guide
            </span>
            <Link href="/" className="neo-btn neo-btn-subtle" style={{ padding: '4px 10px', fontSize: 11 }}>
              <IconGenerator size={12} />
              Generator
            </Link>
          </div>
          <div className="neo-card-body">
            <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 24, lineHeight: 1.6 }}>
              The <strong>BBCode Gen (VHSTaPE)</strong> tool formats game release threads with uniform, clean BBCode compatible with phpBB, vBulletin, XenForo, and all major tracker forum engines.
            </p>

            {/* Section 1: Workflow */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
                1. Standard Workflow
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                <div style={{ background: 'var(--surface-2)', border: '2px solid var(--border)', borderRadius: 6, padding: 14 }}>
                  <div style={{ color: 'var(--text-white)', fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                    Step 1: Pick Source
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 12.5 }}>
                    Select Steam, GOG, Epic Games, or itch.io from the store switcher tab on the generator page.
                  </p>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '2px solid var(--border)', borderRadius: 6, padding: 14 }}>
                  <div style={{ color: 'var(--text-white)', fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                    Step 2: Fetch Metadata
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 12.5 }}>
                    Enter the store App ID or URL and click Fetch. Game title, header image, quote, tags, and languages populate automatically.
                  </p>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '2px solid var(--border)', borderRadius: 6, padding: 14 }}>
                  <div style={{ color: 'var(--text-white)', fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                    Step 3: Upload Screenshots
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 12.5 }}>
                    Click Upload to host your NFO or screenshots directly to PTScreens or ImgBB via file drag & drop or clipboard paste (Ctrl + V).
                  </p>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '2px solid var(--border)', borderRadius: 6, padding: 14 }}>
                  <div style={{ color: 'var(--text-white)', fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                    Step 4: Save & Copy
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: 12.5 }}>
                    Input repack sizes and download links. Save to your Account for cloud access and click Copy BBCode.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Store Syntax */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
                2. Store Input Syntax
              </h3>
              <table className="help-tbl">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>Accepted Format</th>
                    <th>Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--steam)', fontWeight: 700 }}>Steam</td>
                    <td>Numeric App ID or Store Page URL</td>
                    <td className="mono">3500390 or https://store.steampowered.com/app/3500390/</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--gog)', fontWeight: 700 }}>GOG</td>
                    <td>Product Slug or Store URL</td>
                    <td className="mono">https://www.gog.com/en/game/dark_fall_lost_souls</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--epic)', fontWeight: 700 }}>Epic Games</td>
                    <td>Store Product URL or Slug</td>
                    <td className="mono">https://store.epicgames.com/p/goat-simulator-3</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--itch)', fontWeight: 700 }}>itch.io</td>
                    <td>Direct Game Page URL</td>
                    <td className="mono">https://developer.itch.io/game-title</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Direct Image Hosting */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
                3. Direct Image Hosting Rules
              </h3>
              <div style={{ background: 'var(--surface-2)', border: '2px solid var(--border)', borderRadius: 6, padding: 16 }}>
                <p style={{ color: 'var(--text)', marginBottom: 10 }}>
                  The generator formats images using <code>[img]...[/img]</code> tags. Ensure images are hosted on direct link providers:
                </p>
                <ul style={{ paddingLeft: 20, color: 'var(--text-dim)', lineHeight: 1.8 }}>
                  <li>
                    <strong>PTScreens (Chevereto v4):</strong> Generates direct links formatted as <code className="mono" style={{ color: 'var(--accent)' }}>https://img.ptscreen.com/...</code>.
                  </li>
                  <li>
                    <strong>ImgBB:</strong> Generates direct links formatted as <code className="mono" style={{ color: 'var(--accent)' }}>https://i.ibb.co.com/...</code>.
                  </li>
                  <li>
                    <strong>Clipboard Upload:</strong> Paste directly inside the uploader modal using <kbd style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4 }}>Ctrl + V</kbd>.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 4: Account Isolation */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
                4. Account Isolation & Cloud Sync
              </h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
                Connect your Discord account in the <Link href="/account" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Account</Link> tab. Supabase Row Level Security (RLS) ensures that all saved releases and personal API keys are isolated to your unique Discord user ID.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
