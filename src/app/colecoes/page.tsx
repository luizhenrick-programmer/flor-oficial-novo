import Link from "next/link";
import { FiltersDrawer } from "@/components/filters-drawer";
import { ProductCard } from "@/components/product-card";
import { ORDERS, buildHref, parseFilters, type Order } from "@/utils/catalog";
import {
  PAGE_SIZE,
  getCatalog,
  getFilterOptions,
} from "@/utils/products";

export const metadata = { title: "Coleções | Flor Oficial" };

const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-10";
const label = "eyebrow text-[0.62rem] text-primary";
const field =
  "h-11 w-full border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring";
const chip =
  "flex h-10 min-w-10 cursor-pointer items-center justify-center border border-border px-3 text-sm transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-1 peer-focus-visible:ring-ring";

export default async function ColecoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);

  const [{ products, total }, options] = await Promise.all([
    getCatalog(filters),
    getFilterOptions(),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCount =
    filters.tamanhos.length +
    filters.cores.length +
    (filters.busca ? 1 : 0) +
    (filters.min !== undefined || filters.max !== undefined ? 1 : 0);

  const form = (
    <form action="/colecoes" className="space-y-8">
      {filters.ordem !== "novidades" && (
        <input type="hidden" name="ordem" value={filters.ordem} />
      )}

      <div>
        <label htmlFor="busca" className={label}>
          Pesquisar
        </label>
        <input
          id="busca"
          name="busca"
          defaultValue={filters.busca}
          placeholder="Ex.: linho, vestido…"
          className={`${field} mt-3`}
        />
      </div>

      {options.sizes.length > 0 && (
        <fieldset>
          <legend className={label}>Tamanho</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.sizes.map((s) => (
              <label key={s}>
                <input
                  type="checkbox"
                  name="tamanho"
                  value={s}
                  defaultChecked={filters.tamanhos.includes(s)}
                  className="peer sr-only"
                />
                <span className={chip}>{s}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {options.colors.length > 0 && (
        <fieldset>
          <legend className={label}>Cor</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.colors.map((c) => (
              <label key={c}>
                <input
                  type="checkbox"
                  name="cor"
                  value={c}
                  defaultChecked={filters.cores.includes(c)}
                  className="peer sr-only"
                />
                <span className={chip}>{c}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className={label}>Preço (R$)</legend>
        <div className="mt-3 flex items-center gap-3">
          <input
            name="min"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            defaultValue={filters.min}
            placeholder="Mín."
            aria-label="Preço mínimo"
            className={field}
          />
          <span className="text-muted-foreground">–</span>
          <input
            name="max"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            defaultValue={filters.max}
            placeholder="Máx."
            aria-label="Preço máximo"
            className={field}
          />
        </div>
      </fieldset>

      <div className="space-y-4">
        <button type="submit" className="btn-primary w-full">
          Aplicar filtros
        </button>
        {activeCount > 0 && (
          <Link
            href="/colecoes"
            className="eyebrow link-underline block pb-1 text-center text-[0.62rem] text-muted-foreground"
          >
            Limpar filtros
          </Link>
        )}
      </div>
    </form>
  );

  return (
    <main className="overflow-x-clip">
      <section className={`${wrap} py-12 lg:py-16`}>
        <div className="text-center">
          <p className="eyebrow text-muted-foreground">Flor Oficial</p>
          <h1 className="mt-3 text-4xl text-primary sm:text-5xl">Coleções</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Todas as peças, do 46 ao 56.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-14">
          <FiltersDrawer activeCount={activeCount}>{form}</FiltersDrawer>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-4">
              <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? "peça" : "peças"}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {(Object.keys(ORDERS) as Order[]).map((o) => (
                  <Link
                    key={o}
                    href={buildHref(filters, { ordem: o, pagina: 1 })}
                    className={`eyebrow pb-1 text-[0.62rem] ${
                      filters.ordem === o
                        ? "border-b border-primary text-primary"
                        : "link-underline text-muted-foreground"
                    }`}
                  >
                    {ORDERS[o]}
                  </Link>
                ))}
              </div>
            </div>

            {products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-display text-2xl text-primary">
                  Nenhuma peça encontrada
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tente mudar ou remover alguns filtros.
                </p>
                <Link href="/colecoes" className="btn-outline mt-8">
                  Limpar filtros
                </Link>
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 md:grid-cols-3 lg:gap-x-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {pages > 1 && (
              <nav
                aria-label="Paginação"
                className="mt-14 flex flex-wrap items-center justify-center gap-2"
              >
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={buildHref(filters, { pagina: n })}
                    aria-current={n === filters.pagina ? "page" : undefined}
                    className={`flex h-10 w-10 items-center justify-center border text-sm transition ${
                      n === filters.pagina
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}