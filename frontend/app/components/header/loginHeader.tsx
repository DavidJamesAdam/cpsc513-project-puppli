import logo from "~/assets/icons/logo.svg"

export default function LoginHeader() {
  return (
    <div
      style={{
        width: "100%",
        height: "10%",
        paddingLeft: 30,
        paddingRight: 30,
        paddingTop: 15,
        paddingBottom: 15,
        backgroundColor: "#FFC2CF",
        outline: "1px #FF84A4 solid",
        alignItems: "center",
        display: "inline-flex",
      }}
    >
      {/* Logo */}
      <div>
        <img src={logo} />
      </div>

      {/* App name */}
      <div>
        <h1 style={{ fontSize: "54px", color: "var(--font-color)", paddingLeft: "30px"}}>Puppli</h1>
      </div>
    </div>
  );
}
