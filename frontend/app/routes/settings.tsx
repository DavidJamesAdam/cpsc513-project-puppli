import type { Route } from "./+types/settings";
import Header from "../components/header/header";
import SettingOption from "../components/settings/settingOption";
import "../styles/settings.css";
import ChangePasswordModal from "~/components/modals/change-password-modal/change-password-modal";
import FAQModal from "~/components/modals/faq-modal/faq-modal";
import { authCheck } from "../utils/authCheck";
import { useEffect, useState } from "react";
import ChangeEmailModal from "~/components/modals/change-email-modal/change-email-modal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings" },
    { name: "description", content: "Settings Page" },
  ];
}

const version = "1.0.0";

export default function Settings() {
  const settingsIcon = "/assets/icons/settings.svg";
  const aboutIcon = "/assets/icons/about.svg";
  const userIcon = "/assets/icons/user.svg";
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        await authCheck();
        setAuthorized(true);
      } catch (e) {
        // Not authenticated — redirect to login.
        window.location.href = "/login";
      }
    })();
  }, []);

  if (authorized === null) {
    // Still checking; render nothing (avoids showing protected content).
    return null;
  }
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "var{--bg-color}", padding: "60px" }}>
        <div className="settings">
          <img src={settingsIcon} alt="" />
          <h1 className="optionTitle">Settings</h1>
        </div>
        <div className="listOptions">
          <SettingOption
            settingName={"Notifications"}
            enabled={true}
          ></SettingOption>
          <div className="options">
            <img src={userIcon} alt="" />
            <h1 className="optionTitle">User</h1>
          </div>
          <div className="userOptions">
            <ChangeEmailModal />
            <ChangePasswordModal />
          </div>
          <FAQModal />
          <div className="options">
            <img src={aboutIcon} alt="" />
            <h1 className="optionTitle">About</h1>
            <span id="version">Version: {version}</span>
          </div>
        </div>
      </main>
    </>
  );
}
