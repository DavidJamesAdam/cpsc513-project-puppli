import * as React from "react";
import {
  TextField,
  CardContent,
  Card,
  Modal,
  Button,
  IconButton,
  Box,
  useMediaQuery,
} from "@mui/material";
import editIcon from "~/assets/icons/username.svg";
import closeIcon from "~/assets/icons/close_icon.svg";
import {
  modalStyle,
  modalStyleMobile,
  openButtonStyle,
  closeButtonStyle,
  submitButtonStyle,
  inputSectionStyle,
  inputFieldStyle,
} from "./modal.styles.js";

interface EditAboutPetModalProps {
  onPetOneSubPage: boolean;
  petInfo: {
    name: string;
    breed: string;
    bday: string;
    treat: string;
    toy: string;
  };
  userInfo: {
    name: string;
    username: string;
    bio: string;
    gold: number;
    silver: number;
    bronze: number;
    pet1?: {
      name: string;
      breed: string;
      bday: string;
      treat: string;
      toy: string;
    };
    pet2?: {
      name: string;
      breed: string;
      bday: string;
      treat: string;
      toy: string;
    };
  };
  onUpdateSuccess?: () => void;
}

export default function EditAboutPetModal({
  onPetOneSubPage,
  petInfo,
  userInfo,
  onUpdateSuccess,
}: EditAboutPetModalProps) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const matches = useMediaQuery("(min-width: 600px)");
  const [message, setMessage] = React.useState<string>("");
  const [error, setError] = React.useState(null);
  // This function would send off the user's request to update the pets information
  const handleSubmit = async () => {
    try {
      // Fetch pets for the logged-in user
      const petsResponse = await fetch("http://localhost:8000/pets", {
        credentials: "include",
      });

      // if successful, we can do the update
      if (petsResponse.ok) {
        const petsData = await petsResponse.json();

        // by default use pet1 id
        let petID = petsData[0].id;

        // but if on sub profile 2, get second pet's id
        if (!onPetOneSubPage) {
          petID = petsData[1].id;
        }

        // save all the fields in the modal to the DB based on the pet id
        const updatePetResponse = await fetch(
          `http://localhost:8000/pet/update/${petID}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              breed: breed,
              birthday: bday,
              favouriteToy: toy,
              favouriteTreat: treat,
            }),
          },
        );

        // if successful, call the callback to refresh data
        if (updatePetResponse.ok) {
          console.log("Pet information updated successfully");
          setOpen(false);
          // Call the callback to refresh pet data in parent component
          if (onUpdateSuccess) {
            onUpdateSuccess();
          }
        } else {
          const errorData = await updatePetResponse.json();
          console.error(
            "Error updating pet information:",
            updatePetResponse.status,
            errorData,
          );
          alert("Failed to update pet information. Please try again.");
        }
      } else {
        const errorData = await petsResponse.json();
        console.error("Error fetching pets:", petsResponse.status, errorData);
        alert("Failed to fetch pet information. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update pet information:", error);
      alert("Failed to update pet information. Please try again.");
    }
  };
  const maxCharacters = 50;

  // saves each input field content to a variable
  const [breed, setBreed] = React.useState(petInfo.breed);
  const [bday, setBday] = React.useState(petInfo.bday);
  const [treat, setTreat] = React.useState(petInfo.treat);
  const [toy, setToy] = React.useState(petInfo.toy);

  // keeps track of error and error messages
  const [breedErrorMsg, setBreedErrorMsg] = React.useState("");
  const [hasBreedError, setHasBreedError] = React.useState(false);
  const [bdayErrorMsg, setBdayErrorMsg] = React.useState("");
  const [hasBdayError, setHasBdayError] = React.useState(false);
  const [treatErrorMsg, setTreatErrorMsg] = React.useState("");
  const [hasTreatError, setHasTreatError] = React.useState(false);
  const [toyErrorMsg, setToyErrorMsg] = React.useState("");
  const [hasToyError, setHasToyError] = React.useState(false);

  // keep track of any errors on the entire page
  const [hasFormErrors, setHasFormErrors] = React.useState(false);

  // set error messages for each field
  React.useEffect(() => {
    if (breed === "") {
      setBreedErrorMsg("Pet breed field cannot be empty.");
      setHasBreedError(true);
    } else {
      setBreedErrorMsg("");
      setHasBreedError(false);
    }

    if (bday === "") {
      setBdayErrorMsg("Pet birthday field cannot be empty.");
      setHasBdayError(true);
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(bday)) {
      setBdayErrorMsg("Must be in YYYY-MM-DD format (e.g., 2020-03-15).");
      setHasBdayError(true);
    } else {
      setBdayErrorMsg("");
      setHasBdayError(false);
    }

    if (treat === "") {
      setTreatErrorMsg("Pet favourite treat field cannot be empty.");
      setHasTreatError(true);
    } else {
      setTreatErrorMsg("");
      setHasTreatError(false);
    }

    if (toy === "") {
      setToyErrorMsg("Pet favourite toy field cannot be empty.");
      setHasToyError(true);
    } else {
      setToyErrorMsg("");
      setHasToyError(false);
    }
  }, [breed, bday, treat, toy]);

  // disable submit button if any error exists
  React.useEffect(() => {
    if (hasBreedError || hasBdayError || hasTreatError || hasToyError) {
      setHasFormErrors(true);
    } else {
      setHasFormErrors(false);
    }
  }, [hasBreedError, hasBdayError, hasTreatError, hasToyError]);

  // functions to update inputs being saved
  function onBreedChange(event: React.ChangeEvent<HTMLInputElement>) {
    setBreed(event.currentTarget.value);
  }

  function onBdayChange(event: React.ChangeEvent<HTMLInputElement>) {
    setBday(event.currentTarget.value);
  }

  function onTreatChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTreat(event.currentTarget.value);
  }

  function onToyChange(event: React.ChangeEvent<HTMLInputElement>) {
    setToy(event.currentTarget.value);
  }

  return (
    <div style={{ display: "flex" }}>
      <span id="aboutTitle">About</span>
      <Button onClick={handleOpen} sx={openButtonStyle}>
        <img src={editIcon} alt="" id="editIcon" />
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="Edit about modal"
        aria-describedby="Modal that allows user to edit pet information"
      >
        <Box sx={matches ? modalStyle : modalStyleMobile}>
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
          <div style={{ overflow: "auto" }}>
            <div>
              <h1
                style={{
                  paddingLeft: "15px",
                  paddingRight: "15px",
                  fontSize: "32px",
                }}
              >
                Edit your pet's information!
              </h1>
            </div>
            <form
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-evenly",
                paddingLeft: "5%",
                paddingRight: "5%",
                height: "100%",
                width: "100%",
              }}
            >
              <label
                htmlFor="breed"
                style={{ paddingLeft: "2%", fontSize: "calc(1vh + 1vw)" }}
              >
                Breed:
              </label>
              <TextField
                sx={inputFieldStyle}
                placeholder={"Breed"}
                onChange={onBreedChange}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    style: { color: "#675844" },
                  },
                  htmlInput: { maxLength: maxCharacters },
                }}
              />
              <p style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}>
                {breedErrorMsg}
              </p>
              <label
                htmlFor="birthday"
                style={{ paddingLeft: "2%", fontSize: "calc(1vh + 1vw)" }}
              >
                Birthday:
              </label>
              <TextField
                sx={inputFieldStyle}
                type="date"
                placeholder="YYYY-MM-DD"
                value={bday}
                onChange={onBdayChange}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    style: { color: "#675844" },
                  },
                  htmlInput: {
                    pattern: "\\d{4}-\\d{2}-\\d{2}",
                  },
                }}
              />
              <p style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}>
                {bdayErrorMsg}
              </p>
              <label
                htmlFor="favouriteTreat"
                style={{ paddingLeft: "2%", fontSize: "calc(1vh + 1vw)" }}
              >
                Favourite treat:
              </label>
              <TextField
                sx={inputFieldStyle}
                placeholder={"Favourite Treat"}
                onChange={onTreatChange}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    style: { color: "#675844" },
                  },
                  htmlInput: { maxLength: maxCharacters },
                }}
              />
              <p style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}>
                {treatErrorMsg}
              </p>
                            <label
                htmlFor="favouriteToy"
                style={{ paddingLeft: "2%", fontSize: "calc(1vh + 1vw)" }}
              >
                Favourite toy:
              </label>
              <TextField
                sx={inputFieldStyle}
                placeholder={"Favourite Toy"}
                onChange={onToyChange}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    style: { color: "#675844" },
                  },
                  htmlInput: { maxLength: maxCharacters },
                }}
              />
              <p style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}>
                {toyErrorMsg}
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  id="submit"
                  sx={submitButtonStyle}
                  onClick={handleSubmit}
                  disabled={hasFormErrors}
                >
                  <p style={{ fontSize: "calc(.5vw + 1vh)" }}>Submit</p>
                </Button>
              </div>
              {/* Display error message */}
              {error && (
                <p style={{ color: "red", fontSize: "1.5em" }}>{message}</p>
              )}{" "}
            </form>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
