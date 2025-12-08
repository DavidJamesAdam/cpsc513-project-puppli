import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { modalStyle, modalStyleMobile, buttonStyle } from "./modal.styles.js"

type Props = {
  open: boolean;
  uid?: string | undefined;
  onClose: () => void;
  onConfirm: (uid?: string) => void | Promise<void>;
};

export default function ConfirmDeletionModal({ open, uid, onClose, onConfirm }: Props) {
  const matches = useMediaQuery("(min-width: 600px)");

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="Confirm deletion modal"
        aria-describedby="Modal that allows admin to confirm deletion of user"
      >
        <Box sx={matches ? modalStyle : modalStyleMobile}>
          <strong>Are you sure you want to delete this user?</strong>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Button
              sx={buttonStyle}
              onClick={() => {
                void onConfirm(uid);
              }}
              style={{ backgroundColor: "red", color: "white" }}
            >
              Yes
            </Button>
            <Button sx={buttonStyle} onClick={onClose}>
              No
            </Button>
          </div>
        </Box>
      </Modal>
    </>
  );
}
