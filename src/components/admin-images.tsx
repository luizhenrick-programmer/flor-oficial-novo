"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "@/components/icons";
import {
  createImageUpload,
  deleteImage,
  registerImage,
  reorderImages,
  setImageColor,
} from "@/app/actions/admin-products";
import { ui } from "@/components/admin-ui";
import { BUCKET, IMAGE_TYPES, MAX_IMAGE_MB } from "@/utils/admin-shared";
import { createClient } from "@/utils/supabase/client";

export type AdminImage = { id: string; url: string; color: string | null };

export function ImagesManager({
  productId,
  images,
  colors,
}: {
  productId: string;
  images: AdminImage[];
  colors: string[]; // cores existentes nas variações
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      if (!IMAGE_TYPES[file.type]) {
        setError(`“${file.name}”: use JPG, PNG ou WebP.`);
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setError(`“${file.name}” passa de ${MAX_IMAGE_MB} MB.`);
        continue;
      }
      const signed = await createImageUpload(productId, file.name, file.type);
      if ("error" in signed) {
        setError(signed.error);
        continue;
      }
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
      if (upErr) {
        setError(`Falha ao enviar “${file.name}”: ${upErr.message}`);
        continue;
      }
      const reg = await registerImage(productId, signed.path);
      if ("error" in reg) setError(reg.error);
    }

    if (input.current) input.current.value = "";
    setBusy(false);
    router.refresh();
  }

  function run(action: () => Promise<{ ok: true } | { error: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if ("error" in res) setError(res.error);
      router.refresh();
    });
  }

  function move(index: number, dir: -1 | 1) {
    const ids = images.map((i) => i.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => reorderImages(productId, ids));
  }

  return (
    <section className={`${ui.card} p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Fotos</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            A primeira é a principal. JPG, PNG ou WebP, até {MAX_IMAGE_MB} MB cada. Ligue uma foto a uma cor para ela aparecer primeiro quando a cliente escolher essa cor.
          </p>
        </div>
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={ui.btn}>
          <ImagePlus className="h-4 w-4" strokeWidth={1.25} />
          {busy ? "Enviando…" : "Enviar fotos"}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

      {images.length === 0 ? (
        <p className="mt-8 border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Nenhuma foto ainda.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="border border-border">
              <div className="relative aspect-[3/4] bg-sand">
                <Image src={img.url} alt="" fill sizes="(min-width: 1024px) 15vw, 40vw" className="object-cover" />
                {i === 0 && (
                  <span className="eyebrow absolute left-2 top-2 bg-primary px-2 py-1 text-[0.5rem] text-primary-foreground">
                    Principal
                  </span>
                )}
              </div>
              <div className="space-y-2 p-2">
                {colors.length > 0 && (
                  <select
                    value={img.color ?? ""}
                    disabled={pending}
                    onChange={(e) => run(() => setImageColor(productId, img.id, e.target.value || null))}
                    className="h-9 w-full border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-ring"
                  >
                    <option value="">Todas as cores</option>
                    {colors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button type="button" aria-label="Mover para antes" disabled={pending || i === 0} onClick={() => move(i, -1)} className="flex h-8 w-8 items-center justify-center border border-border disabled:opacity-30">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Mover para depois" disabled={pending || i === images.length - 1} onClick={() => move(i, 1)} className="flex h-8 w-8 items-center justify-center border border-border disabled:opacity-30">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Excluir foto"
                    disabled={pending}
                    onClick={() => window.confirm("Excluir esta foto?") && run(() => deleteImage(productId, img.id))}
                    className="flex h-8 w-8 items-center justify-center text-muted-foreground transition hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.25} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
