import type { SupabaseClient } from "@supabase/supabase-js";

const MONTHLY_REQUEST_CAP = 150;

// Perigon's actual billing cycle resets on the 16th of each month (confirmed
// from the account dashboard: "17 of 150 requests... resets on Sep 16"), NOT
// the 1st of the calendar month. The previous calendar-month version of this
// function caused a real incident: it kept counting requests from a cycle
// that had already reset on Aug 16, so by Aug 17 it wrongly believed the
// (already-reset, nearly-empty) new cycle was at 150/150 and blocked a
// refetch after clearArticles() had already wiped the table — see git log
// around 2026-08-17 for the recovery. Trusting Perigon's own rejection
// (HTTP 4xx) instead of reimplementing quota accounting was considered, but
// this project has no live traffic pattern to confirm what Perigon actually
// returns at the real cap, so the anchored-date guardrail stays as a
// best-effort backstop — just aligned to the real reset date now.
function startOfCurrentBillingCycleIso(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const cycleMonth = day >= 16 ? month : month - 1;
  return new Date(Date.UTC(year, cycleMonth, 16)).toISOString();
}

/**
 * Throws if this billing cycle's Perigon request count is already at the
 * plan cap. Call this BEFORE making a request, not after — the whole point
 * is to never place the call that would tip us over 150/cycle.
 */
export async function assertBudgetAvailable(supabase: SupabaseClient): Promise<void> {
  const { count, error } = await supabase
    .from("perigon_request_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfCurrentBillingCycleIso());

  if (error) {
    throw new Error(`Could not check Perigon request budget: ${error.message}`);
  }

  if ((count ?? 0) >= MONTHLY_REQUEST_CAP) {
    throw new Error(
      `Perigon monthly budget exhausted (${count}/${MONTHLY_REQUEST_CAP}). Refusing to make another request this month.`
    );
  }
}

export async function logRequest(
  supabase: SupabaseClient,
  entry: {
    vertical: string;
    requestParams: Record<string, unknown>;
    resultCount: number | null;
    status: "ok" | "error";
    errorMessage?: string;
  }
): Promise<void> {
  const { error } = await supabase.from("perigon_request_log").insert({
    vertical: entry.vertical,
    request_params: entry.requestParams,
    result_count: entry.resultCount,
    status: entry.status,
    error_message: entry.errorMessage ?? null,
  });

  if (error) {
    // Don't let logging failures mask the actual fetch result — surface loudly instead.
    console.error(`Failed to write Perigon request log entry: ${error.message}`);
  }
}
