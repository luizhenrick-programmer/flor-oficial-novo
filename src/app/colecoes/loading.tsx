// Esqueleto exibido enquanto o catálogo carrega (ao filtrar, ordenar ou paginar).
export default function Loading() {
  return (
    <main>
      <section
        aria-busy="true"
        className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-10 lg:py-16"
      >
        <div className="mx-auto h-12 w-56 animate-pulse bg-sand" />
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 md:grid-cols-3 lg:gap-x-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] animate-pulse bg-sand" />
              <div className="mx-auto mt-5 h-4 w-3/4 animate-pulse bg-sand" />
              <div className="mx-auto mt-3 h-3 w-1/2 animate-pulse bg-sand" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
