import Link from "next/link";
import tw from "../../utils/tw";
import HeaderGlobalNotification from "./header-global-notification";
import HeaderLogo from "./header-logo";
import HeaderNav from "./header-nav";
import HeaderThemeSwitch from "./header-theme-switch";
import HeaderVersionSelect from "./header-version-select";

let cache: Record<string, Record<string, string>> | null = null;

async function fetchVersions() {
  if (process.env.NODE_ENV !== "production" && cache) {
    return cache;
  }

  const [react] = await Promise.all([
    fetch("https://registry.npmjs.org/@ariakit/react"),
    // fetch("https://registry.npmjs.org/@ariakit/dom"),
  ]);

  if (!react.ok) {
    throw new Error("Failed to fetch versions");
  }

  const reactData = await react.json();
  // const domData = await dom.json();

  const versions = {
    "@ariakit/react": reactData["dist-tags"] as Record<string, string>,
    // "@ariakit/dom": domData["dist-tags"],
  };

  cache = versions;

  return versions;
}

export default async function Header() {
  const versions = await fetchVersions();
  return (
    <div
      className={tw`
      sticky top-0 left-0 z-40 flex w-full justify-center
      bg-gray-50 backdrop-blur supports-backdrop-blur:bg-gray-50/80
      dark:bg-gray-800  dark:supports-backdrop-blur:bg-gray-800/80`}
    >
      <div className="flex w-full max-w-[1440px] items-center gap-4 p-3 sm:p-4">
        <Link
          href="/"
          className={tw`
          flex items-center gap-2 rounded-[9px] focus-visible:ariakit-outline`}
        >
          <span className="sr-only">Ariakit</span>
          <HeaderLogo />
        </Link>
        <div className="flex items-center gap-1">
          <HeaderVersionSelect versions={versions} />
          <HeaderNav />
        </div>
        <div className="flex-1" />
        <HeaderGlobalNotification />
        <HeaderThemeSwitch />
      </div>
    </div>
  );
}
