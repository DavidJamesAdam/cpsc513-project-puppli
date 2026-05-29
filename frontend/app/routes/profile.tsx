import type { Route } from "./+types/profile";
import Header from "../components/header/Header";
import "../styles/profile.css";
import { useEffect, useState, type ChangeEvent } from "react";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import EditAboutPetModal from "~/components/modals/EditAboutPetModal";
import CreateSubProfileModal from "~/components/modals/CreateSubProfileModal";
import TextField from "@mui/material/TextField";
import SaveAndCancelButtons from "~/components/saveAndCancelButtons";
import UploadModal from "~/components/modals/UploadModal";
import ProfileBanner from "~/components/profile/PprofileBanner";
import DeleteSubProfileModal from "~/components/modals/DeleteSubProfileModal";
import PhotoGallery from "~/components/profile/PhotoGallery";
import { authCheck } from "../utils/authCheck";
import settingsIcon from "../assets/icons/settings.svg";
import defaultPetPFPMain from "../assets/icons/defaultPetPFPMain.svg";
import defaultPetProfilePicture from "../assets/icons/defaultPetPFP.svg";
import editIcon from "../assets/icons/username.svg";
import defaultProfilePicture from "../assets/icons/defaultPFP.svg";
import postIcon from "../assets/icons/postIcon.svg";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "profile" },
    { name: "description", content: "profile page" },
  ];
}

