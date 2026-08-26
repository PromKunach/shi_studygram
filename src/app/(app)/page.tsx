import Image from "next/image";
import { HomeHeroSearch } from "@/components/home-hero-search";
import { RecentlyVisitedRow } from "@/components/recently-visited-row";
import { UpcomingEventsSection } from "@/components/upcoming-events-section";
import { PAGE_MAIN_CENTERED } from "@/lib/layout";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className={cn(PAGE_MAIN_CENTERED)}>
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-10 flex flex-col items-center gap-5 sm:mb-12 md:mb-16 md:gap-6">
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

          <HomeHeroSearch />
        </div>

        <RecentlyVisitedRow />
        <UpcomingEventsSection />
      </div>
    </main>
  );
}
