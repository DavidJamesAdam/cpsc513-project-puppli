import {
  MainNavMenu,
} from "../dropdown menus/NavMenu";
import NotificationMenu from "../dropdown menus/NotificationMenu";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function Header() {
  const matches = useMediaQuery("(min-width: 600px)");

  return (
    <div
      style={{
        width: "100%",
        height: "10%",
        paddingLeft: matches ? 30 : 10,
        paddingRight: matches ? 30 : 10,
        paddingTop: 15,
        paddingBottom: 15,
        backgroundColor: "#FFC2CF",
        outline: "1px #FF84A4 solid",
        justifyContent: "space-between",
        alignItems: "center",
        display: "inline-flex",
        boxSizing: "border-box",
      }}
    >
      {/* Logo */}
      <div style={{ flex: "0 0 auto" }}>
        <MainNavMenu />
      </div>

      {/* App name */}
      <div style={{ flex: "1 1 auto", textAlign: "center", overflow: "hidden" }}>
        <h1 style={{
          fontSize: matches ? "54px" : "clamp(24px, 8vw, 40px)",
          color: "var(--font-color)",
          margin: 0,
          whiteSpace: "nowrap",
        }}>
          Puppli
        </h1>
      </div>

      {/* Notification Bell */}
      <div style={{ flex: "0 0 auto" }}>
        <NotificationMenu />
      </div>
    </div>
  );
}
