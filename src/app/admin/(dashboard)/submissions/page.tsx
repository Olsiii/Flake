import { listPendingSubmissions } from "@/lib/admin/submissions";
import { SubmissionsClient } from "./submissions-client";

export default async function AdminSubmissionsPage() {
  const submissions = await listPendingSubmissions();
  return <SubmissionsClient initialSubmissions={submissions} />;
}
