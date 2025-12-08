import * as React from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import SettingOption from "../settings/SettingOption";
import {
  modalStyle,
  modalStyleMobile,
  openButtonStyle,
  closeButtonStyle,
} from "./modal.styles.js";
import CancelIcon from '@mui/icons-material/Cancel';
import IconButton from "@mui/material/IconButton";

export default function FAQModal() {
  const matches = useMediaQuery("(min-width: 600px)");
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Button onClick={handleOpen} sx={openButtonStyle}>
        <SettingOption settingName={"FAQs"}></SettingOption>
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="faq MODAL"
        aria-describedby="Modal that displays FAQ for Puppli"
      >
        <Box sx={matches ? modalStyle : modalStyleMobile}>
          <div
            style={{
              width: "100%",
              height: "10%",
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "2%",
              marginRight: "2%",
            }}
          >
            <IconButton sx={closeButtonStyle} onClick={handleClose}>
              <CancelIcon />
              {/* <img style={{ height: "100%" }} src={closeIcon} /> */}
            </IconButton>
          </div>
          <div style={{ textAlign: "center", margin: "20px" }}>
            <Typography className="question" variant="h6" component="h2">
              Q: How can I change my account information (username or password)?
            </Typography>
            <Typography variant="inherit">
              A: Go to your main Profile page and click the gear icon under your
              username to open Settings. Under the User section, select Change
              username or Change password. A popup will guclassNamee you through
              the update.
            </Typography>

            <Typography className="question" variant="h6" component="h2">
              Q: How do I post a picture?
            </Typography>
            <Typography variant="inherit">
              A: Use the Upload option in the navigation menu. From there, you
              can choose the photos you’d like to upload and post. You may also
              access the Upload function by clicking Posts in the bottom left
              corner of your Main Profile and Sub Profile pages.
            </Typography>

            <Typography className="question" variant="h6" component="h2">
              Q: How do I delete my account?
            </Typography>
            <Typography variant="inherit">
              A: User-initiated account deletion is not currently supported.
              However, users may request for account deletion by contacting
              puppli-contact@gmail.com
            </Typography>

            <Typography className="question" variant="h6" component="h2">
              Q: Does Puppli have paid services?
            </Typography>
            <Typography variant="inherit">
              A: No. Puppli is completely free to use, and all features are
              available at no cost.
            </Typography>

            <Typography className="question" variant="h6" component="h2">
              Q: Can I post pictures of more than one pet?
            </Typography>
            <Typography variant="inherit">
              A: Yes! You can create up to two sub-profiles under your main
              account. Each sub-profile is a dedicated space for an individual
              pet.
            </Typography>
            <Typography className="question" variant="h6" component="h2">
              Q: Can I disable notifications?
            </Typography>
            <Typography variant="inherit">
              A: At this point, disabling notifications is not possible.
            </Typography>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
