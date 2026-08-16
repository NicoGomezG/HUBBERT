export interface EmbedPreviewField {
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedPreviewData {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  color?: number | null;
  authorName?: string | null;
  authorIconUrl?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  footerText?: string | null;
  footerIconUrl?: string | null;
  showTimestamp?: boolean;
  fields: EmbedPreviewField[];
}

export function EmbedPreview({ data }: { data: EmbedPreviewData }) {
  const barColor = data.color != null ? `#${data.color.toString(16).padStart(6, "0")}` : "#4b4d53";
  const isEmpty =
    !data.title &&
    !data.description &&
    !data.imageUrl &&
    !data.authorName &&
    data.fields.length === 0;

  return (
    <div className="rounded-md bg-[#313338] p-4 font-sans">
      <div className="flex gap-3 rounded border-l-4 bg-[#2b2d31] p-4" style={{ borderColor: barColor }}>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {data.authorName && (
            <div className="flex items-center gap-2">
              {data.authorIconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.authorIconUrl} alt="" className="h-5 w-5 rounded-full" />
              )}
              <span className="text-sm font-medium text-zinc-200">{data.authorName}</span>
            </div>
          )}

          {data.title && (
            <p className="text-base font-semibold text-white">{data.title}</p>
          )}

          {data.description && (
            <p className="whitespace-pre-wrap text-sm text-zinc-300">{data.description}</p>
          )}

          {data.fields.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {data.fields.map((field, i) => (
                <div key={i} className={field.inline ? "col-span-1" : "col-span-3"}>
                  <p className="text-sm font-semibold text-white">{field.name || " "}</p>
                  <p className="whitespace-pre-wrap text-sm text-zinc-300">{field.value || " "}</p>
                </div>
              ))}
            </div>
          )}

          {data.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.imageUrl} alt="" className="mt-1 max-h-64 rounded object-cover" />
          )}

          {(data.footerText || data.showTimestamp) && (
            <div className="mt-1 flex items-center gap-2">
              {data.footerIconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.footerIconUrl} alt="" className="h-5 w-5 rounded-full" />
              )}
              <span className="text-xs text-zinc-400">
                {[data.footerText, data.showTimestamp ? "hoy" : null].filter(Boolean).join(" • ")}
              </span>
            </div>
          )}

          {isEmpty && (
            <p className="text-sm italic text-zinc-500">
              El embed está vacío — completá título, descripción o un field.
            </p>
          )}
        </div>

        {data.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.thumbnailUrl} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
        )}
      </div>
    </div>
  );
}
