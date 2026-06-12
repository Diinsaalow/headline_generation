import Link from 'next/link'

const navLinks = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
  { label: 'Predict', href: '/predict' },
]

export default function Footer() {
  return (
    <footer className='mt-auto border-t border-slate-200 bg-white'>
      <div className='mx-auto max-w-5xl px-6 py-10'>
        <div className='flex flex-col items-center gap-6 sm:flex-row sm:justify-between'>
          <Link
            href='/'
            className='text-sm font-semibold tracking-tight text-blue-600'
          >
            HeadlineAI
          </Link>

          <nav className='flex flex-wrap items-center justify-center gap-6'>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='text-sm text-slate-600 transition-colors hover:text-blue-600'
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className='mt-8 border-t border-slate-200 pt-6 text-center'>
          <p className='mt-2 text-xs text-slate-400'>
            &copy; {new Date().getFullYear()} HeadlineAI
          </p>
        </div>
      </div>
    </footer>
  )
}
