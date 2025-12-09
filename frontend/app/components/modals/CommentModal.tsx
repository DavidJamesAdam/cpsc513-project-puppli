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
        `http://localhost:8000/posts/${postId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ text: commentText }),
        }
      );

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
    <>
      {matches ? (
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
            <Box sx={modalStyle}>
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
              <div
                style={{
                  width: "90%",
                  height: "auto",
                  maxHeight: "55%",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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

              {/* Comments List */}
              <div
                style={{
                  width: "90%",
                  marginBottom: "15px",
                  padding: "10px",
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
                        backgroundColor:
                          index % 2 === 0 ? "#FFECF0" : "#FFC2CF",
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
                  justifyContent: "space-evenly",
                  margin: "10px",
                  width: "50%",
                }}
              >
                <div>
                  <textarea
                    placeholder="Add your comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={isSubmitting}
                    maxLength={MAX_CHARS}
                    rows={3}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "20px",
                      border: "1px solid rgba(255, 132, 164, 1)",
                      width: "100%",
                      padding: "12px",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      resize: "none",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#675844",
                      marginLeft: "12px",
                      fontSize: "12px",
                    }}
                  >
                    <p
                      style={{
                        textAlign: "center",
                        fontSize: "1.5em",
                        fontFamily: "Itim",
                        color: "inherit",
                      }}
                    >
                      {remainingChars} characters remaining
                    </p>
                  </Typography>
                </div>
                {error && (
                  <Typography
                    variant="body2"
                    sx={{ color: "red", fontSize: "14px" }}
                  >
                    {error}
                  </Typography>
                )}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    sx={buttonStyle}
                    onClick={submitComment}
                    disabled={isSubmitting || !commentText.trim()}
                  >
                    {isSubmitting ? "Posting..." : "Submit comment"}
                  </Button>
                </div>
              </div>
            </Box>
          </Modal>
        </div>
      ) : (
        <div>
          {authorized ? (
            <Button
              onClick={handleOpen}
              sx={openButtonStyle}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div>
                <img src="assets\icons\Message icon.svg" />
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
            <Box sx={modalStyleMobile}>
              <div
                style={{
                  width: "100%",
                  height: "10%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#675844",
                    fontFamily: "Itim",
                    fontSize: "18px",
                  }}
                >
                  Comments ({comments.length})
                </Typography>
                <Button sx={closeButtonStyle} onClick={handleClose}>
                  <img
                    style={{ height: "100%" }}
                    src="assets\icons\Close icon.svg"
                  />
                </Button>
              </div>
              <div
                style={{
                  width: "90%",
                  height: "auto",
                  maxHeight: "45%",
                  marginBottom: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={
                    imageUrl || "assets/icons/ant-design--picture-outlined.svg"
                  }
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

              {/* Comments List */}
              <div
                style={{
                  width: "90%",
                  marginBottom: "10px",
                  padding: "8px",
                }}
              >
                {sortedComments.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#675844",
                      textAlign: "center",
                      fontFamily: "Itim",
                      fontSize: "14px",
                    }}
                  >
                    No comments yet!
                  </Typography>
                ) : (
                  sortedComments.map((comment, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "8px",
                        marginBottom: "6px",
                        backgroundColor:
                          index % 2 === 0 ? "#FFECF0" : "#FFC2CF",
                        borderRadius: "10px",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#675844",
                          fontFamily: "Itim",
                          fontSize: "14px",
                        }}
                      >
                        {comment.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#8F7A60", fontSize: "9px" }}
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
                  justifyContent: "space-evenly",
                  margin: "10px",
                  width: "90%",
                }}
              >
                <div>
                  <textarea
                    placeholder="Add your comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={isSubmitting}
                    maxLength={MAX_CHARS}
                    rows={3}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "20px",
                      border: "1px solid rgba(255, 132, 164, 1)",
                      width: "100%",
                      padding: "10px",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      fontSize: "12px",
                      resize: "none",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#675844",
                      marginLeft: "12px",
                      fontSize: "10px",
                    }}
                  >
                    <p
                      style={{
                        textAlign: "center",
                        fontSize: "1.5em",
                        fontFamily: "Itim",
                        color: "inherit",
                      }}
                    >
                      {remainingChars} characters remaining
                    </p>
                  </Typography>
                </div>
                {error && (
                  <Typography
                    variant="body2"
                    sx={{ color: "red", fontSize: "12px" }}
                  >
                    {error}
                  </Typography>
                )}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    sx={buttonStyle}
                    onClick={submitComment}
                    disabled={isSubmitting || !commentText.trim()}
                  >
                    {isSubmitting ? "Posting..." : "Submit comment"}
                  </Button>
                </div>
              </div>
            </Box>
          </Modal>
        </div>
      )}
    </>
  );
}
