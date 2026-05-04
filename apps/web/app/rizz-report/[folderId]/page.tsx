"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "./RizzReport.module.css";

type ReportResult = {
  personName?: string;
  platform?: string;
  interestLevel?: number;
  compatibilityScore?: number;
  redFlags?: string[];
  greenFlags?: string[];
  replyOptions?: string[];
  rizzType?: string;
  riskLevel?: string;
  nextMoves?: string[];
};

export default function RizzReportPage() {
  const params = useParams<{ folderId: string }>();
  const folderId = params.folderId as any;
  const folder = useQuery((api as any).chatFolders.getById, { folderId });
  const analyses = useQuery((api as any).analyses.listByFolder, { chatFolderId: folderId });

  const report = useMemo(() => {
    const saved = analyses?.find((item: any) => item.type === "rizz_report")?.result as
      | ReportResult
      | undefined;

    return {
      personName: saved?.personName ?? folder?.personName ?? "This chat",
      platform: saved?.platform ?? folder?.platform ?? "chat",
      interestLevel: saved?.interestLevel ?? folder?.interestLevel ?? 0,
      compatibilityScore: saved?.compatibilityScore ?? folder?.compatibilityScore ?? 0,
      redFlags: saved?.redFlags?.length ? saved.redFlags : fallbackRedFlags(folder?.redFlagsCount ?? 0),
      greenFlags: saved?.greenFlags?.length
        ? saved.greenFlags
        : fallbackGreenFlags(folder?.greenFlagsCount ?? 0),
      replyOptions: saved?.replyOptions ?? [],
      rizzType:
        saved?.rizzType ?? getRizzType(folder?.interestLevel ?? 0, folder?.compatibilityScore ?? 0),
      riskLevel:
        saved?.riskLevel ?? getRiskLevel(folder?.redFlagsCount ?? 0, folder?.compatibilityScore ?? 0),
      nextMoves:
        saved?.nextMoves ??
        buildNextMoves(folder?.redFlagsCount ?? 0, folder?.compatibilityScore ?? 0),
      messageCount: folder?.messageCount ?? 0,
    };
  }, [analyses, folder]);

  if (folder === undefined || analyses === undefined) {
    return (
      <main className={styles.shell}>
        <section className={styles.loadingCard}>Reading the room...</section>
      </main>
    );
  }

  if (folder === null) {
    return (
      <main className={styles.shell}>
        <section className={styles.loadingCard}>Report not found.</section>
      </main>
    );
  }

  const youLevel = Math.min(95, Math.max(35, report.interestLevel + 12));

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.sparkle}>✦</span>
          <h1>
            <span>RIZZ</span> REPORT
          </h1>
          <span className={styles.heart}>♡</span>
        </div>
        <p>
          {report.personName} on {report.platform}
        </p>
      </header>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <span>〽</span>
          <h2>Interest Level</h2>
        </div>
        <Meter label="You" value={youLevel} tone="you" />
        <Meter label="Them" value={report.interestLevel} tone="them" />
        <div className={styles.insight}>
          {interestInsight(youLevel, report.interestLevel, report.personName)}
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span>✶</span>
            <h2>Compatibility</h2>
          </div>
          <div
            className={styles.donut}
            style={{ "--score": `${report.compatibilityScore}%` } as React.CSSProperties}
          >
            <strong>{report.compatibilityScore}<small>%</small></strong>
          </div>
          <h3>{compatibilityLabel(report.compatibilityScore)}</h3>
          <p>{compatibilityCopy(report.compatibilityScore)}</p>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span>🔥</span>
            <h2>Rizz Type</h2>
          </div>
          <strong className={styles.rizzType}>{report.rizzType}</strong>
          <p>{rizzCopy(report.rizzType)}</p>
          <span className={styles.pill}>{report.messageCount} messages read</span>
        </section>
      </div>

      <FlagCard title="Red Flags" tone="red" items={report.redFlags} empty="No major red flags yet." />
      <FlagCard
        title="Green Flags"
        tone="green"
        items={report.greenFlags}
        empty="Still waiting for stronger green flags."
      />

      <section className={`${styles.card} ${styles.nextMove}`}>
        <div className={styles.cardHeader}>
          <span>➜</span>
          <h2>Next Move</h2>
        </div>
        <ul>
          {report.nextMoves.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      {report.replyOptions.length ? (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span>💬</span>
            <h2>Reply Options</h2>
          </div>
          <div className={styles.replies}>
            {report.replyOptions.slice(0, 3).map((reply, index) => (
              <p key={index}>{reply}</p>
            ))}
          </div>
        </section>
      ) : null}

      <footer className={styles.footer}>
        <strong>Risk Level: <span>{report.riskLevel}</span></strong>
        <i>Keep it fun, stay smart.</i>
      </footer>
    </main>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: "you" | "them" }) {
  return (
    <div className={styles.meterRow}>
      <strong className={styles[tone]}>{label}</strong>
      <div className={styles.track}>
        <span className={styles[tone]} style={{ width: `${value}%` }} />
      </div>
      <b className={styles[tone]}>{value}%</b>
    </div>
  );
}

