import { useState, useEffect } from "react";
import SettingOption from "../settings/SettingOption";
import {
  TextField,
  IconButton,
  InputAdornment,
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

export default function ChangeEmailModal() {
  const matches = useMediaQuery("(min-width: 600px)");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState(null);
  const [show, setShow] = useState(false);

  // max 50 characters, no special characters
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const maxCharacters = 50;

  // keeps track of error and error messages
  const [hasEmailError, setHasEmailError] = useState(true);
  const [hasPasswordError, setHasPasswordError] = useState(true);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setShow(false);
    setOpen(false);
    setMessage("");
    setError(null);
  };

  // This function would send off the user's request to change email
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

      // proceed with the email update
      const updateEmailResponse = await fetch(
        "http://localhost:8000/api/v1/auth/user/update-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id_token: idToken,
            new_email: email,
          }),
        },
      );

      if (!updateEmailResponse.ok) {
        const parsed = await updateEmailResponse.json();
        const message = (parsed as any).detail[0];
        console.log(parsed);
        throw new Error(message);
      }
      // automatically log user in again to get new session cookie
      // with the new email if update was successful
      // this prevents getting user logged out after the chnage
      handleLogIn(auth, email, password);
      // show the temp notificaiton if successful
      toast.promise(
        Promise.resolve(updateEmailResponse),
        {
          loading: "Updating email...",
          success: "Email update successful!",
          error: (err: Error) => `Email update failed: ${err.message}`,
        },
        {
          style: toastStyle,
          duration: 3000,
        },
      );
      // close modal when done
      setOpen(false);
      // reset everything in the modal
      setHasEmailError(true);
      setHasPasswordError(false);
      // reset show password toggle
      setShow(false);
      setOpen(false);
    } catch (error) {
      setError(error);
      setMessage(`${error.message}`);
    }
  };

  // Sets errors if email or password field is empty
  useEffect(() => {
    if (email === "") {
      setHasEmailError(true);
    } else {
      setHasEmailError(false);
    }

    if (password === "") {
      setHasPasswordError(true);
    } else {
      setHasPasswordError(false);
    }
  }, [email, password]);

  // functions to update inputs being saved
  function onEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.currentTarget.value);
  }

  function onPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  return (
    <div>
      <Button onClick={handleOpen} sx={openButtonStyle}>
        <SettingOption settingName={"Change email"}></SettingOption>
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="Change Email modal"
        aria-describedby="Modal that allows user to change their email"
      >
        <Box
          sx={matches ? modalStyle : modalStyleMobile}
          style={{ height: "50%" }}
        >
          <div
            style={{
              width: "100%",
              height: "10%",
              display: "flex",
              justifyContent: "flex-end",
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            <IconButton sx={closeButtonStyle} onClick={handleClose}>
              <img style={{ height: "100%" }} src={closeIcon} />
            </IconButton>
          </div>
          <div style={{ height: "90%", width: "100%"}}>
            <form
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-evenly",
                paddingLeft: "5%",
                paddingRight: "5%",
                height: "100%",
                width: "100%"
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  margin: 0,
                  width: "100%",
                }}
              >
                <label
                  htmlFor="newEmail"
                  style={{ paddingLeft: "2%", fontSize: "calc(1vh + 1vw)" }}
                >
                  Please enter new email address:
                </label>
                <TextField
                  required
                  label="Required"
                  sx={inputFieldStyle}
                  onChange={onEmailChange}
                  slotProps={{
                    htmlInput: {
                      maxLength: maxCharacters,
                    },
                  }}
                />
                <label
                  htmlFor="confirmPass"
                  style={{ paddingLeft: "2%", paddingTop: "2%", fontSize: "calc(1vh + 1vw)" }}
                >
                  Please confirm current password:
                </label>
                <TextField
                  required
                  label="Required"
                  sx={inputFieldStyle}
                  onChange={onPasswordChange}
                  type={show ? "text" : "password"}
                  slotProps={{
                    input: {
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
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  id="submit"
                  sx={submitButtonStyle}
                  onClick={handleSubmit}
                  disabled={hasEmailError || hasPasswordError}
                >
                  Submit
                </Button>
              </div>
              {/* Display error message */}
              {error && (
                <p style={{ color: "red", fontSize: "1.5em" }}>{message}</p>
              )}{" "}
            </form>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
