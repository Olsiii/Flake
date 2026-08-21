import { notFound } from "next/navigation";
import { getSubmissionForReview } from "@/lib/admin/submissions";
import { ReviewClient } from "./review-client";

export default async function AdminSubmissionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await getSubmissionForReview(id);
  if (!submission) notFound();

  return <ReviewClient submission={submission} />;
}
