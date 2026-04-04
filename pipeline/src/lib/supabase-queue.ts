/**
 * PIPELINE JOB QUEUE — Supabase client for the render engine
 *
 * All render jobs are written to/read from Supabase `pipeline_jobs`.
 * This makes the engine stateful, observable from the OS UI, and
 * retryable without losing context.
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // service key for server-side writes
);

export type JobStatus =
  | "queued"
  | "scripting"
  | "voicing"
  | "rendering"
  | "davinci"
  | "done"
  | "failed";

export interface PipelineJob {
  id?: string;
  composition: string;          // Remotion composition ID
  payload: Record<string, any>; // JSON payload passed to the composition
  status: JobStatus;
  output_path?: string;         // local or CDN path of final render
  duration_frames?: number;
  fps?: number;
  width?: number;
  height?: number;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>; // arbitrary extra context (brief, client, etc.)
}

/** Create a new render job and return its ID */
export async function createJob(
  job: Omit<PipelineJob, "id" | "created_at" | "updated_at">
): Promise<string> {
  const { data, error } = await supabase
    .from("pipeline_jobs")
    .insert({ ...job, status: "queued" })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create job: ${error.message}`);
  return data.id;
}

/** Update job status and optional fields */
export async function updateJob(
  id: string,
  update: Partial<PipelineJob>
): Promise<void> {
  const { error } = await supabase
    .from("pipeline_jobs")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Failed to update job ${id}: ${error.message}`);
}

/** Fetch all jobs (for OS dashboard) */
export async function listJobs(limit = 50): Promise<PipelineJob[]> {
  const { data, error } = await supabase
    .from("pipeline_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list jobs: ${error.message}`);
  return data ?? [];
}

/** Fetch a single job */
export async function getJob(id: string): Promise<PipelineJob | null> {
  const { data, error } = await supabase
    .from("pipeline_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export { supabase };
