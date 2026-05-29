import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { redirect } from "next/navigation";
import { resolveImageList } from "@/lib/content";
import { siteConfig } from "@/siteConfig";
import { ImageDeck } from "@/app/components/ImageDeck";

export const dynamic = "force-dynamic";

const CONTENT_DIR = join(process.cwd(), "public", "content");

function PdfViewer({ file }: { file: string }): React.ReactNode {
  return (
    <iframe
      src={`/content/${file}`}
      title={siteConfig.siteName}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", border: 0 }}
    />
  );
}

export default async function DeckPage(): Promise<React.ReactNode> {
  const { content } = siteConfig;

  if (content.type === "html") {
    redirect(`/content/${content.htmlEntry}`);
  }
  if (content.type === "pdf") {
    return <PdfViewer file={content.pdfFile} />;
  }

  const entries = await readdir(CONTENT_DIR).catch(() => [] as string[]);
  return <ImageDeck images={resolveImageList([...content.images], entries)} />;
}
