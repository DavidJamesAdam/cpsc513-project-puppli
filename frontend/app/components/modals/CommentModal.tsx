import { useState } from "react";
import {
  useMediaQuery,
  Typography,
  Box,
  Modal,
  Button,
  IconButton,
} from "@mui/material";
import disabledCommentIcon from "~/assets/icons/disabled_comment.svg";
import messageIcon from "~/assets/icons/message_icon.svg";
import closeIcon from "~/assets/icons/close_icon.svg";
import fallbackImage from "~/assets/icons/ant-design--picture-outlined.svg";
import {
  modalStyle,
  modalStyleMobile,
  openButtonStyle,
  closeButtonStyle,
  buttonStyle,
} from "./modal.styles.js";
import toast from "react-hot-toast";
import { toastStyle } from "~/styles/component-styles";

interface Comment {
  text: string;
  createdAt: string;
}

interface CommentModalProps {
  authorized: boolean;
  imageUrl?: string;
  caption?: string;
  postId?: string;
  comments?: Comment[];
  onCommentAdded?: () => void;
  onOpen?: () => void;
}

export default function CommentModal({
  authorized,
  imageUrl,
  caption,
  postId,
  comments = [],
  onCommentAdded,
  onOpen,
}: CommentModalProps) {
  const [open, setOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const matches = useMediaQuery("(min-width: 600px)");

  const MAX_CHARS = 56;
  const remainingChars = MAX_CHARS - commentText.length;

  // Sort comments newest first
  const sortedComments = [...comments].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setCommentText("");
    setError("");
    setOpen(false);
  };

  const submitComment = async () => {
    if (!postId) {
      setError("Post ID is missing");
      return;
    }

    if (!commentText.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (commentText.length > MAX_CHARS) {
      setError(`Comment must be ${MAX_CHARS} characters or less`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/posts/${postId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ text: commentText }),
        },
      );

    toast.success("Comment successfully posted!", {
      style: toastStyle,
      duration: 1500,
    });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      // Reset form
      setCommentText("");

      // Trigger parent component to refresh post data
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      setError("Failed to add comment. Please try again.");
      console.error("Error adding comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {authorized ? (
        <Button onClick={handleOpen} sx={openButtonStyle}>
          <div>
            <img src={messageIcon} />
          </div>
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            {comments.length}
          </Typography>
        </Button>
      ) : (
        <Button sx={openButtonStyle}>
          <img src={disabledCommentIcon} />
        </Button>
      )}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="Comment modal"
        aria-describedby="Modal that allows user comment on a picture"
      >
        <Box sx={matches ? modalStyle : modalStyleMobile}>
          {/* header */}
          <div
            style={{
              width: "100%",
              height: "10%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "#675844", fontFamily: "Itim" }}
            >
              Comments ({comments.length})
            </Typography>
            <IconButton sx={closeButtonStyle} onClick={handleClose}>
              <img style={{ height: "100%" }} src={closeIcon} />
            </IconButton>
          </div>

          {/* image */}
          <div
            style={{
              width: "100%",
              maxHeight: "55%",
              display: "flex",
              justifyContent: "center",
              paddingBottom: "5px",
            }}
          >
            <img
              src={imageUrl || fallbackImage}
              alt={caption || "Post image"}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "40px",
                border: "1px solid rgba(255, 132, 164, 1)",
              }}
            />
          </div>

          <div
            style={{
              height: "30%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            {/* Comments List */}
            <div
              style={{
                paddingRight: "10px",
                paddingLeft: "10px",
                overflowY: "auto",
                height: "55%",
              }}
            >
              {sortedComments.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: "#675844",
                    textAlign: "center",
                    fontFamily: "Itim",
                  }}
                >
                  No comments yet. Be the first to comment!
                </Typography>
              ) : (
                sortedComments.map((comment, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "10px",
                      marginBottom: "8px",
                      backgroundColor: index % 2 === 0 ? "#FFECF0" : "#FFC2CF",
                      border: index % 2 === 0 ? "1px solid rgba(255, 132, 164, 1)" : "1px solid rgba(147, 191, 191, 1)",
                      borderRadius: "10px",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ color: "#675844", fontFamily: "Itim" }}
                    >
                      {comment.text}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#8F7A60", fontSize: "10px" }}
                    >
                      {new Date(comment.createdAt).toLocaleString()}
                    </Typography>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Form */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                paddingRight: "10px",
                paddingLeft: "10px",
                width: "100%",
                height: "40%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "50%",
                }}
              >
                <textarea
                  placeholder="Add your comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={MAX_CHARS}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 132, 164, 1)",
                    width: "100%",
                    height: "100%",
                    padding: "9px",
                    fontFamily: "inherit",
                    fontSize: "11px",
                    resize: "none",
                    overflow: "hidden",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Button
                    sx={buttonStyle}
                    onClick={submitComment}
                    disabled={isSubmitting || !commentText.trim()}
                  >
                    {isSubmitting ? "..." : "Submit"}
                  </Button>
                </div>
              </div>
              <div>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#675844",
                    marginLeft: "12px",
                    fontSize: "12px",
                    textAlign: "left",
                    fontFamily: "Itim",
                    paddingLeft: "5px",
                    padding: 0,
                  }}
                >
                  {remainingChars} characters remaining
                </Typography>
                {error && (
                  <Typography
                    variant="body2"
                    sx={{ color: "red", fontSize: "14px" }}
                  >
                    {error}
                  </Typography>
                )}
              </div>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
