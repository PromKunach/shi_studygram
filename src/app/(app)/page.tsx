import Image from "next/image";
import { Search } from "lucide-react";
import { RecentlyVisitedRow } from "@/components/recently-visited-row";
import { UpcomingEventsSection } from "@/components/upcoming-events-section";
import { Input } from "@/components/ui/input";
import { PAGE_MAIN_CENTERED } from "@/lib/layout";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className={cn(PAGE_MAIN_CENTERED)}>
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-12 flex flex-col items-center gap-5 sm:mb-16 md:mb-24 md:gap-6">
          <div className="flex justify-center">
            <Image
              src="/images/logo_dark.png"
              alt="Shi studygram"
              width={640}
              height={240}
              className="h-auto max-h-28 w-auto sm:max-h-36 md:max-h-44 dark:hidden"
              priority
            />
            <Image
              src="/images/logo_light.png"
              alt="Shi studygram"
              width={640}
              height={240}
              className="hidden h-auto max-h-28 w-auto sm:max-h-36 md:max-h-44 dark:block"
              priority
            />
          </div>

          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              placeholder="Search..."
              className="h-10 bg-sidebar pl-9 shadow-none"
              aria-label="Search"
            />
          </div>
        </div>

        <RecentlyVisitedRow />
        <UpcomingEventsSection />
      </div>
    </main>
  );
}
