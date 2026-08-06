import HomeHero from "@/components/home/HomeHero";

const features = [
  {
    title: "Somali headline generation",
    description:
      "Turn full article text into concise, readable Somali headlines tuned for news-style writing.",
  },
  {
    title: "Automatic category labeling",
    description:
      "Each prediction includes a category tag so articles can be routed to the right section.",
  },
  {
    title: "Fine-tuned mT5 model",
    description:
      "Built on a multilingual T5 model adapted specifically for Somali headline and category tasks.",
  },
  {
    title: "Account history",
    description:
      "Create an account to save every generated headline alongside the original article and timestamp.",
  },
];

const steps = [
  {
    step: "1",
    title: "Paste your article",
    description:
      "Provide the full body of a Somali news article - the model reads the content, not just a summary.",
  },
  {
    step: "2",
    title: "Model generates output",
    description:
      "The fine-tuned mT5 model produces a headline and category in a structured format.",
  },
  {
    step: "3",
    title: "Review or revisit later",
    description:
      "Use the generated headline right away or open your saved history whenever you want to review it again.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <HomeHero />

      <section
        id="how-it-works"
        className="border-b border-blue-700 bg-blue-600"
      >
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-200">
              How it works
            </p>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              Three simple steps
            </h2>
            <p className="text-blue-100">
              From article text to saved headline and category.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-blue-400 bg-blue-700 p-6"
              >
                <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white text-sm font-semibold text-blue-600">
                  {item.step}
                </span>
                <h3 className="mb-2 font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-blue-100">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-semibold text-slate-900">
              Features
            </h2>
            <p className="text-slate-600">
              Everything you need for Somali headline generation in one place.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-slate-200 p-6"
              >
                <h3 className="mb-2 font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
