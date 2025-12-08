import * as React from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import closeIcon from "~/assets/icons/close_icon.svg";
import {
  modalStyle,
  modalStyleMobile,
  closeButtonStyle,
  deleteButtonStyle,
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
  // handles what happens when user closes the modal
  const handleClose = () => {
    if (onClose) onClose();
    if (!isControlled) setInternalOpen(false);
  };
  // handles what happens when user clicks DELETE in the modal
  const handleDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/pet/delete/${petId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
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
        <Card sx={modalStyle}>
          <Button sx={closeButtonStyle} onClick={handleClose}>
            <img src={closeIcon} />
          </Button>
          <h1
            style={{
              paddingLeft: "15px",
              paddingRight: "15px",
              fontSize: "32px",
            }}
          >
            Are you sure you want to delete <b>{petName}'s</b> profile?
          </h1>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              sx={deleteButtonStyle}
              onClick={handleDelete}
            >
              DELETE
            </Button>
          </div>
        </Card>
      </Modal>
    </div>
  );
}
