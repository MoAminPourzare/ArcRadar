import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { agentReports, agentRuns } from "@/server/db/schema";
import {
  ARC_READINESS_AUDIT_AGENT_ID,
  type AgentId,
  type AgentReportSummary,
  type AuditFinding,
  type AuditRecommendation,
} from "@/types/agent";

export async function getLatestProjectAgentReport({
  agentId = ARC_READINESS_AUDIT_AGENT_ID,
  projectId,
}: {
  agentId?: AgentId;
  projectId: string;
}) {
  const db = getDb();

  if (!db) {
    return null;
  }

  try {
    const [report] = await db
      .select()
      .from(agentReports)
      .where(
        and(
          eq(agentReports.agentId, agentId),
          eq(agentReports.projectId, projectId),
        ),
      )
      .orderBy(desc(agentReports.createdAt))
      .limit(1);

    if (!report) {
      return null;
    }

    return mapAgentReport(report);
  } catch {
    return null;
  }
}

export async function getAgentReportByPaymentHash(transactionHash: `0x${string}`) {
  const db = getDb();

  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      report: agentReports,
    })
    .from(agentRuns)
    .innerJoin(agentReports, eq(agentReports.runId, agentRuns.id))
    .where(eq(agentRuns.paymentTransactionHash, transactionHash))
    .limit(1);

  return row?.report ? mapAgentReport(row.report) : null;
}

type DatabaseAgentReport = typeof agentReports.$inferSelect;

export function mapAgentReport(report: DatabaseAgentReport): AgentReportSummary {
  return {
    agentId: report.agentId as AgentId,
    createdAt: report.createdAt.toISOString(),
    evidence: report.evidence,
    findings: report.findings as AuditFinding[],
    id: report.id,
    recommendations: report.recommendations as AuditRecommendation[],
    runId: report.runId,
    score: report.score,
    summary: report.summary,
    title: report.title,
  };
}
