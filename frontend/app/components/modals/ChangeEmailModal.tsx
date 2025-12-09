import * as React from "react";
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
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  // reset all error catching on modal close
  const handleClose = () => {
    setHasEmailError(true);
    setEmailErrorMsg("");
    setHasPasswordError(false);
    setPasswordErrorMsg("");
    // reset show password toggle
    setShow(false);
    setOpen(false);
  };

  // This function would send off the user's request to change email
  const handleSubmit = async () => {
    // keep track of update failures
    let successful = false;
    const user = auth!.currentUser!;

    try {
      // need to use auth for reauthentication
      if (!user) throw new Error("No Firebase user authenticated.");

      // reauthenticate with password
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

    }catch(e){
      
    }

    try{
      // get new ID token with the password entered
      const idToken = await user.getIdToken(true);

      // proceed with the email update
      const updateEmailResponse = await fetch(
        "http://localhost:8000/user/update-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id_token: idToken,
            new_email: email,
          }),
        }
      );

      // catch errors
      if (!updateEmailResponse.ok) {
        console.log("Error updating email.");
      } else {
        successful = true;
        // automatically log user in again to get new session cookie with the new email if update was successful
        // this prevents getting user logged out after the chnage
        handleLogIn(auth, email, password);
      }

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
        }
      );
    } catch (e) {
      console.error(e);
    }

    // if the whole operation was successful, close the modal
    if (successful) {
      // close modal when done
      setOpen(false);
      // reset everything in the modal
      setHasEmailError(true);
      setEmailErrorMsg("");
      setHasPasswordError(false);
      setPasswordErrorMsg("");
      // reset show password toggle
      setShow(false);
      setOpen(false);
    } else {
      // authentication must have gone wrong
      setHasPasswordError(true);
      setPasswordErrorMsg("Incorrect password.");
    }
  };

  // controls state of the password input field
  const [show, setShow] = React.useState(false);
  const maxCharacters = 50;

  // max 50 characters, no special characters
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // keeps track of error and error messages
  const [emailErrorMsg, setEmailErrorMsg] = React.useState("");
  const [hasEmailError, setHasEmailError] = React.useState(true);
  const [passwordErrorMsg, setPasswordErrorMsg] = React.useState("");
  const [hasPasswordError, setHasPasswordError] = React.useState(false);

  // set error messages for the new email field and password field
  React.useEffect(() => {
    if (email === "") {
      setEmailErrorMsg("Email cannot be empty.");
      setHasEmailError(true);
    } else if (!validateEmailStructure(email)) {
      setEmailErrorMsg("Email structure incorrect (ex. yourname@example.com).");
      setHasEmailError(true);
    } else {
      setEmailErrorMsg("");
      setHasEmailError(false);
    }

    if (password === "") {
      setPasswordErrorMsg("");
      setHasPasswordError(false);
    } else if (password) {
      setPasswordErrorMsg("");
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

  // used to validate structure of the email input
  function validateEmailStructure(email: string) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
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
              <img style={{ height: "100%" }} src={closeIcon} />
            </IconButton>
          </div>
          <form
            style={{
              height: "100%",
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
                width: "100%",
              }}
            >
              <label
                htmlFor="newEmail"
                style={{ paddingLeft: "15px", fontSize: "2vw" }}
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
                style={{ paddingLeft: "15px", fontSize: "2vw" }}
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
                disabled={hasEmailError}
              >
                Submit
              </Button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
