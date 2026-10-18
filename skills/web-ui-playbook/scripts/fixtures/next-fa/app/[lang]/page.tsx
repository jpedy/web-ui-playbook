// Fixture: a Persian Next.js page (JSX reader). Expected (selftest §3e):
//  - physical-direction from a string inside cn() (ml-4) and from className={'…'} (pl-2): 2
//  - TypeScript code, generics and imports are not text: no Persian text findings from code lines
//  - generics (Promise<Metadata>, useState<string>) are not components: every JSX text resolves in --contrast
//  - <label htmlFor> links the input: no input-label warning
import type { Metadata } from "next";
import { cn } from "../../lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const title: Array<string> = ["فروشگاه"];
  return { title: title[0] };
}

export default async function Page() {
  const items = new Map<string, number>();
  return (
    <main className="bg-surface text-text">
      <h1 className={cn("text-3xl font-bold", "ml-4")}>فروشگاه سفال دست‌ساز</h1>
      <p className={'text-muted pl-2'}>هر قطعه با دست ساخته می‌شود.</p>
      <label htmlFor="qty">تعداد</label>
      <input id="qty" name="qty" />
      <p className="text-muted">{items.size} مورد</p>
    </main>
  );
}
