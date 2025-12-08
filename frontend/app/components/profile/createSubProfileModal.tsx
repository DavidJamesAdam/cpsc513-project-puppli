import * as React from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import closeIcon from "../../assets/icons/close_icon.svg"

export default function CreateSubProfileModal() {
  // handles whether the modal is open or not
  const [open, setOpen] = React.useState(false);

  // handles what happens when user opens/closes the modal
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    // reset all fields after window closed
    setPetName("");
    setBreed("");
    setBday("");
    setTreat("");
    setToy("");
    // reset touched states
    setPetNameTouched(false);
    setBreedTouched(false);
    setBdayTouched(false);
    setTreatTouched(false);
    setToyTouched(false);
  };

  // handles what happens when user clicks submit in the modal
  const handleSubmit = async () => {
    try {
      // Create pet data object
      const newPetInfo = {
        name: petName,
        breed: breed,
        birthday: bday,
        favouriteTreat: treat,
        favouriteToy: toy,
      };

      // Send POST request to create pet
      const response = await fetch("http://localhost:8000/pet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newPetInfo),
      });

      if (response.ok) {
        console.log("Pet profile created successfully");
        // Close modal and reset fields
        setOpen(false);
        setPetName("");
        setBreed("");
        setBday("");
        setTreat("");
        setToy("");

        // Reload the page to show the new pet
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error("Error creating pet profile:", response.status, errorData);
        alert("Failed to create pet profile. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create pet profile:", error);
      alert("Failed to create pet profile. Please try again.");
    }
  };

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
    color: "#675844",
    borderColor: "#675844",
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
  const [petName, setPetName] = React.useState("");
  const [breed, setBreed] = React.useState("");
  const [bday, setBday] = React.useState("");
  const [treat, setTreat] = React.useState("");
  const [toy, setToy] = React.useState("");

  // keeps track of error and error messages
  const [petNameErrorMsg, setPetNameErrorMsg] = React.useState("");
  const [hasPetNameError, setHasPetNameError] = React.useState(false);
  const [breedErrorMsg, setBreedErrorMsg] = React.useState("");
  const [hasBreedError, setHasBreedError] = React.useState(false);
  const [bdayErrorMsg, setBdayErrorMsg] = React.useState("");
  const [hasBdayError, setHasBdayError] = React.useState(false);
  const [treatErrorMsg, setTreatErrorMsg] = React.useState("");
  const [hasTreatError, setHasTreatError] = React.useState(false);
  const [toyErrorMsg, setToyErrorMsg] = React.useState("");
  const [hasToyError, setHasToyError] = React.useState(false);

  // keeps track of whether fields have been touched
  const [petNameTouched, setPetNameTouched] = React.useState(false);
  const [breedTouched, setBreedTouched] = React.useState(false);
  const [bdayTouched, setBdayTouched] = React.useState(false);
  const [treatTouched, setTreatTouched] = React.useState(false);
  const [toyTouched, setToyTouched] = React.useState(false);

  // keep track of any errors on the entire page
  const [hasFormErrors, setHasFormErrors] = React.useState(false);

  // set error messages for each field
  React.useEffect(() => {
    if (petName === "") {
      setPetNameErrorMsg("Pet name field cannot be empty.");
      setHasPetNameError(true);
    } else {
      setPetNameErrorMsg("");
      setHasPetNameError(false);
    }

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
  }, [petName, breed, bday, treat, toy]);

  // disable submit button if any error exists
  React.useEffect(() => {
    if (hasPetNameError || hasBreedError || hasBdayError || hasTreatError || hasToyError) {
      setHasFormErrors(true);
    } else {
      setHasFormErrors(false);
    }
  }, [hasPetNameError, hasBreedError, hasBdayError, hasTreatError, hasToyError]);

  // functions to update inputs being saved
  function onNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPetNameTouched(true);
    setPetName(event.currentTarget.value);
  }

  function onBreedChange(event: React.ChangeEvent<HTMLInputElement>) {
    setBreedTouched(true);
    setBreed(event.currentTarget.value);
  }

  function onBdayChange(event: React.ChangeEvent<HTMLInputElement>) {
    setBdayTouched(true);
    setBday(event.currentTarget.value);
  }

  function onTreatChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTreatTouched(true);
    setTreat(event.currentTarget.value);
  }

  function onToyChange(event: React.ChangeEvent<HTMLInputElement>) {
    setToyTouched(true);
    setToy(event.currentTarget.value);
  }

  const maxCharacters = 50;

  return (
    <div style={{ display: "flex" }}>
      <Button onClick={handleOpen} sx={openButtonStyle} variant="outlined">
        + Add Pet
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="Create sub-profile modal"
        aria-describedby="Modal that allows user to create a new sub-profile"
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
            Create a new pet profile!
          </h1>
          <CardContent sx={inputSectionStyle}>
            <p style={{ fontSize: "24px" }}>Pet name:</p>
            <TextField
              sx={inputFieldStyle}
              variant="standard"
              placeholder={"Pet name"}
              onChange={onNameChange}
              slotProps={{
                input: {
                  disableUnderline: true,
                  style: { color: "#675844" },
                },
                htmlInput: { maxLength: maxCharacters },
              }}
            />
            {petNameTouched && petNameErrorMsg && (
              <p style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}>
                {petNameErrorMsg}
              </p>
            )}
            <br></br>
            <p style={{ fontSize: "24px" }}>Breed:</p>
            <TextField
              sx={inputFieldStyle}
              variant="standard"
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
            {breedTouched && breedErrorMsg && (
              <p style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}>
                {breedErrorMsg}
              </p>
            )}
            <br></br>
            <p style={{ fontSize: "24px" }}>Birthday:</p>
            <TextField
              sx={inputFieldStyle}
              variant="standard"
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
            {bdayTouched && bdayErrorMsg && (
              <p style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}>
                {bdayErrorMsg}
              </p>
            )}
            <br></br>
            <p style={{ fontSize: "24px" }}>Favourite Treat:</p>
            <TextField
              sx={inputFieldStyle}
              variant="standard"
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
            {treatTouched && treatErrorMsg && (
              <p style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}>
                {treatErrorMsg}
              </p>
            )}
            <br></br>
            <p style={{ fontSize: "24px" }}>Favourite Toy:</p>
            <TextField
              sx={inputFieldStyle}
              variant="standard"
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
            {toyTouched && toyErrorMsg && (
              <p style={{ fontSize: "14px", color: "red", paddingLeft: "5px" }}>
                {toyErrorMsg}
              </p>
            )}
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
