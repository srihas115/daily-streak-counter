import { isAuthenticated } from "@/lib/auth";
import { getStreakDisplay } from "@/lib/streaks";
import CheckInButton from "./CheckInButton";

export default async function StreakPage({ params }: { params: Promise<{ streak: string }> }) {
  const { streak } = await params;
  const slug = decodeURIComponent(streak);
  const [display, authenticated] = await Promise.all([getStreakDisplay(slug), isAuthenticated()]);

  return (
    <CheckInButton
      slug={slug}
      authenticated={authenticated}
      initialCount={display.count}
      initialLongest={display.longest}
      initialNextMilestone={display.nextMilestone}
      initialLongestStartDate={display.longestStartDate}
      initialLongestEndDate={display.longestEndDate}
      initialLongestOngoing={display.longestOngoing}
      initialCheckedInToday={display.checkedInToday}
      initialTimezone={display.timezone}
      initialDescription={display.description}
    />
  );
}
