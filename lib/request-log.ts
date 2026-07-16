import type { SupabaseClient } from "@supabase/supabase-js";

const MONTHLY_REQUEST_CAP = 150;

function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Throws if this month's Perigon request count is already at the free-tier cap.
 * Call this BEFORE making a request, not after — the whole point is to never
 * place the call that would tip us over 150/month.
 */
export async function assertBudgetAvailable(supabase: SupabaseClient): Promise<void> {
  const { count, error } = await supabase
    .from("perigon_request_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfCurrentMonthIso());

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
