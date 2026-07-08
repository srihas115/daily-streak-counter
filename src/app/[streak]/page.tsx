import { nextMilestone, resolveStreak } from "@/lib/streaks";
import CheckInButton from "./CheckInButton";

export default async function StreakPage({ params }: { params: Promise<{ streak: string }> }) {
  const { streak } = await params;
  const slug = decodeURIComponent(streak);
  const { data, checkedInToday } = await resolveStreak(slug);

  return (
    <CheckInButton
      slug={slug}
      initialCount={data.count}
      initialLongest={data.longest}
      initialNextMilestone={nextMilestone(data.count)}
      initialCheckedInToday={checkedInToday}
    />
  );
}
