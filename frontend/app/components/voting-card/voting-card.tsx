import Button from "@mui/material/Button";
import * as React from "react";
import CommentModal from "../modals/comment-modal/comment-modal";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import { useState, useEffect, useRef } from "react";
import "./styles.css";
import disabledVoteIcon from "./icons/disabled_vote.svg";
import disabledLikeIcon from "./icons/disabled_like.svg";

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

type VotingCardProps = {
  animateKey?: number;
  onVote?: () => void;
  authorized: boolean;
  post?: Post;
};

export default function VotingCard({
  animateKey,
  onVote,
  authorized,
  post,
}: VotingCardProps) {
  const [isFadedOut, setIsFadedOut] = useState(false);
  const [isPopped, setIsPopped] = useState(false);
  const [plusOnes, setPlusOnes] = useState<number[]>([]);
  const [voteCount, setVoteCount] = useState(post?.voteCount || 0);
  const [favouriteCount, setFavouriteCount] = useState(
    post?.favouriteCount || 0
  );
  const [currentPost, setCurrentPost] = useState(post);
  const matches = useMediaQuery("(min-width: 600px)");
  const firstRunRef = useRef(true);
  const [imgFitMode, setImgFitMode] = useState<
    "fit-width" | "fit-height" | "contain"
  >("contain");
  const [likedPost, setLikedPost] = useState(false);

  // helper to set mode on image load
  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const naturalW = img.naturalWidth || 1;
    const naturalH = img.naturalHeight || 1;
    const imageAspect = naturalW / naturalH;

    // compute container aspect: you may use a fixed ratio you set in CSS,
    // or compute from clientWidth/clientHeight of the container:
    const container = img.parentElement as HTMLElement | null;
    let containerAspect = 1;
    if (container) {
      const rect = container.getBoundingClientRect();
      containerAspect = rect.width / Math.max(rect.height, 1);
    }

    // choose fit mode
    if (imageAspect > containerAspect) {
      // image is wider than container -> fit by width so width fills and height shrinks
      setImgFitMode("fit-width");
    } else if (imageAspect < containerAspect) {
      // image is taller -> fit by height
      setImgFitMode("fit-height");
    } else {
      setImgFitMode("contain");
    }
  }

  // keep vote count and post data in sync with incoming post prop
  useEffect(() => {
    setVoteCount(post?.voteCount || 0);
    setFavouriteCount(post?.favouriteCount || 0);
    setCurrentPost(post);
  }, [post]);

  // Function to refresh post data after comment is added
  const refreshPostData = async () => {
    if (!post?.id) return;

    try {
      const response = await fetch(`http://localhost:8000/posts/${post.id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setCurrentPost(updatedPost);
      }
    } catch (error) {
      console.error("Error refreshing post:", error);
    }
  };
  const handleCommentButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    // Open comment model to leave comment on picture
  };

  const handleFavoriteButtonClick = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    // Toggle favorite for the post
    if (!post) return;

    try {
      const response = await fetch(
        `http://localhost:8000/posts/favourite/${post.id}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      console.log("Frontend test")
      console.log(response)
      if (response.ok) {
        const result = await response.json();
        const favourited = result.favourited;

        // Fetch the updated post data directly by ID
        const postResponse = await fetch(`http://localhost:8000/posts/${post.id}`, {
          method: "GET",
          credentials: "include",
        });

        if (postResponse.ok) {
          const updatedPost = await postResponse.json();
          // Update with the latest count from the database
          setFavouriteCount(updatedPost.favouriteCount);
          setCurrentPost(updatedPost);
        } else {
          console.error("Error fetching post:", postResponse.status);
        }

        // Update liked state and show +1 when favourited
        setLikedPost(Boolean(favourited));
        if (favourited) {
          const id = Date.now();
          setPlusOnes((prev) => [...prev, id]);

          // remove it after the animation duration (match CSS 800ms)
          window.setTimeout(() => {
            setPlusOnes((prev) => prev.filter((x) => x !== id));
          }, 2000); // small buffer > animation duration
        }
      } else {
        console.error("Error favouriting post:", response.status);
      }
    } catch (error) {
      console.error("Failed to favourite post:", error);
    }
  };

  useEffect(() => {
    if (animateKey === undefined) return;
    // avoid running on first mount if you don't want it
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }

    // fade out then pop in (timings should match your CSS)
    setIsFadedOut(true);
    const fadeTimer = window.setTimeout(() => {
      setIsFadedOut(false);
      setIsPopped(true);
      const popTimer = window.setTimeout(() => setIsPopped(false), 300);
      // cleanup pop timer if necessary
      return () => clearTimeout(popTimer);
    }, 320);

    return () => {
      clearTimeout(fadeTimer);
    };
  }, [animateKey]);

  const handleVoteButtonClick = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    // Vote for specific picture
    if (!post) return;

    try {
      const response = await fetch(
        `http://localhost:8000/posts/vote/${post.id}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        setVoteCount((prev) => prev + 1);
        if (onVote) onVote();
      } else {
        console.error("Error voting on post:", response.status);
      }
    } catch (error) {
      console.error("Failed to vote on post:", error);
    }
  };
  return (
    <>
      {matches ? (
        <div
          className={`fade-target ${isFadedOut ? "fade-out" : ""} ${isPopped ? "pop-in" : ""}`}
          style={{
            border: "1px solid rgba(255, 132, 164, 1)",
            width: "30%",
            height: "80%",
            borderRadius: "40px",
            backgroundColor: "rgba(224, 205, 178, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          <div className="image-container">
            {post?.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.caption}
                onLoad={handleImgLoad}
                className={imgFitMode}
              />
            ) : (
              <img
                src={"assets/icons/ant-design--picture-outlined.svg"}
                className="fallback-image"
              />
            )}
          </div>
          <div
            className="voting-card-options"
            style={{
              display: "flex",
              flexDirection: "row",
              width: "80%",
              height: "20%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <CommentModal
              authorized={authorized}
              imageUrl={currentPost?.imageUrl}
              caption={currentPost?.caption}
              postId={currentPost?.id}
              comments={currentPost?.comments || []}
              onCommentAdded={refreshPostData}
              onOpen={refreshPostData}
            />
            <div style={{ position: "relative", display: "inline-block" }}>
              {authorized ? (
                <Button
                  id="favorite-button"
                  onClick={handleFavoriteButtonClick}
                  sx={{
                    gap: "0.5rem",
                    color: "inherit",
                    fontFamily: "inherit",
                  }}
                >
                  <img
                    src={
                      likedPost
                        ? "assets/icons/Liked post.svg"
                        : "assets/icons/heart icon.svg"
                    }
                    alt={likedPost ? "Liked" : "Like"}
                  />
                  {favouriteCount > 0 && (
                    <Typography variant="caption">{favouriteCount}</Typography>
                  )}
                </Button>
              ) : (
                <Button id="favorite-button">
                  <img src={disabledLikeIcon} />
                </Button>
              )}
              {plusOnes.map((id) => (
                <span key={id} className="plus-one">
                  +1
                </span>
              ))}
            </div>
            {authorized ? (
              <Button
                id="vote-button"
                onClick={handleVoteButtonClick}
                sx={{ gap: "0.5rem", color: "inherit", fontFamily: "inherit" }}
              >
                <img src="assets\icons\vote icon.svg" />
                <Typography variant="caption">{voteCount}</Typography>
              </Button>
            ) : (
              <Button id="vote-button">
                <img src={disabledVoteIcon} />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`fade-target ${isFadedOut ? "fade-out" : ""} ${isPopped ? "pop-in" : ""}`}
          style={{
            border: "1px solid rgba(255, 132, 164, 1)",
            width: "100%",
            height: "100%",
            borderRadius: "40px",
            backgroundColor: "rgba(224, 205, 178, 1)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          <div className="image-container">
            {post?.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.caption}
                onLoad={handleImgLoad}
                className={imgFitMode}
              />
            ) : (
              <img
                src={"assets/icons/ant-design--picture-outlined.svg"}
                className="fallback-image"
              />
            )}
          </div>
          <div
            id="menuOptions"
            style={{
              display: "flex",
              flexDirection: "column",
              width: "20%",
              height: "400px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <CommentModal
              authorized={authorized}
              imageUrl={currentPost?.imageUrl}
              caption={currentPost?.caption}
              postId={currentPost?.id}
              comments={currentPost?.comments || []}
              onCommentAdded={refreshPostData}
              onOpen={refreshPostData}
            />
            {authorized ? (
              <Button
                id="favorite-button"
                onClick={handleFavoriteButtonClick}
                sx={{
                  gap: "0.5rem",
                  color: "inherit",
                  fontFamily: "inherit",
                  direction: "flex",
                  flexDirection: "column",
                }}
              >
                <img
                  src={
                    likedPost
                      ? "assets\\icons\\Liked post.svg"
                      : "assets\\icons\\heart icon.svg"
                  }
                  alt={likedPost ? "Liked" : "Like"}
                />
                {favouriteCount > 0 && (
                  <Typography variant="caption">{favouriteCount}</Typography>
                )}
              </Button>
            ) : (
              <Button id="favorite-button">
                <img src={disabledLikeIcon} />
              </Button>
            )}
            {authorized ? (
              <Button
                id="vote-button"
                onClick={handleVoteButtonClick}
                sx={{
                  gap: "0.5rem",
                  color: "inherit",
                  fontFamily: "inherit",
                  direction: "flex",
                  flexDirection: "column",
                }}
              >
                <img src="assets\icons\vote icon.svg" />
                {voteCount > 0 && (
                  <Typography variant="caption">{voteCount}</Typography>
                )}
              </Button>
            ) : (
              <Button id="vote-button">
                <img src={disabledVoteIcon} />
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