export default function Profile() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Pet info from database
  const [petInfo1, setPetInfo1] = useState({
    id: "",
    name: "",
    breed: "",
    bday: "",
    treat: "",
    toy: "",
    lastImageUrl: "",
  });

  const [petInfo2, setPetInfo2] = useState({
    id: "",
    name: "",
    breed: "",
    bday: "",
    treat: "",
    toy: "",
    lastImageUrl: "",
  });

  const [userInfo, setUserInfo] = useState({
    name: "",
    username: "",
    bio: "",
    gold: 0,
    silver: 0,
    bronze: 0,
    pet1: petInfo1,
    pet2: petInfo2,
  });

  // handles the upload modal
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // keeps track of whether we are on a sub profile or not
  const [onMainProfile, setOnMainProfile] = useState(true);
  const [onPetOneSubPage, setOnPetOneSubPage] = useState(false);

  // keep track of what is in the text field when editing the user bio
  const [editingBio, setEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState<string>(userInfo.bio ?? "");

  // keep track of what is in the text field when editing the user name
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState<string>(userInfo.name ?? "");

  // keep track of what is in the text field when editing the pet's name
  const [editingPetName, setEditingPetName] = useState(false);
  const [editedPetName, setEditedPetName] = useState<string>(
    onPetOneSubPage ? petInfo1.name : petInfo2.name
  );

  const [currentPet, setCurrentPet] = useState(petInfo1);

  // fetches the last uploaded image for a specific pet
  const fetchLastPetImage = async (petId: string): Promise<string> => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/pet/${petId}/last-image`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.imageUrl || "";
      }
    } catch (error) {
      console.error("Error fetching pet images:", error);
    }
    return "";
  };

  // refreshes pet images after upload
  const refreshPetImages = async () => {
    if (petInfo1.id) {
      const lastImage1 = await fetchLastPetImage(petInfo1.id);
      setPetInfo1((prev) => ({ ...prev, lastImageUrl: lastImage1 }));
    }
    if (petInfo2.id) {
      const lastImage2 = await fetchLastPetImage(petInfo2.id);
      setPetInfo2((prev) => ({ ...prev, lastImageUrl: lastImage2 }));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await authCheck();
        setAuthorized(true);

        // Fetch user profile data for the logged-in user
        const userResponse = await fetch("http://localhost:8000/api/v1/user/me", {
          credentials: "include",
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();

          // Update user info with fetched data
          setUserInfo((prev) => ({
            ...prev,
            name: userData.displayName || "",
            username: userData.userName || "",
            bio: userData.bio || "",
            gold: userData.totalGold || 0,
            silver: userData.totalSilver || 0,
            bronze: userData.totalBronze || 0,
          }));
        }

        // Fetch pets for the logged-in user
        const petsResponse = await fetch("http://localhost:8000/api/v1/pet", {
          credentials: "include",
        });

        if (petsResponse.ok) {
          const petsData = await petsResponse.json();

          // Map fetched pets to petInfo1 and petInfo2
          if (petsData.length > 0) {
            const lastImage1 = await fetchLastPetImage(petsData[0].id);
            setPetInfo1({
              id: petsData[0].id || "",
              name: petsData[0].name || "",
              breed: petsData[0].breed || "",
              bday: petsData[0].birthday || "",
              treat: petsData[0].favouriteTreat || "",
              toy: petsData[0].favouriteToy || "",
              lastImageUrl: lastImage1,
            });
          }

          if (petsData.length > 1) {
            const lastImage2 = await fetchLastPetImage(petsData[1].id);
            setPetInfo2({
              id: petsData[1].id || "",
              name: petsData[1].name || "",
              breed: petsData[1].breed || "",
              bday: petsData[1].birthday || "",
              treat: petsData[1].favouriteTreat || "",
              toy: petsData[1].favouriteToy || "",
              lastImageUrl: lastImage2,
            });
          }
        } else {
          const errorData = await petsResponse.json();
          console.error("Error fetching pets:", petsResponse.status, errorData);
        }
      } catch (e) {
        // Not authenticated — redirect to login.
        window.location.href = "/login";
      }
    })();
  }, []);

  if (authorized === null) {
    // Still checking; render nothing (avoids showing protected content).
    return null;
  }

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleDeleteModalClose = () => {
    setAnchorEl(null);
  };

  const maxCharacters = 50;

  // saves edited bio to DB
  const handleSaveBio = async (saved: boolean) => {
    if (saved) {
      setEditedBio(editedBio);
      // update local object (since data from DB is not available yet)
      setUserInfo((prev) => ({ ...prev, bio: editedBio }));

      // Fetch user profile data for the logged-in user
      const userResponse = await fetch("http://localhost:8000/api/v1/user/me", {
        credentials: "include",
      });

      // if successful, we can do the update
      if (userResponse.ok) {
        const userData = await userResponse.json();

        // save the bio in the text field to the DB based on the current user id
        const updateBioResponse = await fetch(
          `http://localhost:8000/api/v1/user/update/${userData.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bio: editedBio }),
          }
        );

        // if failed, print to console
        if (!updateBioResponse.ok) {
          console.error("Error updating bio.");
        }
      }
    }
    // either button clicked should disable editing mode on user bio
    setEditingBio(false);
    setEditedBio(userInfo.bio);
  };

  // saves edited name to DB
  const handleSaveName = async (saved: boolean) => {
    if (saved) {
      setEditedName(editedName);
      // update local object (since data from DB is not available yet)
      setUserInfo((prev) => ({ ...prev, name: editedName }));

      // Fetch user profile data for the logged-in user
      const userResponse = await fetch("http://localhost:8000/api/v1/user/me", {
        credentials: "include",
      });

      // if successful, we can do the update
      if (userResponse.ok) {
        const userData = await userResponse.json();

        // save the display name in the text field to the DB based on the current user id
        const updateNameResponse = await fetch(
          `http://localhost:8000/api/v1/user/update/${userData.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayName: editedName }),
          }
        );

        // if failed, print to console
        if (!updateNameResponse.ok) {
          console.error("Error updating display name.");
        }
      }
    }
    // either button clicked should disable editing mode on user name
    setEditingName(false);
    setEditedName(userInfo.name);
  };

  // saves edited pet name to DB
  const handleSavePetName = async (saved: boolean) => {
    if (saved) {
      setEditedPetName(editedPetName);
      // update local object (since data from DB is not available yet)
      if (onPetOneSubPage) {
        setPetInfo1((prev) => ({ ...prev, name: editedPetName }));
        setUserInfo((prev) => ({ ...prev, pet1: petInfo1 }));
      } else {
        setPetInfo2((prev) => ({ ...prev, name: editedPetName }));
        setUserInfo((prev) => ({ ...prev, pet2: petInfo2 }));
      }

      // Fetch pets for the logged-in user
      const petsResponse = await fetch("http://localhost:8000/api/v1/pet", {
        credentials: "include",
      });

      // if successful, we can do the update
      if (petsResponse.ok) {
        const petsData = await petsResponse.json();

        // by defualt use pet1 id
        let petID = petsData[0].id;

        // but if on sub profile 2, get second pet's id
        if (!onPetOneSubPage) {
          petID = petsData[1].id;
        }

        // save the pet's name in the text field to the DB based on the pet id
        const updateNameResponse = await fetch(
          `http://localhost:8000/api/v1/pet/update/${petID}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: editedPetName }),
          }
        );

        // if failed, print to console
        if (!updateNameResponse.ok) {
          console.error("Error updating pet name.");
        }
      }
    }
    // either button clicked should disable editing mode on user name
    setEditingPetName(false);
    setEditedPetName(onPetOneSubPage ? petInfo1.name : petInfo2.name);
  };

  // updates the state to know whether we are on main or sub profiles
  function changeProfilePage(): void {
    setOnMainProfile(!onMainProfile);
    if (onPetOneSubPage) {
      setCurrentPet(petInfo1);
    } else {
      setCurrentPet(petInfo2);
    }
  }

  function createSubProfile(): void {
    throw new Error("Function not implemented.");
  }

  // updates states to know which sub profile we are on
  function goToSubProfileOne(): void {
    setOnMainProfile(!onMainProfile);
    setOnPetOneSubPage(true);
    setCurrentPet(petInfo1);
  }

  // updates states to know which sub profile we are on
  function goToSubProfileTwo(): void {
    setOnMainProfile(!onMainProfile);
    setOnPetOneSubPage(false);
    setCurrentPet(petInfo2);
  }

  // allows user to toggle between editing and viewing modes
  function setEditBioMode(): void {
    setEditingBio(!editingBio);
  }

  // save the local updates from the input
  function saveBioEditingContent(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    setEditedBio(event.currentTarget.value);
  }

  // allows user to toggle between editing and viewing modes
  function setEditNameMode(): void {
    setEditingName(!editingName);
  }

  // save the local updates from the input
  function saveNameEditingContent(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    setEditedName(event.currentTarget.value);
  }

  // allows user to toggle between editing and viewing modes
  function setEditPetNameMode(): void {
    setEditingPetName(!editingPetName);
  }

  // save the local updates from the input
  function savePetNameEditingContent(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    setEditedPetName(event.currentTarget.value);
  }

  // redirects to settings page
  function navigateToSettings(): void {
    window.location.href = "/settings";
  }

  // refreshes pet data from the backend
  const refreshPetData = async () => {
    try {
      const petsResponse = await fetch("http://localhost:8000/api/v1/pet", {
        credentials: "include",
      });

      if (petsResponse.ok) {
        const petsData = await petsResponse.json();

        // Update pet info states
        if (petsData.length > 0) {
          const updatedPet1 = {
            id: petsData[0].id || "",
            name: petsData[0].name || "",
            breed: petsData[0].breed || "",
            bday: petsData[0].birthday || "",
            treat: petsData[0].favouriteTreat || "",
            toy: petsData[0].favouriteToy || "",
            lastImageUrl: petInfo1.lastImageUrl,
          };
          setPetInfo1(updatedPet1);

          // Update current pet if viewing pet 1
          if (onPetOneSubPage) {
            setCurrentPet(updatedPet1);
          }
        }

        if (petsData.length > 1) {
          const updatedPet2 = {
            id: petsData[1].id || "",
            name: petsData[1].name || "",
            breed: petsData[1].breed || "",
            bday: petsData[1].birthday || "",
            treat: petsData[1].favouriteTreat || "",
            toy: petsData[1].favouriteToy || "",
            lastImageUrl: petInfo2.lastImageUrl,
          };
          setPetInfo2(updatedPet2);

          // Update current pet if viewing pet 2
          if (!onPetOneSubPage) {
            setCurrentPet(updatedPet2);
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing pet data:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "auto",
      }}
    >
      <Header />
      <main style={{ backgroundColor: "var(--bg-color)", flex: 1 }}>
        {!onMainProfile && (
          <div style={{ backgroundColor: "#e0cdb2" }}>
            <Button id="backButton" onClick={changeProfilePage}>
              ← Back
            </Button>
          </div>
        )}
        <div id="profileBanner">
          <img
            src={
              onMainProfile
                ? defaultProfilePicture
                : (onPetOneSubPage
                    ? petInfo1.lastImageUrl
                    : petInfo2.lastImageUrl) || defaultPetProfilePicture
            }
            alt=""
          />
          <div id="profileBannerContents">
            <div className="nameEditor">
              {onMainProfile && !editingName ? (
                <>
                  <p className="profileName">
                    {userInfo.name}
                    <Button onClick={setEditNameMode}>
                      <img
                        src={editIcon}
                        alt=""
                        id="editIcon"
                        style={{ scale: "85%" }}
                      />
                    </Button>
                  </p>
                </>
              ) : (
                onMainProfile && (
                  <>
                    <TextField
                      className="input"
                      variant="standard"
                      onChange={saveNameEditingContent}
                      value={editedName}
                      placeholder={userInfo.name ?? "Enter your name..."}
                      slotProps={{
                        input: {
                          disableUnderline: true,
                          style: { color: "#675844" },
                        },
                        htmlInput: { maxLength: maxCharacters, minLength: 1 },
                      }}
                    />
                    <SaveAndCancelButtons onAction={handleSaveName} />
                  </>
                )
              )}
              {!onMainProfile && !editingPetName ? (
                <>
                  <p className="profileName">
                    {onPetOneSubPage ? petInfo1.name : petInfo2.name}
                    <Button onClick={setEditPetNameMode}>
                      <img
                        src={editIcon}
                        alt=""
                        id="editIcon"
                        style={{ scale: "85%" }}
                      />
                    </Button>
                  </p>
                </>
              ) : (
                !onMainProfile && (
                  <>
                    <TextField
                      className="input"
                      variant="standard"
                      onChange={savePetNameEditingContent}
                      value={editedPetName}
                      placeholder={
                        (onPetOneSubPage ? petInfo1.name : petInfo2.name) ??
                        "Enter your pet's name..."
                      }
                      slotProps={{
                        input: {
                          disableUnderline: true,
                          style: { color: "#675844" },
                        },
                        htmlInput: { maxLength: maxCharacters },
                      }}
                    />
                    <SaveAndCancelButtons onAction={handleSavePetName} />
                  </>
                )
              )}
            </div>
            {onMainProfile && (
              <>
                <p>{userInfo.username}</p>
                <Button id="settingsButton" onClick={navigateToSettings}>
                  <img src={settingsIcon} alt="" />
                </Button>
              </>
            )}
          </div>
        </div>
        {onMainProfile ? (
          <div className="grid-container">
            <Container id="aboutContainer">
              <p>Awards</p>
              <ProfileBanner
                first={userInfo.gold}
                second={userInfo.silver}
                third={userInfo.bronze}
              />
              <br></br>
              <div>
                <span>More about {userInfo.username}</span>
                {!editingBio ? (
                  <Button onClick={setEditBioMode}>
                    <img src={editIcon} alt="" id="editIcon" />
                  </Button>
                ) : (
                  <SaveAndCancelButtons onAction={handleSaveBio} />
                )}
              </div>
              {userInfo.bio && !editingBio ? (
                <p style={{ fontSize: "24px" }}>{userInfo.bio}</p>
              ) : (
                <TextField
                  className="input"
                  variant="filled"
                  multiline={true}
                  maxRows={4}
                  onChange={saveBioEditingContent}
                  value={editedBio}
                  placeholder={
                    userInfo.bio ?? "Enter more information about yourself..."
                  }
                  slotProps={{
                    input: {
                      disableUnderline: true,
                      style: { color: "#675844" },
                    },
                    htmlInput: { maxLength: 200 },
                  }}
                  helperText="Max 200 characters"
                />
              )}
            </Container>
            <Container id="petsContainer">
              <p>Pets</p>
              <div className="oddItem">
                <div className="petItem">
                  {petInfo1.name ? (
                    <Button className="petName" onClick={goToSubProfileOne}>
                      {petInfo1.name}
                    </Button>
                  ) : (
                    <CreateSubProfileModal />
                  )}
                  <img
                    src={petInfo1.lastImageUrl || defaultPetPFPMain}
                    alt={petInfo1.name ? `${petInfo1.name}'s photo` : ""}
                  />
                </div>
              </div>
              <div className="evenItem">
                <div className="petItem">
                  {petInfo2.name ? (
                    <Button className="petName" onClick={goToSubProfileTwo}>
                      {petInfo2.name}
                    </Button>
                  ) : (
                    <CreateSubProfileModal />
                  )}
                  <img
                    src={petInfo2.lastImageUrl || defaultPetPFPMain}
                    alt={petInfo2.name ? `${petInfo2.name}'s photo` : ""}
                  />
                </div>
              </div>
            </Container>
            <Divider
              id="horizontalDivider"
              className="divider"
              variant="middle"
              sx={{
                opacity: 1,
                borderColor: "#675844",
                borderWidth: "3px",
                borderRadius: "10px",
              }}
            />
            <div id="postsContainerUser">
              <p style={{ display: "flex" }}>
                <Button
                  id="petUploadButton"
                  onClick={() => {
                    // Close the menu, then open the modal rendered outside the Menu
                    handleClose();
                    setUploadOpen(true);
                  }}
                >
                  Upload <img src={postIcon} alt="" id="postIcon" />
                </Button>
              </p>
            </div>
            <PhotoGallery petIds={[petInfo1.id, petInfo2.id].filter(Boolean)} />
          </div>
        ) : (
          <>
            <div id="petInfoContainer">
              <EditAboutPetModal
                onPetOneSubPage={onPetOneSubPage}
                petInfo={currentPet}
                userInfo={userInfo}
                onUpdateSuccess={refreshPetData}
              />
              <div className="oddItem">Breed: {currentPet.breed}</div>
              <div className="evenItem">Birthday: {currentPet.bday}</div>
              <div className="oddItem">Favourite Treat: {currentPet.treat}</div>
              <div className="evenItem">Favourite Toy: {currentPet.toy}</div>
            </div>
            <Divider
              className="divider"
              variant="middle"
              sx={{
                opacity: 1,
                borderColor: "#675844",
                borderWidth: "3px",
                borderRadius: "10px",
              }}
            />
            <div id="postsContainer">
              <Button
                id="petUploadButton"
                onClick={() => {
                  // Close the menu, then open the modal rendered outside the Menu
                  handleClose();
                  setUploadOpen(true);
                }}
              >
                Upload <img src={postIcon} alt="" id="postIcon" />
              </Button>
              <Button
                id="deleteProfileButton"
                onClick={() => {
                  // Close the menu, then open the modal rendered outside the Menu
                  handleDeleteModalClose();
                  setDeleteModalOpen(true);
                }}
              >
                Delete Pet Profile
              </Button>
            </div>
          </>
        )}
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploadSuccess={refreshPetImages}
          hideTrigger
        />
        <DeleteSubProfileModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          petName={currentPet.name}
          petId={currentPet.id}
        />
      </main>
    </div>
  );
}
