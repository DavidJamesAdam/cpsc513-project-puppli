import { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import "./photoGallery.css";

interface Comment {
  text: string;
  createdAt: string;
}

interface PetImage {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  comments: Comment[];
}

interface PhotoGalleryProps {
  petIds: string[];
}

export default function PhotoGallery({ petIds }: PhotoGalleryProps) {
  const [images, setImages] = useState<PetImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<PetImage | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const matches = useMediaQuery("(min-width: 600px)");

  const MAX_CHARS = 56;
  const remainingChars = MAX_CHARS - commentText.length;

  const fetchAllImages = async (): Promise<PetImage[]> => {
    if (petIds.length === 0) {
      setLoading(false);
      return [];
    }

    try {
      const allImages: PetImage[] = [];

      for (const petId of petIds) {
        if (!petId) continue;

        const response = await fetch(`http://localhost:8000/api/v1/pet/${petId}/images`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          allImages.push(...(data.images || []));
        }
      }

      // Sort all images by createdAt (most recent first)
      allImages.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setImages(allImages);
      return allImages;
    } catch (error) {
      console.error("Error fetching pet images:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllImages();
  }, [petIds]);

  const handleImageClick = (image: PetImage) => {
    setSelectedImage(image);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setCommentText("");
    setError("");
  };

  const submitComment = async () => {
    if (!selectedImage) return;

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
        `http://localhost:8000/api/v1/posts/${selectedImage.id}/comment`,
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

      setCommentText("");
      // Fetch the updated post directly by ID
      const postResponse = await fetch(
        `http://localhost:8000/api/v1/posts/${selectedImage.id}`,
        {
          credentials: "include",
        }
      );

      if (postResponse.ok) {
        const updatedPost = await postResponse.json();
        setSelectedImage(updatedPost);
        // Also update the images array to keep it in sync
        setImages(prevImages =>
          prevImages.map(img =>
            img.id === selectedImage.id ? updatedPost : img
          )
        );
      }
    } catch (err) {
      setError("Failed to add comment. Please try again.");
      console.error("Error adding comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedComments = selectedImage
    ? [...selectedImage.comments].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];

  const modalStyle = {
    borderRadius: "40px",
    border: "1px solid rgba(255, 132, 164, 1)",
    width: matches ? "60%" : "100%",
    maxHeight: "90%",
    boxShadow: "5px 10px 10px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "rgba(224, 205, 178, 1)",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    overflowY: "auto",
    padding: "20px",
  };

  const closeButtonStyle = {
    display: "flex",
    borderRadius: "100px",
    height: "100%",
  };

  if (loading) {
    return <div className="gallery-loading">Loading photos...</div>;
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="photo-gallery">
        {images.map((image) => (
          <div
            key={image.id}
            className="gallery-item"
            onClick={() => handleImageClick(image)}
          >
            <img src={image.imageUrl} alt={image.caption || "Pet photo"} />
          </div>
        ))}
      </div>

      <Modal
        open={selectedImage !== null}
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
              Comments ({selectedImage?.comments.length || 0})
            </Typography>
            <Button sx={closeButtonStyle} onClick={handleClose}>
              <img
                style={{ height: "100%" }}
                src="/assets/icons/Close icon.svg"
              />
            </Button>
          </div>
          <div
            style={{
              width: "90%",
              height: "auto",
              maxHeight: matches ? "55%" : "45%",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={selectedImage?.imageUrl || ""}
              alt={selectedImage?.caption || "Post image"}
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
                    backgroundColor: index % 2 === 0 ? "#FFECF0" : "#FFC2CF",
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
              width: matches ? "50%" : "90%",
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
                sx={{
                  backgroundColor: "#FF84A4",
                  color: "white",
                  borderRadius: "100px",
                  padding: "10px 20px",
                  fontFamily: "Itim",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#ff6b8a",
                  },
                  "&:disabled": {
                    backgroundColor: "#ccc",
                  },
                }}
                onClick={submitComment}
                disabled={isSubmitting || !commentText.trim()}
              >
                {isSubmitting ? "Posting..." : "Submit comment"}
              </Button>
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
}
