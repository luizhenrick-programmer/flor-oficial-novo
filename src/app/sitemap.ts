import type { MetadataRoute } from "next";
import { supabase } from "@/utils/supabase/supabase";

export const revalidate = 3600;

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["", "/colecoes", "/sobre", "/contato"].map(
    (path) => ({ url: `${site}${path}` }),
  );

  const { data } = await supabase
    .from("products")
    .select("slug, created_at")
    .eq("is_active", true);

  const products: MetadataRoute.Sitemap = (
    (data ?? []) as { slug: string; created_at: string }[]
  ).map((p) => ({
    url: `${site}/colecoes/${p.slug}`,
    lastModified: p.created_at,
  }));

  return [...pages, ...products];
}
