import { getGreeting } from "@/lib/greeting";

export default function HomePage() {
  const greeting = getGreeting();

  return (
    <main className="flex h-full flex-col px-16 py-12">
      <h1 className="text-[32px] font-semibold leading-[1.2] text-foreground">
        {greeting}
      </h1>
      <div className="mt-8 flex-1" />
    </main>
  );
}