function FlagCard({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: "red" | "green";
  items: string[];
  empty: string;
}) {
  const list = items.length ? items : [empty];
  return (
    <section className={`${styles.card} ${styles.flagCard} ${styles[tone]}`}>
      <div className={styles.cardHeader}>
        <span>{tone === "red" ? "🚩" : "✅"}</span>
        <h2>{title}</h2>
      </div>
      <ul>
        {list.slice(0, 4).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <span className={styles.face}>{tone === "red" ? "😐" : "😍"}</span>
    </section>
  );
}

function fallbackRedFlags(count: number) {
  if (!count) return [];
  return ["Some consistency issues showed up", "Keep watching whether their effort matches yours"];
}

function fallbackGreenFlags(count: number) {
  if (!count) return [];
  return ["There is enough warmth here to keep testing the vibe", "They gave you something to work with"];
}

function getRizzType(interest: number, compatibility: number) {
  if (interest >= 78 && compatibility >= 72) return "Clear Spark";
  if (interest >= 60) return "Soft Interest";
  if (compatibility >= 70) return "Slow Burn";
  return "Mixed Signals";
}

function getRiskLevel(redFlags: number, compatibility: number) {
  if (redFlags >= 3 || compatibility < 35) return "High";
  if (redFlags > 0 || compatibility < 60) return "Medium";
  return "Low";
}

function buildNextMoves(redFlags: number, compatibility: number) {
  if (redFlags >= 2) return ["Keep it light", "Ask one direct question", "Do not chase dry energy"];
  if (compatibility >= 70) return ["Mirror their energy", "Make a playful plan", "Give them room to flirt back"];
  return ["Ask a warmer follow-up", "Watch their effort", "Keep the next text easy to answer"];
}

function interestInsight(you: number, them: number, name: string) {
  if (them >= you - 5) return `${name} is matching the energy. Do not overthink this one.`;
  if (you - them >= 20) return `You may be more locked in than ${name}. Breathe before you double text.`;
  return `There is a little gap, but it is workable. Keep it playful.`;
}

function compatibilityLabel(score: number) {
  if (score >= 75) return "Good vibes";
  if (score >= 55) return "Needs rhythm";
  return "Proceed slowly";
}

function compatibilityCopy(score: number) {
  if (score >= 75) return "Solid connection with room to turn the heat up.";
  if (score >= 55) return "There is something here, but the timing needs care.";
  return "The vibe is not fully giving yet. Do less, observe more.";
}

function rizzCopy(type: string) {
  if (type === "Clear Spark") return "They are giving you something real to work with.";
  if (type === "Soft Interest") return "Passive vibes, slow-burn energy.";
  if (type === "Slow Burn") return "The connection may need time and better questions.";
  return "A little hot, a little confusing. Classic.";
}
