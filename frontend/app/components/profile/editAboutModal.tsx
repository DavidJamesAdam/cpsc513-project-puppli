import * as React from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import editIcon from "../../assets/icons/username.svg";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import closeIcon from "../../assets/icons/close_icon.svg"

interface EditAboutModalProps {
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

export default function EditAboutModal({
  onPetOneSubPage,
  petInfo,
  userInfo,
  onUpdateSuccess,
}: EditAboutModalProps) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
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
          }
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
          console.error("Error updating pet information:", updatePetResponse.status, errorData);
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

  // bunch of styling in constants used for sx attributes
  const modalStyle = {
    textAlign: "left",
    backgroundColor: "#E0CDB2",
    borderRadius: "40px",
    justifyContent: "center",
    maxWidth: "785px",
    minWidth: "300px",
    maxHeight: "520px",
    padding: "5px",
    border: "1px solid rgba(255, 132, 164, 1)",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    overflow: "auto",
  };

  const openButtonStyle = {
    fontFamily: "inherit",
    fontSize: "24px",
    textTransform: "capitalize",
  };

  const inputSectionStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
    maxWidth: "522px",
    justifySelf: "left",
  };

  const pinkBorder = "1px solid rgba(255, 132, 164, 1)";

  const inputFieldStyle = {
    backgroundColor: "var(--bg-color)",
    borderRadius: "100px",
    padding: "10px",
    maxHeight: "59px",
    borderBottom: "none",
    border: pinkBorder,
  };

  const closeButtonStyle = {
    display: "flex",
    border: "none",
    padding: 0,
    borderRadius: "100px",
    justifySelf: "flex-end",
    scale: "50%",
  };

  const submitButtonStyle = {
    borderRadius: "100px",
    border: "1px solid rgba(147, 191, 191, 1)",
    backgroundColor: "rgba(179, 232, 232, 1)",
    color: "#675844",
    font: "inherit",
    display: "flex",
    justifyContent: "flex-end",
    margin: "10px",
  };

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
            Edit your pet's information!
          </h1>
          <CardContent sx={inputSectionStyle}>
            <p style={{ fontSize: "24px" }}>Breed:</p>
            <TextField
              sx={inputFieldStyle}
              variant="standard"
              defaultValue={petInfo.breed}
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
            <br></br>
            <p style={{ fontSize: "24px" }}>Birthday:</p>
            <TextField
              sx={inputFieldStyle}
              variant="standard"
              type="date"
              defaultValue={petInfo.bday}
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
            <br></br>
            <p style={{ fontSize: "24px" }}>Favourite Treat:</p>
            <TextField
              sx={inputFieldStyle}
              variant="standard"
              defaultValue={petInfo.treat}
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
            <br></br>
            <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
              <p style={{ fontSize: "24px" }}>
                Owner: {userInfo.name} - {userInfo.username}
              </p>
            </div>
            <br></br>
            <p style={{ fontSize: "24px" }}>Favourite Toy:</p>
            <TextField
              sx={inputFieldStyle}
              variant="standard"
              defaultValue={petInfo.toy}
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
            <br></br>
          </CardContent>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              id="submit"
              sx={submitButtonStyle}
              onClick={handleSubmit}
              disabled={hasFormErrors}
            >
              Submit
            </Button>
          </div>
        </Card>
      </Modal>
    </div>
  );
}
