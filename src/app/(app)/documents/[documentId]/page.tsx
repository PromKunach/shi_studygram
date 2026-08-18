import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { PAGE_MAIN } from "@/lib/layout";
import { cn } from "@/lib/utils";

type DocumentPageProps = {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ section?: string }>;
};

export default async function DocumentPage({ params, searchParams }: DocumentPageProps) {
  const { documentId } = await params;
  const { section } = await searchParams;
  const isNew = documentId === "new";
  const title = isNew ? "เอกสารใหม่" : "ตัวอย่างเอกสาร";

  return (
    <main className={cn(PAGE_MAIN)}>
      <article className="mx-auto w-full max-w-3xl">
        <Link
          href="/documents"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          เอกสาร
        </Link>

        <header className="mb-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-hover text-foreground">
            <FileText className="h-7 w-7" strokeWidth={1.75} />
          </div>

          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-[40px]">
            {title}
          </h1>

          <p className="mt-3 text-sm text-muted">
            {isNew ? "ยังไม่ได้บันทึก" : "แก้ไขล่าสุดเมื่อสักครู่"}
            {section ? ` · ${section}` : null}
          </p>
        </header>

        <div className="space-y-6 text-base leading-relaxed text-foreground">
          <p className="text-muted">
            นี่คือหน้าตัวอย่างเอกสาร — พื้นที่สำหรับพิมพ์เนื้อหา บันทึกย่อ
            หรือโน้ตการเรียนจะอยู่ตรงนี้
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">หัวข้อตัวอย่าง</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">รายการ</h2>
            <ul className="list-disc space-y-2 pl-6 text-muted">
              <li>จุดสำคัญที่หนึ่ง</li>
              <li>จุดสำคัญที่สอง</li>
              <li>จุดสำคัญที่สาม</li>
            </ul>
          </section>

          <section className="rounded-xl border border-dashed border-border bg-sidebar px-5 py-8 text-center text-sm text-muted">
            พื้นที่เนื้อหาเพิ่มเติม — เช่น ตาราง รูปภาพ หรือบล็อกโน้ต
          </section>
        </div>
      </article>
    </main>
  );
}
