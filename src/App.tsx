import { useEffect, useRef } from "react";
import { useStore } from "./store";
import { webApi } from "./api";
import { getDomain } from "./lib/utils";
import LoginPage from "./pages/LoginPage";
import PredictPage from "./pages/PredictPage";
import ConfirmPage from "./pages/ConfirmPage";
import SuccessPage from "./pages/SuccessPage";
import MyPredictionsPage from "./pages/MyPredictionsPage";
import DonePage from "./pages/DonePage";

export default function App() {
  const { screen, setScreen, setCampaign, setEmployee, campaign, employee } =
    useStore();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const storedEmployee = sessionStorage.getItem("web_employee");
    const storedCampaign = sessionStorage.getItem("web_campaign");

    if (storedEmployee && storedCampaign) {
      setEmployee(JSON.parse(storedEmployee));
      setCampaign(JSON.parse(storedCampaign));
      setScreen("predict");
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

  const bgStyle = campaign?.web_bg_url
    ? {
        backgroundImage: `url(${campaign.web_bg_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  const isFullScreen =
    screen === "predict" ||
    screen === "confirm" ||
    screen === "my-predictions" ||
    screen === "done";

  if (isFullScreen) {
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
        {screen === "predict" && <PredictPage />}
        {screen === "confirm" && <ConfirmPage />}
        {screen === "my-predictions" && <MyPredictionsPage />}
        {screen === "done" && <DonePage />}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: campaign?.web_bg_url
          ? undefined
          : "linear-gradient(135deg, #0f1923 0%, #1a2332 50%, #1B3A5C 100%)",
        ...bgStyle,
      }}
    >
      <div className="w-full max-w-4xl animate-fade-in">
        {campaign?.logo_url && (
          <div className="flex justify-center mb-6">
            <img
              src={campaign.logo_url}
              alt="Logo"
              className="h-16 object-contain"
            />
          </div>
        )}

        {screen === "login" && <LoginPage />}
        {screen === "success" && <SuccessPage />}

        {screen === "splash" && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#7a8899] mt-4">Cargando...</p>
          </div>
        )}
      </div>
    </div>
  );
}
