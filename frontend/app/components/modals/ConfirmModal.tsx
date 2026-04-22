import { useMediaQuery, Box, Modal, Button } from "@mui/material";
import { modalStyle, modalStyleMobile, buttonStyle } from "./modal.styles.js";

type Props = {
  open: boolean;
  uid?: string | undefined;
  onClose: () => void;
  onConfirm: (uid?: string) => void | Promise<void>;
};

export default function ConfirmDeletionModal({
  open,
  uid,
  onClose,
  onConfirm,
}: Props) {
  const matches = useMediaQuery("(min-width: 600px)");

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="Confirm deletion modal"
        aria-describedby="Modal that allows admin to confirm deletion of user"
      >
        <Box
          sx={matches ? modalStyle : modalStyleMobile}
          style={{ height: "30%" }}
        >
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <strong>Are you sure you want to delete this user?</strong>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <div style={{display: "flex", flexDirection: "row", justifyContent: "space-around", width: "100%"}}>
              <div style={{ width: "30%", display: "flex", justifyContent: "center" }}>
                <Button
                  sx={buttonStyle}
                  onClick={() => {
                    void onConfirm(uid);
                  }}
                  style={{ backgroundColor: "red", color: "white"}}
                >
                  Yes
                </Button>
              </div>
              <div style={{ width: "30%", display: "flex", justifyContent: "center" }}>
                <Button sx={buttonStyle} onClick={onClose}>
                  No
                </Button>
              </div>
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
}
