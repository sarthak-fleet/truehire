import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Star } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import {
  getHiringPipeline,
  getPipelineCandidates,
  createEvaluation,
  getCandidateEvaluations,
} from "@/lib/hiring-service";
import { getUserById } from "@/lib/score-service";
import { auth } from "@/lib/auth";
import type { RoleRequirement } from "@truehire/core";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function EvaluationPage(props: {
  params: Promise<{ id: string; candidateId: string }>;
}) {
  const { id: pipelineId, candidateId } = await props.params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const pipelineData = await getHiringPipeline(pipelineId);
  if (!pipelineData) notFound();

  const { pipeline, role } = pipelineData;
  const candidates = await getPipelineCandidates(pipelineId);
  const candidate = candidates.find((c) => c.candidate.id === candidateId);
  if (!candidate) notFound();

  const requirements = JSON.parse(role.requirementsJson) as RoleRequirement[];
  const existingEvaluations = await getCandidateEvaluations(candidateId);

  async function action(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id || !candidate) return;

    const scores: Record<string, { score: number; feedback: string }> = {};
    for (const req of requirements) {
      const score = parseInt(formData.get(`score_${req.id}`) as string);
      const feedback = formData.get(`feedback_${req.id}`) as string;
      scores[req.id] = { score, feedback };
    }

    const overallRecommendation = formData.get("recommendation") as any;

    await createEvaluation({
      pipelineCandidateId: candidateId,
      stage: candidate.candidate.stage,
      scoresJson: JSON.stringify(scores),
      overallRecommendation,
      evaluatorId: session.user.id,
    });

    revalidatePath(`/recruiter/pipelines/${pipelineId}`);
    redirect(`/recruiter/pipelines/${pipelineId}`);
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-center gap-4">
        <Link href={`/recruiter/pipelines/${pipelineId}`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to pipeline
          </Button>
        </Link>
      </div>

      <section className="mt-6">
        <h1 className="text-[30px] font-semibold tracking-tight">
          Evaluate {candidate.user.name || candidate.user.githubUsername}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Stage: <Badge tone="outline">{candidate.candidate.stage}</Badge> · 
          Role: <span className="font-medium text-[var(--foreground)]">{role.name}</span>
        </p>
      </section>

      <form action={action} className="mt-8 grid gap-8">
        <div className="grid gap-6">
          <h2 className="text-xl font-semibold">Rubric Scoring</h2>
          {requirements.map((req) => (
            <Card key={req.id}>
              <CardBody>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{req.label}</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Category: {req.category} · Keywords: {req.keywords.join(", ")}
                    </p>
                    <textarea
                      name={`feedback_${req.id}`}
                      rows={2}
                      placeholder={`Notes on ${req.label.toLowerCase()}...`}
                      className="mt-3 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-2 md:mt-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <label key={val} className="flex flex-col items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`score_${req.id}`}
                          value={val}
                          required
                          className="sr-only peer"
                        />
                        <div className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border)] peer-checked:bg-[var(--accent)] peer-checked:text-[var(--accent-contrast)] peer-checked:border-[var(--accent)] hover:border-[var(--accent)] transition-colors">
                          {val}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid gap-6">
          <h2 className="text-xl font-semibold">Overall Recommendation</h2>
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {[
                  { value: "strong_hire", label: "Strong Hire", tone: "verified" },
                  { value: "hire", label: "Hire", tone: "verified" },
                  { value: "neutral", label: "Neutral", tone: "outline" },
                  { value: "reject", label: "Reject", tone: "outline" },
                  { value: "strong_reject", label: "Strong Reject", tone: "outline" },
                ].map((opt) => (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="recommendation"
                      value={opt.value}
                      required
                      className="sr-only peer"
                    />
                    <div className="flex h-12 flex-col items-center justify-center rounded border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider peer-checked:bg-[var(--accent)] peer-checked:text-[var(--accent-contrast)] peer-checked:border-[var(--accent)] hover:border-[var(--accent)] transition-colors text-center px-1">
                      {opt.label}
                    </div>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pb-10">
          <Link href={`/recruiter/pipelines/${pipelineId}`}>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button type="submit" leftIcon={<Save className="h-4 w-4" />}>
            Submit evaluation
          </Button>
        </div>
      </form>

      {existingEvaluations.length > 0 && (
        <section className="mt-10 border-t border-[var(--border)] pt-10">
          <h2 className="text-xl font-semibold mb-6">Past Evaluations</h2>
          <div className="grid gap-4">
            {existingEvaluations.map((evalItem) => (
              <Card key={evalItem.id}>
                <CardBody>
                  <div className="flex items-center justify-between mb-4">
                    <Badge tone="outline">{evalItem.stage} stage</Badge>
                    <div className="text-[11px] text-[var(--muted)]">
                      {new Date(evalItem.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-bold text-[var(--accent)] uppercase text-[10px] tracking-widest mb-2">
                    {evalItem.overallRecommendation?.replace("_", " ")}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {Object.entries(JSON.parse(evalItem.scoresJson)).map(([reqId, data]: [string, any]) => (
                      <div key={reqId} className="flex justify-between border-b border-[var(--border)] py-1 last:border-0">
                        <span>{requirements.find(r => r.id === reqId)?.label || reqId}</span>
                        <span className="font-semibold">{data.score}/5</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
