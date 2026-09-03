'use client';

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="shell">
      <section className="panel" aria-labelledby="error-title">
        <p className="eyebrow">Unexpected error</p>
        <h1 id="error-title">The workspace needs a reset.</h1>
        <p className="lede">
          The request could not be completed. No financial action was performed.
        </p>
        <button className="button" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
