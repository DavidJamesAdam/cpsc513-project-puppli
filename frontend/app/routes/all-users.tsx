import Header from "~/components/header/header";
import type { Route } from "./+types/all-users";
import { useLoaderData, redirect, useNavigate } from "react-router";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Button from "@mui/material/Button";
import { useEffect, useState } from "react";
import ConfirmDeletionModal from "~/components/modals/ConfirmModal";
import toast from "react-hot-toast";
import { authCheck } from "~/utils/authCheck";
import useMediaQuery from "@mui/material/useMediaQuery";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import { toastStyle } from "~/styles/component-styles";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "All Users" },
    { name: "List of all users", content: "Only accessible by admin" },
  ];
}

export async function loader(_: Route.LoaderArgs) {
  // fetch all users (could be optimized server-side)
  const resp = await fetch("http://localhost:8000/user", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!resp.ok) {
    throw new Response("Failed to fetch users", { status: resp.status });
  }

  const users = await resp.json();

  return users;
}

export default function AllUsers() {
  const users = useLoaderData() as Array<Record<string, any>> | undefined;
  // Keep a local, mutable copy so we can remove a deleted user from the UI immediately
  const [localUsers, setLocalUsers] = useState<Array<Record<string, any>>>(
    users ?? []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | undefined>(undefined);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const matches = useMediaQuery("(min-width: 600px)");

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await authCheck();

        // fetch current user profile
        const resp = await fetch("http://localhost:8000/user/me", {
          credentials: "include",
        });

        const user = await resp.json();

        // check role
        if (user.role !== "admin") {
          // not authorized -> go to profile
          navigate("/profile", { replace: true });
          return;
        }
        setAuthorized(true);
      } catch (e) {
        // window.location.href = "/login";
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate]);

  if (authorized === null) {
    return null;
  }

  async function deleteUser(uid: string | undefined) {
    if (!uid) {
      console.error("No uid provided for delete");
      return;
    }

    try {
      const resp = await fetch(`http://localhost:8000/user/${uid}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("Failed to delete user:", err);
        return;
      }
      toast.promise(
        Promise.resolve(resp),
        {
          loading: "Deleting...",
          success: "User Deleted",
          error: (err: Error) => `User deletion failed: ${err.message}`,
        },
        {
          style: toastStyle,
          duration: 3000,
        }
      );

      // Remove the user from local state so UI updates immediately
      setLocalUsers((prev) => prev.filter((u) => u.id !== uid));
    } catch (e) {
      console.error("Error deleting user", e);
    }
  }

  return (
    <div>
      <Header />
      {matches ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Bio</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Delete?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localUsers && localUsers.length > 0 ? (
                localUsers.map((u) => (
                  <TableRow key={u.id ?? JSON.stringify(u)}>
                    <TableCell>
                      <strong>{u.username ?? u.displayName ?? u.id}</strong>
                    </TableCell>
                    <TableCell>
                      <strong>{u.email}</strong>
                    </TableCell>
                    <TableCell>{u.bio ? <div>{u.bio}</div> : null}</TableCell>
                    <TableCell>{u.location}</TableCell>
                    <TableCell>
                      <Button
                        style={{ backgroundColor: "red", color: "white" }}
                        onClick={() => {
                          setSelectedUid(u.id);
                          setIsModalOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <div style={{ padding: 12 }}>
          {localUsers.map((u) => (
            <Card key={u.id} sx={{ mb: 2 }}>
              <CardContent>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {u.username ?? u.displayName ?? u.id}
                    </div>
                    <div style={{ color: "#666", fontSize: 13 }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13 }}>{u.location}</div>
                  </div>
                </div>

                {u.bio ? (
                  <div style={{ marginTop: 8, color: "#444" }}>{u.bio}</div>
                ) : null}
              </CardContent>

              <CardActions>
                <Button
                  sx={{ backgroundColor: "red", color: "white" }}
                  onClick={() => {
                    setSelectedUid(u.id);
                    setIsModalOpen(true);
                  }}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDeletionModal
        open={isModalOpen}
        uid={selectedUid}
        onClose={() => setIsModalOpen(false)}
        onConfirm={async (uid) => {
          await deleteUser(uid);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
