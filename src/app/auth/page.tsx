import Image from "next/image";

import { BrandLockup } from "@/presentation/ui";

import { AuthForm } from "./auth-form";

export default function AuthPage() {
  return (
    <main className="relative h-dvh overflow-hidden bg-ink text-on-accent">
      <Image
        alt="A quiet modern library with rows of books ready to explore"
        className="object-cover object-center"
        fill
        priority
        sizes="100vw"
        src="/images/auth-library.webp"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-ink/65"
      />

      <header className="absolute left-5 top-5 z-10 sm:left-8 sm:top-8 lg:left-12 lg:top-10">
        <BrandLockup className="h-9 w-36 [&_img]:brightness-0 [&_img]:invert" />
      </header>

      <div className="relative z-10 mx-auto h-full max-w-7xl px-4 pb-4 pt-20 sm:px-8 sm:pb-8 sm:pt-24 lg:px-12 lg:py-10">
        <section
          aria-labelledby="auth-introduction"
          className="absolute bottom-20 left-12 hidden max-w-sm lg:block xl:max-w-2xl"
        >
          <h2
            className="text-5xl font-semibold leading-tight tracking-tight text-balance xl:text-6xl"
            id="auth-introduction"
          >
            Keep what matters. Find it when you need it.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-on-accent/85">
            Turn the notes and sources you trust into clear answers with a trail
            back to the original context.
          </p>
        </section>

        <section
          aria-label="Loresay account access"
          className="flex h-full w-full items-start lg:ml-auto lg:max-w-md lg:items-center"
        >
          <div className="mx-auto w-full max-w-md text-ink">
            <AuthForm />
            <p className="mt-4 text-center text-xs leading-5 text-on-accent/80 [@media(max-height:700px)]:hidden">
              Your workspace stays private to your account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
