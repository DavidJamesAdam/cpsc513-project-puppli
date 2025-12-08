import { useState, useEffect } from "react";
import type { Route } from "./+types/home";
import Header from "~/components/header/header";
import VotingCard from "~/components/voting-card/VotingCard";
import useMediaQuery from "@mui/material/useMediaQuery";
import { authCheck } from "~/utils/authCheck";
import Link from "@mui/material/Link";
import LoginHeader from "~/components/header/loginHeader";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Posts" },
    { name: "description", content: "View all posts" },
  ];
}

interface Comment {
  text: string;
  createdAt: string;
}

interface Post {
  id: string;
  UserId: string;
  petId: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  voteCount: number;
  favouriteCount: number;
  comments: Comment[];
}

export default function Home() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const matches = useMediaQuery("(min-width: 600px)");
  const [animateKey, setAnimateKey] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<
    [Post | null, Post | null]
  >([null, null]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await authCheck();
        setAuthorized(true);
      } catch (e) {
        // Not authenticated — display guest version of the page
        setAuthorized(false);
      }

      try {
        const response = await fetch("http://localhost:8000/posts", {
          credentials: "include",
        });

        if (response.ok) {
          const postsData = await response.json();
          setPosts(postsData);
          setSelectedPosts(postsData.length === 2 ? postsData : [null, null]);
        } else {
          console.error("Error fetching posts:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (authorized === null) {
    // Still checking; render nothing (avoids showing protected content).
    return null;
  }

  if (loading) {
    return null;
  }

  const handleAnyVote = async () => {
    // Refresh posts from database to get updated vote counts
    try {
      const response = await fetch("http://localhost:8000/posts", {
        credentials: "include",
      });

      if (response.ok) {
        const postsData = await response.json();
        setPosts(postsData);
        setSelectedPosts(postsData.length === 2 ? postsData : [null, null]);
      }
    } catch (error) {
      console.error("Failed to refresh posts:", error);
    }

    // increment to retrigger animation in children
    setAnimateKey((k) => k + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      {authorized ? <Header /> : <LoginHeader />}
      {matches ? (
        <>
          {!authorized && (
            <h1
              style={{
                fontSize: "5vh",
                alignSelf: "center",
                paddingTop: "30px",
              }}
              className="blinking-text"
            >
              To like, comment, or vote, please{" "}
              <Link className="link" href="signup">
                Sign-up here
              </Link>
              !
            </h1>
          )}
          <main
            className="voting-page"
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              height: "100%",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            {selectedPosts[0] && selectedPosts[1] ? (
              <>
                <VotingCard
                  animateKey={animateKey}
                  onVote={handleAnyVote}
                  authorized={authorized}
                  post={selectedPosts[0]}
                />
                <h1 style={{ fontSize: "5vh" }}>VS</h1>
                <VotingCard
                  animateKey={animateKey}
                  onVote={handleAnyVote}
                  authorized={authorized}
                  post={selectedPosts[1]}
                />
              </>
            ) : (
              <h1
                style={{ fontSize: "3vh", alignSelf: "center", margin: "auto" }}
              >
                Not enough posts available. Please upload some posts to start
                voting!
              </h1>
            )}
          </main>
        </>
      ) : (
        <>
        {!authorized && (
            <h1
              style={{
                fontSize: "5vh",
                alignSelf: "center",
                padding: "30px",
              }}
              className="blinking-text"
            >
              To like, comment, or vote, please{" "}
              <Link className="link" href="signup">
                Sign-up here
              </Link>
              !
            </h1>
          )}
          <main
            className="voting-page"
            style={{
              display: "flex",
              flexDirection: "column",
              width: "auto",
              flex: 1,
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            {selectedPosts[0] && selectedPosts[1] ? (
              <>
                <VotingCard
                  animateKey={animateKey}
                  onVote={handleAnyVote}
                  authorized={authorized}
                  post={selectedPosts[0]}
                />
                <h1 style={{ fontSize: "5vh", textAlign: "center" }}>VS</h1>
                <VotingCard
                  animateKey={animateKey}
                  onVote={handleAnyVote}
                  authorized={authorized}
                  post={selectedPosts[1]}
                />
              </>
            ) : (
              <h1 style={{ fontSize: "3vh", alignSelf: "center", margin: "auto" }}>
                Not enough posts available. Please upload some posts to start voting!
              </h1>
            )}
          </main>
        </>
      )}
    </div>
  );
}
