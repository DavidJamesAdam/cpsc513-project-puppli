import "../../styles/settings.css";
  import notificationsEnabledIcon from "../../assets/icons/notificationsEnabled.svg";
  import notificationsDisabledIcon from "../../assets/icons/notificationsDisabled.svg";
  import passwordIcon from "../../assets/icons/password.svg";
  import usernameIcon from "../../assets/icons/username.svg";
  import faqsIcon from "../../assets/icons/faqs.svg";

interface SettingOptionProps {
  settingName: string;
  enabled?: boolean;
}

// gets the icon based on the setting name
function getIcon(name: string, enabled?: boolean) {

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
