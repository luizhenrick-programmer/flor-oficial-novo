"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem" }}>Algo deu errado</h1>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          {error.message ?? "Ocorreu um erro inesperado."}
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1.25rem",
            border: "1px solid #d1d5db",
            cursor: "pointer",
            background: "transparent",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}

