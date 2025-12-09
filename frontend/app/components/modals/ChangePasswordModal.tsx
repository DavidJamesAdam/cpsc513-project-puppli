import * as React from "react";
import SettingOption from "../settings/SettingOption";
import {
  IconButton,
  InputAdornment,
  TextField,
  useMediaQuery,
  Box,
  Modal,
  Button,
} from "@mui/material";
import { auth } from "firebase";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import toast from "react-hot-toast";
import handleLogIn from "~/utils/loginFunction";
import closeIcon from "~/assets/icons/close_icon.svg";
import showIcon from "~/assets/icons/show.svg";
import hideIcon from "~/assets/icons/hide.svg";
import {
  modalStyle,
  modalStyleMobile,
  openButtonStyle,
  closeButtonStyle,
  submitButtonStyle,
} from "./modal.styles.js";

export default function ChangePasswordModal() {
  const matches = useMediaQuery("(min-width: 600px)");
  const [open, setOpen] = React.useState(false);
  // server error from backend (shown in UI)
  const [serverErrorMsg, setServerErrorMsg] = React.useState<string>("");
  const [showServerError, setShowServerError] = React.useState<boolean>(false);
  const handleOpen = () => setOpen(true);
  // reset all error catching on modal close
  const handleClose = () => {
    setHasFormErrors(false);
    setHasNewPasswordError(true);
    setNewPasswordErrorMsg("");
    setHasNewPassReEnterError(true);
    setNewPassReEnterErrorMsg("");
    setHasPasswordError(false);
    setPasswordErrorMsg("");
    setShowServerError(false);
    setServerErrorMsg("");
    // reset show password toggle
    setShow(false);
    setShowNewPass(false);
    setShowReEnterPass(false);
    setOpen(false);
  };

  // This function would send off the user's request to change password
  const handleSubmit = async () => {
    // keep track of update failures
    let successful = false;

    try {
      // need to use auth for reauthentication
      const user = auth!.currentUser;
      if (!user) throw new Error("No Firebase user authenticated.");

      // reauthenticate with password
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // get new ID token with the password entered
      const idToken = await user.getIdToken(true);

      // proceed with the password update
      const updatePassResponse = await fetch(
        "http://localhost:8000/user/update-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id_token: idToken,
            new_password: newPassword,
          }),
        }
      );

      // catch errors
      if (!updatePassResponse.ok) {
        // parse JSON if possible, otherwise use text
        const parsed = await updatePassResponse
          .clone()
          .json()
          .catch(async () => await updatePassResponse.clone().text());

        // build a readable message: if parsed is object try parsed.message
        const message =
          typeof parsed === "string"
            ? parsed
            : parsed?.message
              ? parsed.message
              : JSON.stringify(parsed);

        // set UI state so the modal shows the server message
        setServerErrorMsg(message);
        setShowServerError(true);
      } else {
        successful = true;
        // automatically log user in again to get new session cookie with the new password if update was successful
        // this prevents getting user logged out after the chnage
        handleLogIn(auth, user.email, newPassword);
        // reset everything in modal
        setHasFormErrors(false);
        setHasNewPasswordError(true);
        setNewPasswordErrorMsg("");
        setHasNewPassReEnterError(true);
        setNewPassReEnterErrorMsg("");
        setHasPasswordError(false);
        setPasswordErrorMsg("");
        // reset show password toggle
        setShow(false);
        setShowNewPass(false);
        setShowReEnterPass(false);
        setOpen(false);
      }

      // show the temp notificaiton if successful
      toast.promise(
        Promise.resolve(updatePassResponse),
        {
          loading: "Updating password...",
          success: "Password update successful!",
          error: (err: Error) => `Password update failed: ${err.message}`,
        },
        {
          style: {
            borderRadius: "100px",
            width: "100%",
            fontSize: "2em",
            backgroundColor: "#e0cdb2",
            border: "1px solid rgba(255, 132, 164, 1)",
          },
          duration: 3000,
        }
      );
    } catch (e) {
      console.error(e);
    }

    // if the whole operation was successful, close the modal
    if (successful) {
      // close modal when done
      setOpen(false);
    } else {
      // authentication must have gone wrong
      setHasPasswordError(true);
      setPasswordErrorMsg("Incorrect password.");
    }
  };

  // controls state of the password input fields
  const [show, setShow] = React.useState(false);
  const [showNewPass, setShowNewPass] = React.useState(false);
  const [showReEnterPass, setShowReEnterPass] = React.useState(false);

  // needs at least one letter, any characters allowed
  const [newPassword, setNewPassword] = React.useState("");
  const [newPassReEnter, setNewPassReEnter] = React.useState("");
  const [password, setPassword] = React.useState("");

  // keeps track of error and error messages
  const [newPasswordErrorMsg, setNewPasswordErrorMsg] = React.useState("");
  const [hasNewPasswordError, setHasNewPasswordError] = React.useState(true);
  const [newPassReEnterErrorMsg, setNewPassReEnterErrorMsg] =
    React.useState("");
  const [hasNewPassReEnterError, setHasNewPassReEnterError] =
    React.useState(true);
  const [passwordErrorMsg, setPasswordErrorMsg] = React.useState("");
  const [hasPasswordError, setHasPasswordError] = React.useState(false);

  // keep track of any errors on the entire page
  const [hasFormErrors, setHasFormErrors] = React.useState(false);

  // used to validate input
  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const space = " ";

  // set error messages for the new password fields
  React.useEffect(() => {
    if (newPassword === "") {
      setNewPasswordErrorMsg("New password cannot be empty.");
      setHasNewPasswordError(true);
    } else if (numbers.every((num) => !newPassword.includes(num))) {
      // for every number from 0-9, it does not exist in the password
      setNewPasswordErrorMsg("New password must include at least one number.");
      setHasNewPasswordError(true);
    } else if (newPassword.includes(space)) {
      setNewPasswordErrorMsg("New password cannot have a space.");
      setHasNewPasswordError(true);
    } else if (newPassword.length < 8) {
      setNewPasswordErrorMsg("New password must have at least 8 characters.");
      setHasNewPasswordError(true);
    } else {
      setNewPasswordErrorMsg("");
      setHasNewPasswordError(false);
    }

    if (newPassReEnter === "") {
      setNewPassReEnterErrorMsg("New password cannot be empty.");
      setHasNewPassReEnterError(true);
    } else if (newPassReEnter !== newPassword) {
      setNewPassReEnterErrorMsg("Re-entered password does not match.");
      setHasNewPassReEnterError(true);
    } else {
      setNewPassReEnterErrorMsg("");
      setHasNewPassReEnterError(false);
    }

    // if current password field is empty, reset errors
    if (password === "") {
      setPasswordErrorMsg("");
      setHasPasswordError(false);
    } else if (password) {
      setPasswordErrorMsg("");
      setHasPasswordError(false);
    }
  }, [newPassword, newPassReEnter, password]);

  // disable submit button if any error exists
  React.useEffect(() => {
    if (hasNewPassReEnterError || hasNewPasswordError) {
      setHasFormErrors(true);
    } else {
      setHasFormErrors(false);
    }
  }, [hasNewPassReEnterError, hasNewPasswordError]);

  // functions to update inputs being saved
  function onNewPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNewPassword(event.currentTarget.value);
  }

  function onReEnteredPassChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNewPassReEnter(event.currentTarget.value);
  }

  function onPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  return (
    <>
      {matches ? (
        <div>
          <Button onClick={handleOpen} sx={openButtonStyle}>
            <SettingOption settingName={"Change password"}></SettingOption>
          </Button>
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="Password Change modal"
            aria-describedby="Modal that allows user to change password"
          >
            <Box sx={modalStyle}>
              <div
                style={{
                  width: "100%",
                  height: "10%",
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "2%",
                  marginRight: "2%",
                }}
              >
                <Button sx={closeButtonStyle} onClick={handleClose}>
                  <img style={{ scale: "50%" }} src={closeIcon} />
                </Button>
              </div>
              <form
                style={{
                  height: "inherit",
                  width: "80%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-evenly",
                  margin: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    margin: 0,
                    gap: "8px",
                  }}
                >
                  <label
                    htmlFor="currentPass"
                    style={{ paddingLeft: "15px", fontSize: "calc(1vh + 1vw)" }}
                  >
                    Please enter current password:
                  </label>
                  <TextField
                    name="currentPass"
                    style={{
                      border: "1px solid rgba(255, 132, 164, 1)",
                      borderRadius: "100px",
                      backgroundColor: "white",
                      padding: "8px 12px",
                      fontSize: "1vw",
                    }}
                    variant="standard"
                    onChange={onPasswordChange}
                    type={show ? "text" : "password"}
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        style: { color: "#675844" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShow(!show)}>
                              {show ? (
                                <img src={showIcon} alt="Show" />
                              ) : (
                                <img src={hideIcon} alt="Hide" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <p
                    style={{
                      fontSize: "1.3vw",
                      color: "red",
                      paddingLeft: "5px",
                      lineHeight: "1.05",
                    }}
                  >
                    {passwordErrorMsg}
                  </p>

                  {showServerError && (
                    <p
                      role="alert"
                      style={{
                        fontSize: "1.3vw",
                        color: "red",
                        paddingLeft: "5px",
                        lineHeight: "1.05",
                      }}
                    >
                      {serverErrorMsg}
                    </p>
                  )}
                  <br></br>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    margin: 0,
                    gap: "8px",
                  }}
                >
                  <label
                    htmlFor="newPass"
                    style={{ paddingLeft: "15px", fontSize: "calc(1vh + 1vw)" }}
                  >
                    Please enter new password:
                  </label>
                  <TextField
                    name="newPass"
                    style={{
                      border: "1px solid rgba(255, 132, 164, 1)",
                      borderRadius: "100px",
                      backgroundColor: "white",
                      padding: "8px 12px",
                      fontSize: "1vw",
                    }}
                    variant="standard"
                    onChange={onNewPasswordChange}
                    type={showNewPass ? "text" : "password"}
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        style: { color: "#675844" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowNewPass(!showNewPass)}
                            >
                              {showNewPass ? (
                                <img src={showIcon} alt="Show" />
                              ) : (
                                <img src={hideIcon} alt="Hide" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <p
                    style={{
                      fontSize: "1.3vw",
                      color: "red",
                      paddingLeft: "5px",
                      lineHeight: "1.05",
                    }}
                  >
                    {newPasswordErrorMsg}
                  </p>
                  <br></br>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    margin: 0,
                    gap: "8px",
                  }}
                >
                  <label
                    htmlFor="reenterPass"
                    style={{ paddingLeft: "15px", fontSize: "calc(1vh + 1vw)" }}
                  >
                    Please re-enter new password:
                  </label>
                  <TextField
                    type={showReEnterPass ? "text" : "password"}
                    name="reenterPass"
                    style={{
                      border: "1px solid rgba(255, 132, 164, 1)",
                      borderRadius: "100px",
                      backgroundColor: "white",
                      padding: "8px 12px",
                      fontSize: "calc(.5vw + 1vh)",
                    }}
                    variant="standard"
                    onChange={onReEnteredPassChange}
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        style: { color: "#675844" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowReEnterPass(!showReEnterPass)
                              }
                            >
                              {showReEnterPass ? (
                                <img src={showIcon} alt="Show" />
                              ) : (
                                <img src={hideIcon} alt="Hide" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <p
                    style={{
                      fontSize: "1.3vw",
                      color: "red",
                      paddingLeft: "5px",
                      lineHeight: "1.05",
                    }}
                  >
                    {newPassReEnterErrorMsg}
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    id="submit"
                    sx={submitButtonStyle}
                    onClick={handleSubmit}
                    disabled={hasFormErrors}
                  >
                    <p style={{ fontSize: "calc(.5vw + 1vh)" }}>Submit</p>
                  </Button>
                </div>
              </form>
            </Box>
          </Modal>
        </div>
      ) : (
        <div>
          <Button onClick={handleOpen} sx={openButtonStyle}>
            <SettingOption settingName={"Change password"}></SettingOption>
          </Button>
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="Password Change modal"
            aria-describedby="Modal that allows user to change password"
          >
            <Box sx={modalStyleMobile}>
              <div
                style={{
                  width: "100%",
                  height: "10%",
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "2%",
                  marginRight: "2%",
                }}
              >
                <Button sx={closeButtonStyle} onClick={handleClose}>
                  <img style={{ scale: "50%" }} src={closeIcon} />
                </Button>
              </div>
              <form
                style={{
                  height: "inherit",
                  width: "80%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-evenly",
                  margin: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    margin: 0,
                    gap: "8px",
                  }}
                >
                  <label
                    htmlFor="currentPass"
                    style={{ paddingLeft: "15px", fontSize: "calc(1vh + 1vw)" }}
                  >
                    Please enter current password:
                  </label>
                  <TextField
                    name="currentPass"
                    style={{
                      border: "1px solid rgba(255, 132, 164, 1)",
                      borderRadius: "100px",
                      backgroundColor: "white",
                      padding: "8px 12px",
                      fontSize: "calc(.5vw + 1vh)",
                    }}
                    variant="standard"
                    onChange={onPasswordChange}
                    type={show ? "text" : "password"}
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        style: { color: "#675844" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShow(!show)}>
                              {show ? (
                                <img src={showIcon} alt="Show" />
                              ) : (
                                <img src={hideIcon} alt="Hide" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <p
                    style={{
                      fontSize: "2vw",
                      color: "red",
                      paddingLeft: "5px",
                      lineHeight: "1.05",
                    }}
                  >
                    {passwordErrorMsg}
                  </p>

                  {showServerError && (
                    <p
                      role="alert"
                      style={{
                        fontSize: "2vw",
                        color: "red",
                        paddingLeft: "5px",
                        lineHeight: "1.05",
                      }}
                    >
                      {serverErrorMsg}
                    </p>
                  )}
                  <br></br>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    margin: 0,
                    gap: "8px",
                  }}
                >
                  <label
                    htmlFor="newPass"
                    style={{ paddingLeft: "15px", fontSize: "calc(1vh + 1vw)" }}
                  >
                    Please enter new password:
                  </label>
                  <TextField
                    type={showNewPass ? "text" : "password"}
                    name="newPass"
                    style={{
                      border: "1px solid rgba(255, 132, 164, 1)",
                      borderRadius: "100px",
                      backgroundColor: "white",
                      padding: "8px 12px",
                      fontSize: "calc(.5vw + 1vh)",
                    }}
                    variant="standard"
                    onChange={onNewPasswordChange}
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        style: { color: "#675844" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowNewPass(!showNewPass)}
                            >
                              {showNewPass ? (
                                <img src={showIcon} alt="Show" />
                              ) : (
                                <img src={hideIcon} alt="Hide" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <p
                    style={{
                      fontSize: "2vw",
                      color: "red",
                      paddingLeft: "5px",
                      lineHeight: "1.05",
                    }}
                  >
                    {newPasswordErrorMsg}
                  </p>
                  <br></br>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    margin: 0,
                    gap: "8px",
                  }}
                >
                  <label
                    htmlFor="reenterPass"
                    style={{ paddingLeft: "15px", fontSize: "calc(1vh + 1vw)" }}
                  >
                    Please re-enter new password:
                  </label>
                  <TextField
                    type={showReEnterPass ? "text" : "password"}
                    name="reenterPass"
                    style={{
                      border: "1px solid rgba(255, 132, 164, 1)",
                      borderRadius: "100px",
                      backgroundColor: "white",
                      padding: "8px 12px",
                      fontSize: "calc(.5vw + 1vh)",
                    }}
                    variant="standard"
                    onChange={onReEnteredPassChange}
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        style: { color: "#675844" },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowReEnterPass(!showReEnterPass)
                              }
                            >
                              {showReEnterPass ? (
                                <img src={showIcon} alt="Show" />
                              ) : (
                                <img src={hideIcon} alt="Hide" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <p
                    style={{
                      fontSize: "2vw",
                      color: "red",
                      paddingLeft: "5px",
                      lineHeight: "1.05",
                    }}
                  >
                    {newPassReEnterErrorMsg}
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    id="submit"
                    sx={submitButtonStyle}
                    onClick={handleSubmit}
                    disabled={hasFormErrors}
                  >
                    <p style={{ fontSize: "calc(.5vw + 1vh)" }}>Submit</p>
                  </Button>
                </div>
              </form>
            </Box>
          </Modal>
        </div>
      )}
    </>
  );
}
