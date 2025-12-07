import LoginHeader from "~/components/header/loginHeader";
import type { Route } from "./+types/signup";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import "../styles/login.css";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { useEffect, useState } from "react";
import TemporaryNotification from "~/components/temporaryNotification";
import { LocationMenu } from "~/components/dropdown menus/location-dropdown";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import handleLogIn from "~/utils/loginFunction";
import { auth } from "../../firebase";
import { toastStyle } from "~/styles/component-styles";
import showIcon from "/assets/icons/show.svg";
import hideIcon from "/assets/icons/hide.svg";

export function meta({}: Route.MetaArgs) {
  return [{ title: "login" }, { name: "description", content: "Sign-up page" }];
}

export default function SignUp() {
  // controls state of the password input field
  const [show, setShow] = useState(false);
  const maxCharacters = 50;

  // keep track of temporary notification state and message
  const [showTempNotif, setShowTempNotif] = useState(false);
  const [tempNotifMsg, setTempNotifMsg] = useState("");
  const [requestSuccessful, setRequestSuccessful] = useState(false);

  // email structure must be of the format: myname@example.com
  const [email, setEmail] = useState("");
  // max 50 characters, no special characters
  const [username, setUsername] = useState("");
  // 50 char limit, cannot be empty
  const [displayName, setDisplayName] = useState("");
  // needs at least one letter, any characters allowed
  const [password, setPassword] = useState("");

  // keeps track of error and error messages
  const [emailErrorMsg, setEmailErrorMsg] = useState("");
  const [hasEmailError, setHasEmailError] = useState(false);
  const [usernameErrorMsg, setUsernameErrorMsg] = useState("");
  const [hasUsernameError, setHasUsernameError] = useState(false);
  const [displayNameErrorMsg, setDisplayNameErrorMsg] = useState("");
  const [hasDisplayNameError, setHasDisplayNameError] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");
  const [hasPasswordError, setHasPasswordError] = useState(false);
  const navigate = useNavigate();

  // keep track of any errors on the entire page
  const [hasFormErrors, setHasFormErrors] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // track selected province / city names from LocationMenu
  const [provinceName, setProvinceName] = useState<string | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState("");
  const [hasProvinceError, setHasProvinceError] = useState(false);
  const [cityName, setCityName] = useState<string | null>(null);
  const [cityErrorMsg, setCityErrorMsg] = useState("");
  const [hasCityError, setHasCityError] = useState(false);

  // used to validate input
  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const space = " ";
  const allowedChars = [
    "-",
    "_",
    ".",
    ..."abcdefghijklmnopqrstuvwxyz",
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."0123456789",
  ];

  // set error messages for each field
  useEffect(() => {
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

    if (username === "") {
      setUsernameErrorMsg("Username cannot be empty.");
      setHasUsernameError(true);
    } else if (![...username].every((chr) => allowedChars.includes(chr))) {
      // not true that (every character in username is an allowed character)
      setUsernameErrorMsg("Username must consist of a-Z, 0-9, '.', '-', '_'");
      setHasUsernameError(true);
    } else {
      setUsernameErrorMsg("");
      setHasUsernameError(false);
    }

    if (displayName === "") {
      setDisplayNameErrorMsg("Display name cannot be empty.");
      setHasDisplayNameError(true);
    } else {
      setDisplayNameErrorMsg("");
      setHasDisplayNameError(false);
    }

    if (password === "") {
      setPasswordErrorMsg("Password cannot be empty.");
      setHasPasswordError(true);
    } else if (numbers.every((num) => !password.includes(num))) {
      // for every number from 0-9, it does not exist in the password
      setPasswordErrorMsg("Password must include at least one number.");
      setHasPasswordError(true);
    } else if (password.includes(space)) {
      setPasswordErrorMsg("Password cannot have a space.");
      setHasPasswordError(true);
    } else if (password.length < 8) {
      setPasswordErrorMsg("Password must have at least 8 characters.");
      setHasPasswordError(true);
    } else {
      setPasswordErrorMsg("");
      setHasPasswordError(false);
    }

    if (provinceName === null || cityName === null) {
      setLocationErrorMsg("User must select a city and province");
      setHasProvinceError(true);
      setHasCityError(true);
    } else {
      setLocationErrorMsg("");
      setHasProvinceError(false);
      setHasCityError(false);
    }
  }, [email, username, password, displayName, provinceName, cityName]);

  // disable signup button if any error exists
  useEffect(() => {
    if (
      hasEmailError ||
      hasUsernameError ||
      hasPasswordError ||
      hasDisplayNameError ||
      hasProvinceError ||
      hasCityError
    ) {
      setHasFormErrors(true);
    } else {
      setHasFormErrors(false);
    }
  }, [
    hasEmailError,
    hasUsernameError,
    hasPasswordError,
    hasDisplayNameError,
    hasProvinceError,
    hasCityError,
  ]);

  // functions to update inputs being saved
  function onEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.currentTarget.value);
  }

  function onUsernameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUsername(event.currentTarget.value);
  }

  function onDisplayNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDisplayName(event.currentTarget.value);
  }

  function onPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  // used to validate structure of the email input
  function validateEmailStructure(email: string) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function handleSignUp(): Promise<void> {
    setShowErrors(true);

    if (hasFormErrors) {
      return;
    }

    // create new account with the validated info
    const newAccount = {
      userName: username,
      email: email,
      password: password,
      displayName: displayName,
      provinceName: provinceName,
      cityName: cityName,
    };

    console.log(`Account info:\n${JSON.stringify(newAccount)}`);

    try {
      const response = await fetch("http://127.0.0.1:8000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: newAccount.userName,
          email: newAccount.email,
          password: newAccount.password,
          displayName: newAccount.displayName,
          provinceName: newAccount.provinceName,
          cityName: newAccount.cityName,
        }),
      });

      toast.promise(
        Promise.resolve(response),
        {
          loading: "Signing up...",
          success: "Signup successful!",
          error: (err: Error) => `User signup failed: ${err.message}`,
        },
        {
          style: toastStyle,
          duration: 3000,
        }
      );
    } catch (error) {
      console.error("Error:", error);
    }

    await sleep(500);

    await handleLogIn(auth, newAccount.email, newAccount.password);
    navigate("/");
  }

  function handleLocationChange(loc: any) {
    setProvinceName(loc.stateName ?? null);
    setCityName(loc.cityName ?? null);
  }

  return (
    <>
      <LoginHeader />
      <main
        style={{
          backgroundColor: "var{--bg-color}",
          paddingTop: "60px",
          paddingBottom: "60px",
        }}
      >
        <div className="loginBox">
          <Card
            className="card"
            sx={{ maxWidth: 785, border: "1px solid rgba(255, 132, 164, 1)" }}
          >
            <h1>Sign-up</h1>
            <CardContent className="inputs">
              <p className="signupInput">Enter an email address</p>
              <TextField
                className="input"
                variant="standard"
                type="email"
                placeholder="example@email.com"
                onChange={onEmailChange}
                sx={{ border: "1px solid rgba(120, 114, 111, 1)" }}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    style: { color: "#675844" },
                  },
                }}
              />
              <p
                className="signupInput"
                style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}
              >
                {showErrors ? emailErrorMsg : ""}
              </p>
              <br></br>
              <p className="signupInput">
                Pick a Username{" "}
                <span className="helpText">(Max 50 Characters)</span>
              </p>
              <TextField
                className="input"
                variant="standard"
                placeholder="example123"
                onChange={onUsernameChange}
                sx={{ border: "1px solid rgba(120, 114, 111, 1)" }}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    style: { color: "#675844" },
                  },
                  htmlInput: { maxLength: maxCharacters },
                }}
              />
              <p
                className="signupInput"
                style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}
              >
                {showErrors ? usernameErrorMsg : ""}
              </p>
              <br></br>
              <p className="signupInput">
                What is your name?{" "}
                <span className="helpText">(Max 50 Characters)</span>
              </p>
              <TextField
                className="input"
                variant="standard"
                placeholder="Your Name"
                onChange={onDisplayNameChange}
                sx={{ border: "1px solid rgba(120, 114, 111, 1)" }}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    style: { color: "#675844" },
                  },
                  htmlInput: { maxLength: maxCharacters },
                }}
              />
              <p
                className="signupInput"
                style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}
              >
                {showErrors ? displayNameErrorMsg : ""}
              </p>
              <br></br>
              <p className="signupInput">
                Pick password{" "}
                <span className="helpText">(Include at least 1 number)</span>
              </p>
              <TextField
                className="input"
                variant="standard"
                onChange={onPasswordChange}
                type={show ? "text" : "password"}
                sx={{ border: "1px solid rgba(120, 114, 111, 1)" }}
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
                className="signupInput"
                style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}
              >
                {showErrors ? passwordErrorMsg : ""}
              </p>
              <br></br>
              <LocationMenu onLocationChange={handleLocationChange} />
              <p
                className="signupInput"
                style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}
              >
                {showErrors ? locationErrorMsg : ""}
              </p>
            </CardContent>
            <CardActions className="buttons">
              <Button
                size="medium"
                variant="contained"
                className="enterButton"
                onClick={handleSignUp}
                sx={{ border: "1px solid rgba(147, 191, 191, 1)" }}
              >
                Sign-up!
              </Button>
            </CardActions>
          </Card>
        </div>
        <p className="redirectLink">
          Already have an account?{" "}
          <Link className="link" href="login">
            Log-in here
          </Link>
        </p>
        <p className="redirectLink">
          <Link className="link" href="/">
            <b>View as Guest</b>
          </Link>
        </p>
        <TemporaryNotification
          visible={showTempNotif}
          onAction={setShowTempNotif}
          message={tempNotifMsg}
          successful={requestSuccessful}
        />
      </main>
    </>
  );
}
