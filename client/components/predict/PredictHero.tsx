import Image from "next/image";

export default function PredictHero() {
  return (
    <section className="relative min-h-[320px] w-full overflow-hidden border-b border-slate-800/50 bg-slate-950">
      <Image
        src="/hero-nlp.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden
      />

      <div aria-hidden className="absolute inset-0 bg-slate-950/70" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/85 to-slate-950/95"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_40%,rgb(37_99_235_/_0.35),transparent_55%)]"
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 sm:py-20 md:py-24">
        <div className="text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-100">
            AI-powered generation
          </p>
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
            Generate Somali news headlines
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
            Choose a model, paste your article, and preview the result before
            publishing to the public news feed.
          </p>
        </div>
      </div>
    </section>
  );
}
