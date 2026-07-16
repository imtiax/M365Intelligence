"use client";

import { useState, type FormEvent } from "react";
import {
  GUIDED_DEMO_PERSONAS,
  type GuidedDemoExperience,
  type GuidedDemoPersonaId,
} from "@/lib/guided-demo";
import styles from "./demo.module.css";

const personaMarks: Record<GuidedDemoPersonaId, string> = {
  executive: "EL",
  security: "SC",
  operations: "MO",
  reporting: "RF",
};

export default function GuidedDemoEntryPage() {
  const [persona, setPersona] =
    useState<GuidedDemoPersonaId>("executive");
  const [experience, setExperience] =
    useState<GuidedDemoExperience>("guided");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = GUIDED_DEMO_PERSONAS.find((item) => item.id === persona)!;

  async function startDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, mode: experience }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(
          result.error || result.message || "The guided demo is unavailable.",
        );
      }
      window.location.assign("/demo/workspace");
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "The guided demo is unavailable.",
      );
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.texture} aria-hidden="true" />
      <header className={styles.header}>
        <a className={styles.brand} href="/landing" aria-label="Aegis home">
          <span className={styles.mark} aria-hidden="true">
            A
          </span>
          <span>
            <strong>Aegis</strong>
            <small>M365 Intelligence</small>
          </span>
        </a>
        <a className={styles.backLink} href="/landing">
          Back to product overview
        </a>
      </header>

      <section className={styles.hero} aria-labelledby="demo-entry-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Interactive product evaluation</p>
          <h1 id="demo-entry-title">
            Experience Aegis through the decisions your team makes.
          </h1>
          <p className={styles.intro}>
            Choose a perspective and enter a protected, synthetic enterprise.
            No sign-up, customer credentials, or Microsoft 365 connection is
            required.
          </p>
          <dl className={styles.assuranceList}>
            <div>
              <dt>Synthetic</dt>
              <dd>Every identity, alert, cost, report, and action is fictional.</dd>
            </div>
            <div>
              <dt>Customer-hosted</dt>
              <dd>Licensed deployments run in your boundary; this sandbox holds synthetic state only.</dd>
            </div>
            <div>
              <dt>Safe</dt>
              <dd>Public-demo actions cannot change Microsoft 365 or shared state.</dd>
            </div>
          </dl>
        </div>

        <aside className={styles.sessionCard} aria-label="Demo session details">
          <span className={styles.sessionMark} aria-hidden="true">
            30
          </span>
          <div>
            <strong>30-minute protected session</strong>
            <p>
              Explore at your own pace. Restart or change perspective whenever
              you need to.
            </p>
          </div>
          <ul>
            <li>No customer data</li>
            <li>No external processing</li>
            <li>No tenant mutations</li>
          </ul>
        </aside>
      </section>

      <form className={styles.selector} onSubmit={startDemo}>
        <fieldset className={styles.personaFieldset}>
          <legend>
            <span>1</span>
            Choose your perspective
          </legend>
          <p className={styles.fieldHelp}>
            Each route focuses the same platform around a different set of
            accountable decisions.
          </p>
          <div className={styles.personaGrid}>
            {GUIDED_DEMO_PERSONAS.map((item) => (
              <label
                className={`${styles.personaCard} ${
                  item.id === persona ? styles.selected : ""
                }`}
                key={item.id}
              >
                <input
                  type="radio"
                  name="persona"
                  value={item.id}
                  checked={item.id === persona}
                  onChange={() => setPersona(item.id)}
                />
                <span className={styles.personaMark} aria-hidden="true">
                  {personaMarks[item.id]}
                </span>
                <span className={styles.personaCopy}>
                  <strong>{item.name}</strong>
                  <small>{item.roleLabel}</small>
                  <span>{item.summary}</span>
                  <em>
                    {item.duration} · {item.steps.length} milestones
                  </em>
                </span>
                <span className={styles.radioMark} aria-hidden="true" />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.modeFieldset}>
          <legend>
            <span>2</span>
            Choose how to explore
          </legend>
          <div className={styles.modeGrid}>
            <label
              className={`${styles.modeCard} ${
                experience === "guided" ? styles.modeSelected : ""
              }`}
            >
              <input
                type="radio"
                name="experience"
                value="guided"
                checked={experience === "guided"}
                onChange={() => setExperience("guided")}
              />
              <span>
                <strong>Guided tour</strong>
                <small>
                  Follow concise milestones with context, proof points, and
                  progress.
                </small>
              </span>
              <b>Recommended</b>
            </label>
            <label
              className={`${styles.modeCard} ${
                experience === "free" ? styles.modeSelected : ""
              }`}
            >
              <input
                type="radio"
                name="experience"
                value="free"
                checked={experience === "free"}
                onChange={() => setExperience("free")}
              />
              <span>
                <strong>Explore freely</strong>
                <small>
                  Enter the persona workspace without step-by-step guidance.
                </small>
              </span>
            </label>
          </div>
        </fieldset>

        <section className={styles.startPanel} aria-labelledby="start-summary">
          <div>
            <p className={styles.eyebrow}>Your selected route</p>
            <h2 id="start-summary">{selected.name}</h2>
            <p>{selected.outcome}</p>
          </div>
          <button className={styles.startButton} type="submit" disabled={loading}>
            {loading
              ? "Preparing protected session…"
              : experience === "guided"
                ? "Start guided tour"
                : "Enter demo workspace"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        </section>

        <div className={styles.formStatus} aria-live="polite">
          {error && <p role="alert">{error}</p>}
          {!error && loading && <p>Creating a short-lived synthetic session.</p>}
        </div>
      </form>

      <footer className={styles.footer}>
        <p>
          This public experience demonstrates product workflows with synthetic
          data. Live connectivity requires an authorized customer deployment.
        </p>
        <a href="/login">Use an authorized local account</a>
      </footer>
    </main>
  );
}
