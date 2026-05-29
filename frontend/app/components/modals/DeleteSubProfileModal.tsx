import * as React from "react";
import {
  Card,
  Modal,
  Button,
  IconButton,
  Box,
  useMediaQuery,
} from "@mui/material";
import closeIcon from "~/assets/icons/close_icon.svg";
import {
  modalStyle,
  modalStyleMobile,
  closeButtonStyle,
  deleteButtonStyle,
  buttonStyle,
} from "./modal.styles.js";

interface DeleteSubProfileModalProps {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  petName: string;
  petId: string;
}

export default function DeleteSubProfileModal({
  open: propOpen,
  onOpen,
  onClose,
  petName,
  petId,
}: DeleteSubProfileModalProps) {
  // handles whether the modal is open or not
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = propOpen !== undefined;
  const open = isControlled ? propOpen! : internalOpen;
  const matches = useMediaQuery("(min-width: 600px)");
  // handles what happens when user closes the modal
  const handleClose = () => {
    if (onClose) onClose();
    if (!isControlled) setInternalOpen(false);
  };
  // handles what happens when user clicks DELETE in the modal
  const handleDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/pet/delete/${petId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        // Successfully deleted - redirect user to main profile page
        window.location.href = "/profile";
      } else {
        const errorData = await response.json();
        console.error("Error deleting pet:", response.status, errorData);
        alert("Failed to delete pet profile. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting pet:", error);
      alert("An error occurred while deleting the pet profile.");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="Delete sub-profile modal"
        aria-describedby="Modal that allows user to delete a sub-profile"
      >
        <Box
          sx={matches ? modalStyle : modalStyleMobile}
          style={{ height: "40%" }}
        >
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
          <div style={{width: "100%", height: "80%", display: "flex", flexDirection: "column", justifyContent: "space-around"}}>
            <div style={{width: "100%", textAlign: "center"}}>
              <h1
                style={{
                  paddingLeft: "15px",
                  paddingRight: "15px",
                  fontSize: "4vh",
                }}
              >
                Are you sure you want to delete <b>{petName}'s</b> profile?
              </h1>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-around",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: "30%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Button
                  sx={buttonStyle}
                  onClick={() => {
                    handleDelete;
                  }}
                  style={{ backgroundColor: "red", color: "white" }}
                >
                  Yes
                </Button>
              </div>
              <div
                style={{
                  width: "30%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Button sx={buttonStyle} onClick={onClose}>
                  No
                </Button>
              </div>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
