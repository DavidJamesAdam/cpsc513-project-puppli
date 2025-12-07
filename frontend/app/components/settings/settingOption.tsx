import "../../styles/settings.css";

interface SettingOptionProps {
  settingName: string;
  enabled?: boolean;
}

// gets the icon based on the setting name
function getIcon(name: string, enabled?: boolean) {
  const notificationsEnabledIcon = "/assets/icons/notificationsEnabled.svg";
  const notificationsDisabledIcon = "/assets/icons/notificationsDisabled.svg";
  const passwordIcon = "/assets/icons/password.svg";
  const usernameIcon = "/assets/icons/username.svg";
  const faqsIcon = "/assets/icons/faqs.svg";
  if (name === "Notifications" && enabled === false) {
    return notificationsDisabledIcon;
  } else if (name === "Notifications" && enabled === true) {
    return notificationsEnabledIcon;
  } else if (name === "Change email") {
    return usernameIcon;
  } else if (name === "Change password") {
    return passwordIcon;
  } else if (name === "FAQs") {
    return faqsIcon;
  }
}

export default function SettingOption({
  settingName,
  enabled,
}: SettingOptionProps) {
  return (
    <>
      <div className="options">
        <img src={getIcon(settingName, enabled)} alt="" />
        <h1 className="optionTitle">{settingName}</h1>
        {enabled}
      </div>
    </>
  );
}
