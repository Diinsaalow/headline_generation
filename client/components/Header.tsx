import Link from "next/link";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
];

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto_1fr] items-center px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-blue-600"
        >
          HeadlineAI
        </Link>

        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-600 transition-colors hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex justify-end">
          <Link
            href="/predict"
            className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-blue-700 hover:bg-blue-700"
          >
            Try it now
          </Link>
        </div>
      </div>
    </header>
  );
}
