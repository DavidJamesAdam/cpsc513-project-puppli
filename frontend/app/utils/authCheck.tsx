export async function authCheck() {
  const res = await fetch("http://localhost:8000/api/v1/auth/check", {
    credentials: "include",
  });

  console.log(`Response: ${res}`);

  if (!res.ok) {
    throw new Response("Not authenticated", {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  return res.json();
}