import Image from "next/image";
import Link from "next/link";

export default function HomeHero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden border-b border-slate-800/50 bg-slate-950"
    >
      <Image
        src="/hero-nlp.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-slate-950/70"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/85 to-slate-950/95"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_40%,rgb(37_99_235_/_0.35),transparent_55%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_30%,rgb(99_102_241_/_0.25),transparent_50%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-20 text-center sm:py-24 md:py-28">
        <p className="mb-4 inline-flex rounded-full border border-blue-400/40 bg-blue-500/20 px-4 py-1.5 text-sm font-medium uppercase tracking-wide text-blue-100">
          Somali NLP
        </p>
        <h1 className="mb-6 max-w-3xl text-4xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl md:leading-tight">
          Generate, save, and revisit Somali news headlines
        </h1>
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-200 sm:text-xl">
          A lightweight tool powered by a fine-tuned mT5 model. Paste an
          article, get a headline plus category, and keep each result in your
          personal history.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/predict"
            className="rounded-md border border-blue-500 bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-950/40 transition-colors hover:border-blue-400 hover:bg-blue-500"
          >
            Generate a headline
          </Link>
          <Link
            href="/news"
            className="rounded-md border border-white/25 bg-white/15 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/25"
          >
            Browse headlines
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-white/25 bg-white/15 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/25"
          >
            Create an account
          </Link>
        </div>
      </div>
    </section>
  );
}
