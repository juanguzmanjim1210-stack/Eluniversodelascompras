/** Texto con saltos de línea y **negritas** (el mismo formato que el panel de administración). */
export default function RichText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`whitespace-pre-line break-words ${className}`}>
      {text
        .trim()
        .split(/(\*\*[^*]+\*\*)/)
        .map((part, i) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={i} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
    </div>
  );
}
