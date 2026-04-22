import { signInWithEmailAndPassword } from "firebase/auth";
import toast from "react-hot-toast";
import { toastStyle } from "~/styles/component-styles";

export default async function handleLogIn(
  auth: any,
  email: any,
  password: any,
  navigate?: (to: string) => void
) {
  let userCredential;
  // 1) Sign in with Firebase client SDK
  try {
    userCredential = await signInWithEmailAndPassword(auth!, email, password);
  } catch (e) {
    toast.error("Invalid username or password.", {
      style: toastStyle,
    });
  }
  // 2) Get fresh ID token
  const idToken = await userCredential!.user.getIdToken(
    /* forceRefresh */ true
  );

  console.log(`Id token: ${idToken}`);

  try {
    // 3) Send idToken to backend to exchange for session cookie
    const resp = await fetch("http://localhost:8000/auth/sessionLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // VERY IMPORTANT: accept cookie
      body: JSON.stringify({ idToken }),
    });

    toast.success("Login successful!", {
      style: toastStyle,
      duration: 3000,
    });
  } catch (e) {
    console.log(e);
  }

  // redirect to home (voting) page if a navigate function was provided
  if (typeof navigate === "function") {
    navigate("/");
  }
}
