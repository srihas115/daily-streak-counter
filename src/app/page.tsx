import { isAuthenticated } from "@/lib/auth";
import { getAppSettings } from "@/lib/settings";
import { listAllStreaks } from "@/lib/streaks";
import HomeView from "./HomeView";

export default async function Home() {
  const [authenticated, settings, streaks] = await Promise.all([
    isAuthenticated(),
    getAppSettings(),
    listAllStreaks(),
  ]);

  return (
    <HomeView
      authenticated={authenticated}
      passwordSet={settings.passwordSet}
      siteDescription={settings.siteDescription}
      streaks={streaks}
    />
  );
}
