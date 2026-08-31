interface ComingSoonProps {
  feature: string;         // "QR Attendance", "Gradebook Sync", etc.
  note?: string;           // optional short reason/context
  compact?: boolean;       // true = inline banner, false = full card
}

export default function ComingSoon({ feature, note, compact = false }: ComingSoonProps) {
  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 8,
          backgroundColor: "#fffbeb",
          color: "#92400e",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        🚧 {feature} — coming soon
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "48px 24px",
        borderRadius: 16,
        border: "1px dashed #d4d4d4",
        backgroundColor: "#fafafa",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28 }}>🚧</div>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#171717" }}>
        {feature} is coming soon
      </p>
      {note && (
        <p style={{ margin: 0, fontSize: 13, color: "#737373", maxWidth: 320 }}>{note}</p>
      )}
    </div>
  );
}
