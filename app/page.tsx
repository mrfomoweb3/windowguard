import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LandingWalletButton } from "@/components/landing-wallet-button";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "WindowGuard | Protected event-market execution",
  description:
    "A final execution check for Somnia five-minute Event Contracts.",
};

const checks = [
  {
    name: "Market identity",
    copy: "Confirms the five-minute window has not rolled while you were deciding.",
  },
  {
    name: "Executable depth",
    copy: "Prices every available level against your maximum, not just the top quote.",
  },
  {
    name: "Time and status",
    copy: "Blocks stale books, closed markets, and orders too close to settlement.",
  },
];

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link className={styles.mark} href="/" aria-label="WindowGuard home">
            WG
          </Link>
          <div className={styles.links}>
            <a href="#protection">Protection</a>
            <a href="#evidence">Evidence</a>
            <a
              href="https://github.com/mrfomoweb3/windowguard"
              target="_blank"
              rel="noreferrer"
            >
              Source
            </a>
          </div>
          <LandingWalletButton className={styles.appLink} />
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Pre-trade execution control</p>
          <h1 id="hero-title">
            Protect the order
            <span>before the wallet opens.</span>
          </h1>
          <p className={styles.intro}>
            Fresh price, depth, identity, and time checks for Somnia
            five-minute Event Contracts.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryAction} href="#protection">
              How it works
            </a>
            <a className={styles.secondaryAction} href="#evidence">
              View evidence
            </a>
          </div>
        </div>

        <div className={styles.marketVisual} aria-hidden="true">
          <Image
            src="/windowguard-market-waves.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.waveImage}
          />
          <div className={styles.visualLabels}>
            <span>Market matched</span>
            <span>Depth verified</span>
            <span>Limits held</span>
          </div>
        </div>
      </section>

      <section className={styles.thesis} aria-label="Problem, foundation, and solution">
        <article>
          <span>01 / The problem</span>
          <h2>A valid quote can expire before a trader signs.</h2>
          <p>
            In a five-minute market, price, depth, status, or even the active
            market can change between review and wallet approval.
          </p>
        </article>
        <article>
          <span>02 / The backing</span>
          <h2>Live market data, verified on-chain.</h2>
          <p>
            Built with the Somnia Markets SDK, dreamDEX order-book data, and
            lifecycle reads from Somnia Shannon Testnet.
          </p>
        </article>
        <article>
          <span>03 / Our solution</span>
          <h2>A deterministic gate before every signature.</h2>
          <p>
            WindowGuard rechecks identity, time, freshness, full depth, and
            price—then opens the wallet only when every rule still passes.
          </p>
        </article>
      </section>

      <section className={styles.protection} id="protection">
        <div className={styles.protectionLead}>
          <h2>The quote can change while you decide.</h2>
          <p>
            WindowGuard repeats the critical checks at submission time. If the
            market moved beyond your rules, the wallet never opens.
          </p>
        </div>
        <div className={styles.checks}>
          {checks.map((check) => (
            <article key={check.name}>
              <h3>{check.name}</h3>
              <p>{check.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.evidence} id="evidence">
        <div className={styles.evidenceStatement}>
          <p>Verified on Somnia Shannon Testnet</p>
          <h2>Built around confirmed outcomes, not optimistic UI.</h2>
        </div>
        <div className={styles.proofGrid}>
          <a
            href="https://shannon-explorer.somnia.network/tx/0x9892c5460eadc7aadf0b3d5ca4763fecdda6a9026c8e62823231c6e8220b6b61"
            target="_blank"
            rel="noreferrer"
          >
            <span>Protected IOC</span>
            <strong>0.01 Up filled at 0.804</strong>
          </a>
          <a
            href="https://shannon-explorer.somnia.network/tx/0x37a82ed068c2abb6e0f2960a6cbfc52bfa4fdddb0ad898c6b7fca26d9e870b22"
            target="_blank"
            rel="noreferrer"
          >
            <span>Resolved position</span>
            <strong>Redemption verified on-chain</strong>
          </a>
          <div>
            <span>Safety suite</span>
            <strong>34 automated tests passing</strong>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>WindowGuard</span>
        <p>
          Testnet prototype. Execution checks do not predict outcomes or
          guarantee fills.
        </p>
      </footer>
    </main>
  );
}
