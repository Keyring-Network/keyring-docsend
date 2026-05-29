"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export function ImageDeck({ images }: { images: string[] }): React.ReactNode {
  const [index, setIndex] = useState(0);
  const count = images.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(count - 1, Math.max(0, i + delta))),
    [count],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (count === 0) {
    return (
      <main style={{ padding: 40, fontFamily: "system-ui" }}>
        No images found in <code>public/content/</code>.
      </main>
    );
  }

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        background: "#0f0f10",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", flex: 1 }}>
        <Image
          src={`/content/${images[index]}`}
          alt={`Slide ${index + 1}`}
          fill
          sizes="100vw"
          style={{ objectFit: "contain" }}
          priority
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: 16,
          color: "#f6f4ef",
        }}
      >
        <button
          type="button"
          className="btn"
          style={{ width: "auto" }}
          onClick={() => go(-1)}
        >
          ‹
        </button>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {index + 1} / {count}
        </span>
        <button
          type="button"
          className="btn"
          style={{ width: "auto" }}
          onClick={() => go(1)}
        >
          ›
        </button>
      </div>
    </main>
  );
}
