import { BrainCircuit } from "lucide-react";

import { AuthForm } from "./auth-form";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 text-ink">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-on-accent">
              <BrainCircuit className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">AI Knowledge</p>
              <p className="text-sm text-muted">Private grounded answers</p>
            </div>
          </div>
          <div>
            <h2 className="max-w-2xl text-4xl font-semibold tracking-normal text-ink">
              Your notes become answers you can trace.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-body">
              Start with one saved text note. The app chunks it, embeds it, and
              answers only from what you stored.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Private by default", "Cited answers", "Ready for retrieval"].map(
              (item) => (
                <div
                  className="rounded-lg border border-border-subtle bg-surface p-4 text-sm font-medium text-ink shadow-sm"
                  key={item}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </section>
        <AuthForm />
      </div>
    </main>
  );
}
