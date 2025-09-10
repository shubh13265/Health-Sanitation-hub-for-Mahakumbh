import { Link } from "react-router-dom";

export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border bg-card text-card-foreground shadow-sm">
        <div className="p-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-muted-foreground">
            {description || "This module will be built next. Use the navigation to explore other sections or continue prompting to flesh out this page."}
          </p>
          <div className="mt-6">
            <Link to="/" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground shadow hover:opacity-90">
              Go to Pilgrim Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
