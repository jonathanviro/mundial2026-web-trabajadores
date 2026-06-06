import { useEffect, useRef } from "react";
import { useStore } from "./store";
import { webApi } from "./api";
import { getDomain } from "./lib/utils";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  const { screen, setScreen, setCampaign, setEmployee } = useStore();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const storedEmployee = sessionStorage.getItem("web_employee");
    const storedCampaign = sessionStorage.getItem("web_campaign");

    if (storedEmployee && storedCampaign) {
      setEmployee(JSON.parse(storedEmployee));
      setCampaign(JSON.parse(storedCampaign));
      setScreen("dashboard");
      return;
    }

    const domain = getDomain();
    const slug = import.meta.env.VITE_CAMPAIGN_SLUG;
    webApi
      .campaignByDomain(domain, slug)
      .then((campaign) => {
        setCampaign(campaign);
        setScreen("login");
      })
      .catch(() => {
        setScreen("login");
      });
  }, []);

  const { campaign } = useStore();

  const bgStyle = campaign?.web_bg_url
    ? {
        backgroundImage: `url(${campaign.web_bg_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  return (
    <div
      className="h-screen flex flex-col"
      style={{
        background: campaign?.web_bg_url
          ? undefined
          : "linear-gradient(135deg, #0f1923 0%, #1a2332 50%, #1B3A5C 100%)",
        ...bgStyle,
      }}
    >
      {screen === "dashboard" && <DashboardPage />}

      {screen === "login" && (
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl animate-fade-in py-6">
              {campaign?.logo_url && (
                <div className="flex justify-center mb-12">
                  <img
                    src={campaign.logo_url}
                    alt="Logo"
                    className="h-48 object-contain"
                  />
                </div>
              )}
              <LoginPage />
            </div>
          </div>
        </div>
      )}

      {screen === "splash" && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#7a8899] mt-4">Cargando...</p>
          </div>
        </div>
      )}
    </div>
  );
}
