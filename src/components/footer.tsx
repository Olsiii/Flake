import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-300 bg-neutral-200">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-lg font-semibold tracking-tight text-neutral-950">
              Flake
            </span>
            <p className="mt-2 max-w-xs text-sm text-neutral-600">
              Search in plain English, save what you like, and get matched to
              a home that actually fits.
            </p>
          </div>

          <div>
            <div className="text-2xs font-semibold tracking-wide text-neutral-600 uppercase">Explore</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/search"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  Search listings
                </Link>
              </li>
              <li>
                <Link
                  href="/get-started"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  Take the quiz
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-2xs font-semibold tracking-wide text-neutral-600 uppercase">Account</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/sign-in"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  Create account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-2xs font-semibold tracking-wide text-neutral-600 uppercase">Contact</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="mailto:flakeeestate@gmail.com"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  flakeeestate@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-300 pt-6 text-xs text-neutral-600">
          © {year} Flake. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
