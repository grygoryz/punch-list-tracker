import Link from "next/link";
import { NewProjectForm } from "./form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/projects" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Back to projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">New project</h1>
      </div>
      <NewProjectForm />
    </div>
  );
}
