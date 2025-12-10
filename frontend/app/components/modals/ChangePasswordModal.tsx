import { useState, useEffect } from "react";
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
  inputFieldStyle,
} from "./modal.styles.js";
import { toastStyle } from "~/styles/component-styles";

export default function ChangePasswordModal() {
  const matches = useMediaQuery("(min-width: 600px)");
  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState(null);

  // controls state of the password input fields
  const [show, setShow] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showReEnterPass, setShowReEnterPass] = useState(false);

  // needs at least one letter, any characters allowed
  const [newPassword, setNewPassword] = useState("");
  const [newPassReEnter, setNewPassReEnter] = useState("");
  const [password, setPassword] = useState("");

  // keeps track of error and error messages
  const [hasNewPasswordError, setHasNewPasswordError] = useState(true);
  const [hasNewPassReEnterError, setHasNewPassReEnterError] = useState(true);
  const [hasPasswordError, setHasPasswordError] = useState(false);

  // keep track of any errors on the entire page
  const [hasFormErrors, setHasFormErrors] = useState(true);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setHasFormErrors(true);
    setHasNewPasswordError(true);
    setNewPassword("");
    setHasNewPassReEnterError(true);
    setNewPassReEnter("");
    setHasPasswordError(false);
    setPassword("");
    setError(null);
    setMessage("");
    setShow(false);
    setShowNewPass(false);
    setShowReEnterPass(false);
    setOpen(false);
  };

  // This function would send off the user's request to change password
  const handleSubmit = async () => {
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

      if (!updatePassResponse.ok) {
        const parsed = await updatePassResponse.json();
        const message = (parsed as any).detail[0].msg;
        console.log(message);
        throw new Error(message);
      }

      // automatically log user in again to get new session cookie with the new password if update was successful
      // this prevents getting user logged out after the chnage
      handleLogIn(auth, user.email, newPassword);
      // show the temp notificaiton if successful
      toast.promise(
        Promise.resolve(updatePassResponse),
        {
          loading: "Updating password...",
          success: "Password update successful!",
          error: (err: Error) => `Password update failed: ${err.message}`,
        },
        {
          style: toastStyle,
          duration: 3000,
        }
      );
      // reset everything in modal
      setHasFormErrors(false);
      setHasNewPasswordError(true);
      setNewPassword("");
      setHasNewPassReEnterError(true);
      setNewPassReEnter("");
      setHasPasswordError(false);
      setPassword("");
      // reset show password toggle
      setShow(false);
      setShowNewPass(false);
      setShowReEnterPass(false);
      setOpen(false);
    } catch (error) {
      setError(error);
      setMessage(`${error.message}`);
    }
  };

  // set error messages for the new password fields
  useEffect(() => {
    if (newPassword === "") {
      setHasNewPasswordError(true);
    } else {
      setHasNewPasswordError(false);
    }

    if (newPassReEnter === "") {
      setHasNewPassReEnterError(true);
    } else if (newPassReEnter !== newPassword) {
      setHasNewPassReEnterError(true);
    } else {
      setHasNewPassReEnterError(false);
    }

    // if current password field is empty, reset errors
    if (password === "") {
      setHasPasswordError(true);
    } else if (password) {
      setHasPasswordError(false);
    }
  }, [newPassword, newPassReEnter, password]);

  // disable submit button if any error exists
  useEffect(() => {
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
        <Box sx={matches ? modalStyle : modalStyleMobile}>
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
            <IconButton sx={closeButtonStyle} onClick={handleClose}>
              <img style={{ scale: "50%" }} src={closeIcon} />
            </IconButton>
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
                required
                label="Required"
                sx={inputFieldStyle}
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
                required
                label="Required"
                sx={inputFieldStyle}
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
                required
                label="Required"
                sx={inputFieldStyle}
                onChange={onReEnteredPassChange}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    style: { color: "#675844" },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowReEnterPass(!showReEnterPass)}
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
            {/* Display error message */}
            {error && (
              <p style={{ color: "red", fontSize: "1.5em" }}>{message}</p>
            )}{" "}
          </form>
        </Box>
      </Modal>
    </div>
  );
}
