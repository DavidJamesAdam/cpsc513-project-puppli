import React, { useEffect, useRef, useState } from "react";
import {
  TextField,
  Box,
  Modal,
  Button,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { PetSelectionMenu } from "../dropdown menus/PetSelectionMenu";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";
import toast from "react-hot-toast";
import { toastStyle } from "~/styles/component-styles";
import uploadIcon from "~/assets/icons/upload_icon.svg";
import closeIcon from "~/assets/icons/close_icon.svg";
import fallbackImage from "~/assets/icons/ant-design--picture-outlined.svg";
import {
  modalStyle,
  modalStyleMobile,
  openButtonStyle,
  closeButtonStyle,
  buttonStyle,
  container,
  mobileContainer,
} from "./modal.styles.js";

type UploadModalProps = {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onUploadSuccess?: () => void;
  hideTrigger?: boolean;
};

export default function UploadModal({
  open: propOpen,
  onOpen,
  onClose,
  onUploadSuccess,
  hideTrigger,
}: UploadModalProps) {
  const matches = useMediaQuery("(min-width: 600px)");
  const [internalOpen, setInternalOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [caption, setCaption] = useState<string>("");

  const isControlled = propOpen !== undefined;
  const open = isControlled ? propOpen! : internalOpen;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    if (onOpen) onOpen();
    if (!isControlled) setInternalOpen(true);
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (!isControlled) setInternalOpen(false);
    setImage(null);
    setSelectedFile(null);
    setCaption("");
    setSelectedPetId("");
  };

  const handleFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handlePicturePreview = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImage(URL.createObjectURL(file));
    }
  };

  const handlePetChange = (petId: string, petName: string) => {
    setSelectedPetId(petId);
    console.log("Selected pet:", petName, petId);
  };

  const handleCaptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCaption(event.target.value);
  };

  const handlePictureUpload = async () => {
    // Validate inputs
    if (!selectedFile) {
      alert("Please select a picture first");
      return;
    }
    if (!selectedPetId) {
      alert("Please select a pet");
      return;
    }
    if (!caption.trim()) {
      alert("Please add a caption");
      return;
    }

    // Upload to Firebase Storage
    const timestamp = Date.now();
    const storageRef = ref(storage!, `posts/${timestamp}_${selectedFile.name}`);
    await uploadBytes(storageRef, selectedFile);
    const imageUrl = await getDownloadURL(storageRef);

    try {
      // Create post via backend API. Build the fetch promise first (do not await yet)
      const uploadPromise = fetch("http://localhost:8000/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          caption,
          petId: selectedPetId,
          imageUrl,
        }),
      }).then(async (resp) => {
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.detail || "Error when uploading");
        }
        return resp.json();
      });

      // Let react-hot-toast track the promise lifecycle
      toast.promise(
        uploadPromise,
        {
          loading: "Uploading",
          success: "Uploaded",
          error: (err: Error) => `Upload failed: ${err.message}`,
        },
        {
          style: toastStyle,
          duration: 3000,
        },
      );

      // Await the result (this will re-throw if the promise rejected)
      const result = await uploadPromise;
      console.log("Post created successfully:", result);

      // Call the success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return;
    }

    handleClose();
  };

  useEffect(() => {});

  return (
    <div>
      {!hideTrigger && (
        <Button onClick={handleOpen} sx={openButtonStyle}>
          <div className="menu-icon">
            <img src={uploadIcon} />
          </div>
          Upload
        </Button>
      )}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="Upload modal"
        aria-describedby="Modal that allows user to upload photo"
        keepMounted
      >
        <Box sx={matches ? modalStyle : modalStyleMobile} style={matches ?{ height: "70%"} : { height: "80%"}}>
          <div
            style={{
              width: "100%",
              height: "10%",
              display: "flex",
              justifyContent: "flex-end",
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            <IconButton sx={closeButtonStyle} onClick={handleClose}>
              <img style={{ height: "100%" }} src={closeIcon} />
            </IconButton>
          </div>
          <div style={matches ? container : mobileContainer}>
            <input
              type="file"
              accept=".png, .jpg, .jpeg, .pdf"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handlePicturePreview}
            />
            <div
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // padding: "5%"
              }}
            >
              <img
                src={image || fallbackImage}
                style={{
                  maxWidth: "100%", // never wider than wrapper
                  maxHeight: "100%", // never taller than wrapper
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "40px",
                  border: "1px solid rgba(255, 132, 164, 1)",
                  backgroundColor: "rgba(217, 217, 217, 1)",
                }}
                alt="Image Preview"
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                paddingLeft: "3%",
                height: "100%",
              }}
            >
              <div
                style={{
                  width: "100%",
                  // display: "flex",
                  justifyContent: "center",
                  // alignItems: "center",
                }}
              >
                <PetSelectionMenu onPetChange={handlePetChange} />
              </div>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  // alignItems: "center",
                }}
              >
                <Button
                  sx={buttonStyle}
                  onClick={handleFileBrowser}
                  style={{
                    width: "100%",
                  }}
                >
                  Select Picture
                </Button>
              </div>
              <div
                style={{
                  width: "100%",
                  // display: "flex",
                  justifyContent: "center",
                  // alignItems: "center",
                }}
              >
                <TextField
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={handleCaptionChange}
                  multiline
                  rows={2}
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: {
                      style: {
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        borderRadius: "8px",
                      },
                    },
                  }}
                />
              </div>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  // alignItems: "center",
                }}
              >
                <Button
                  id="uploadButton"
                  sx={buttonStyle}
                  onClick={handlePictureUpload}
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(195, 189, 187, 1)",
                    border: "1px solid rgba(120, 114, 111, 1)",
                  }}
                >
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
