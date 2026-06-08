import { AdminFeedbackClient } from "@/app/(admin)/admin/feedback/feedback-client";
import { adminListAllFeedback } from "@/lib/actions/admin-system";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const feedback = await adminListAllFeedback(200);
  return <AdminFeedbackClient initialData={feedback} />;
}
