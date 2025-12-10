export const modalStyle = {
  borderRadius: "40px",
  border: "1px solid rgba(255, 132, 164, 1)",
  height: "auto",
  width: "50%",
  boxShadow: "5px 10px 10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: "rgba(224, 205, 178, 1)",
  position: "absolute",
  transform: "translate(50%, 20%)",
};

export const modalStyleMobile = {
  borderRadius: "40px",
  border: "1px solid rgba(255, 132, 164, 1)",
  height: "auto",
  width: "100%",
  boxShadow: "5px 10px 10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: "rgba(224, 205, 178, 1)",
  fontSize: "1em",
  position: "absolute",
  transform: "translate(0%, 10%)",
};

export const openButtonStyle = {
  fontFamily: "inherit",
  fontSize: "inherit",
  height: "inherit",
  textTransform: "capitalize",
  color: "inherit",
  gap: "0.75rem",
  padding: 0,
};

export const closeButtonStyle = {
  borderRadius: "100px",
  height: "5vh",
};

export const buttonStyle = {
  borderRadius: "100px",
  border: "1px solid rgba(255, 132, 164, 1)",
  backgroundColor: "#ffc2cf",
  color: "inherit",
  font: "inherit",
  display: "flex",
};

export const submitButtonStyle = {
  borderRadius: "100px",
  border: "1px solid rgba(147, 191, 191, 1)",
  backgroundColor: "rgba(179, 232, 232, 1)",
  color: "inherit",
  font: "inherit",
  margin: "10px",
  width: "inherit",
  height: "inherit",
};

export const inputSectionStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  width: "100%",
  maxWidth: "522px",
  justifySelf: "left",
};

export const inputFieldStyle = {
  marginTop: 2,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--bg-color)",
    borderRadius: "100px",
    padding: "10px",
    maxHeight: "59px",
    borderBottom: "none",
    border: "1px solid rgba(255, 132, 164, 1)",
    color: "inherit",
    "&.Mui-focused fieldset": {
      borderColor: "rgba(255, 132, 164, 1)",
    },
  },
};

export const deleteButtonStyle = {
  borderRadius: "100px",
  border: "1px solid rgba(255, 132, 164, 1)",
  backgroundColor: "#ffc2cf",
  color: "#c10058",
  font: "inherit",
  display: "flex",
  justifyContent: "flex-end",
  margin: "10px",
};

export const container = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  paddingBottom: "5%",
  height: "80%",
  width: "80%",
};

export const mobileContainer = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  paddingBottom: "5%",
  height: "80%",
  width: "80%",
}
