import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import "./styles.css";
import { menuStyle, menuItemStyle, mobileMenuStyle, mobileMenuItemStyle } from "./mui-styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import notificationBell from "~/assets/icons/notification_bell.svg"
import dropdownArrow from "~/assets/icons/mdi_arrow-down-drop.svg"

export default function NotificationMenu() {
  const matches = useMediaQuery("(min-width: 600px)");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <img src={notificationBell} />
          <img
            src={dropdownArrow}
            style={{ position: "absolute", left: -12, bottom: -12 }}
          />
        </div>
      </Button>
      <Menu
        className="menu"
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: matches ? { sx: menuStyle  } : { sx: mobileMenuStyle  },
          list: {
            "aria-labelledby": "basic-button",
          },
        }}
      >
        <MenuItem sx={matches ? menuItemStyle : mobileMenuItemStyle}>Notification</MenuItem>
      </Menu>
    </div>
  );
}