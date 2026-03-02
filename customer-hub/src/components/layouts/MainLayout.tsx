import { ModeToggle } from "@/components/shared/ModeToggle";
import { GetTheme } from "@/components/shared/ThemeProvider";
import { GetAuthContext } from "@/contexts/auth/GetAuthContext";
import { invertColor } from "@/lib/utils";
import { Outlet } from "react-router-dom";
import TopNav from "@/components/layouts/TopNav";

const MainLayout: React.FC = () => {

  const { tenantData} = GetAuthContext();
  const { theme } = GetTheme()

  return (
    <div className="md:min-h-screen flex flex-col md:px-4"
      style={{
        backgroundColor: theme === 'dark'
          ? invertColor(tenantData?.button_text_color)
          : theme === 'light' ?
            tenantData?.button_text_color
            : window.matchMedia('(prefers-color-scheme: dark)').matches
              ? invertColor(tenantData?.button_text_color) // Apply inverted color if dark mode
              : tenantData?.button_text_color // Use original color if light mode
      }}
    >
      
      <div className="flex-1 mx-auto w-full max-w-7xl flex flex-col md:flex-row bg-white dark:bg-black rounded-md mt-0 md:mt-7">
      {window.matchMedia('(prefers-color-scheme: dark)').matches}
        {/* Sidebar area (top on mobile, left on desktop) */}
        <div className="w-full flex flex-col w-76 md:w-112 md:border-r md:border-gray-100 dark:md:border-gray-800 pt-6 md:pt-10">
        <div className="text-left flex-1 pl-5 md:pl-13">
            {/* Flex container for mobile, stacked on desktop */}
            <div className="flex items-center justify-between md:block">
              {tenantData?.entire_logo_url ? (
                <img
                  src={tenantData?.entire_logo_url}
                  alt="Company Logo"
                  className="h-12 mb-2 dark:filter dark:invert"
                />
              ) : (
                <h2 className="text-xl font-bold mt-5">{tenantData?.name}</h2>
              )}

              {/* ModeToggle shows next to logo on mobile only */}
              <div className="md:hidden pr-6">
                <ModeToggle align="end" />
              </div>
            </div>

            {/* Mobile hidden text, only on desktop */}
            <div className="md:text-xl mt-4 md:mt-16 hidden md:block w-82">
              {tenantData?.name} and Lunarpay make billing fast, easy and hassle free.
            </div>

            {/* Desktop toggle below text */}
            <div className="hidden md:block mt-5">
              <ModeToggle align="start" />
            </div>
          </div>

          {/* Footer - Positioned at the bottom of the sidebar on desktop */}
          <div className="sticky bottom-6 hidden md:block pl-8">
            <FooterContent />
          </div>
        </div>

        <main className="flex-1 pt-2 px-6 pb-0 md:pt-3 mb-16 md:mb-0">
          <TopNav />
          <Outlet />
        </main>
        {/* Footer - Visible at the bottom of the page on mobile only */}
        <div className="fixed text-center bottom-0 md:hidden w-full py-4
  bg-gradient-to-t from-white to-white/40
  dark:from-black dark:to-black/10
">
          <FooterContent />

        </div>
      </div>
    </div>
  )
};

export default MainLayout;

export const FooterContent = () => {
  return (
    <div className="flex flex-col">
      <p className="text-sm font-semibold">
        Powered by <a target="_BLANK" href="https://lunarpay.com" > Lunar <img
          src="https://app.lunarpay.com/assets/thm2/images/brand/logo.png?ver=1.0"
          alt="LunarPay"
          className="h-4 inline-block dark:filter dark:invert"
        /></a>
      </p>
    </div>
  );
};