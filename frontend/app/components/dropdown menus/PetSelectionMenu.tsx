import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useEffect, useState } from "react";
import "./styles.css";
import {
  menuStyle,
  menuItemStyle,
  buttonStyle,
  mobileMenuStyle,
  mobileMenuItemStyle,
} from "./mui-styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export function PetSelectionMenu({
  onPetChange,
}: {
  onPetChange?: (petId: string, petName: string) => void;
} = {}) {
  const matches = useMediaQuery("(min-width: 600px)");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPet, setSelectedPet] = useState<string>("Select Pet");
  const [pets, setPets] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const open = Boolean(anchorEl);

  // Fetch pets from backend when component mounts
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch("http://localhost:8000/pets", {
          method: "GET",
          credentials: "include", // Include cookies for authentication
        });

        if (response.ok) {
          const data = await response.json();
          // Map backend data to the format we need
          const formattedPets = data.map((pet: any) => ({
            id: pet.id,
            name: pet.name || "Unnamed Pet",
          }));
          setPets(formattedPets);
        } else {
          console.error("Failed to fetch pets:", response.statusText);
          setPets([]);
        }
      } catch (error) {
        console.error("Error fetching pets:", error);
        setPets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePetSelect = (petId: string, petName: string) => {
    setSelectedPet(petName);
    handleClose();
    onPetChange?.(petId, petName);
  };

  return (
    <div>
      <Button
        className="buttonStyle"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={buttonStyle}
        disabled={loading}
      >
        {loading ? "Loading..." : selectedPet}
      </Button>
      <Menu
        className="menu"
        id="pet-selection-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: matches ? { sx: menuStyle } : { sx: mobileMenuStyle },
          list: {
            "aria-labelledby": "basic-button",
          },
        }}
      >
        {pets.length > 0 ? (
          pets.map((pet) => (
            <MenuItem
              key={pet.id}
              sx={menuItemStyle}
              onClick={() => handlePetSelect(pet.id, pet.name)}
            >
              {pet.name}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled style={{ fontSize: "inherit", color: "inherit" }}>
            No pets found
          </MenuItem>
        )}
      </Menu>
    </div>
  );
}
