import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useEffect, useState } from "react";
import { GetCity, GetState } from "react-country-state-city";
import './styles.css'
import { menuStyle, menuItemStyle, buttonStyle, mobileMenuStyle } from "./mui-styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export function LocationMenu({
  onLocationChange,
}: {
  onLocationChange?: (loc: {
    stateName?: string | null;
    cityName?: string | null;
  }) => void;
}) {
  const matches = useMediaQuery("(min-width: 600px)");
  const [state, setState] = useState<string | number | null>(null);
  const [city, setCity] = useState<string | number | null>(null);
  const [stateList, setStateList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  // Use separate anchors so opening one menu doesn't open the others
  const [anchorState, setAnchorState] = useState<null | HTMLElement>(
    null
  );
  const [currentState, setcurrentState] = useState<string | number | null>(
    null
  );
  const [anchorCity, setAnchorCity] = useState<null | HTMLElement>(null);
  const openState = Boolean(anchorState);
  const openCity = Boolean(anchorCity);

  const handleStateClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // ensure city menu is closed when opening state menu
    setAnchorCity(null);
    setAnchorState(event.currentTarget);
  };

  const handleStateClose = () => setAnchorState(null);

  const handleCityClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // don't open city menu if no province selected
    if (!currentState) return;
    // ensure state menu is closed when opening city menu
    setAnchorState(null);
    setAnchorCity(event.currentTarget);
  };

  const handleCityClose = () => setAnchorCity(null);

  useEffect(() => {
    GetState(parseInt("39")).then((result) => {
      setStateList(result || []);
    });
  }, ["39"]);

  useEffect(() => {
    if (currentState) {
      GetCity(parseInt("39"), parseInt(currentState as any)).then((result) => {
        setCitiesList(result || []);
      });
    } else {
      // clear cities and selected city when no province chosen
      setCitiesList([]);
      setCity(null);
      setAnchorCity(null);
    }
  }, [currentState]);

  return (
    <>
      <div>
        <Button
          aria-controls={openState ? "state-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={openState ? "true" : undefined}
          onClick={handleStateClick}
          sx={buttonStyle}
        >
          {/* Select a Province */}
          {stateList.find((c: any) => c.id == state)?.name ||
            "Select a province"}
        </Button>
        <Menu
          className="menu"
          id="state-menu"
          anchorEl={anchorState}
          open={openState}
          onClose={handleStateClose}
          slotProps={{
paper: matches ? { sx: menuStyle  } : { sx: mobileMenuStyle  },
            list: {
              "aria-labelledby": "basic-button",
            },
          }}
        >
          {stateList.map((_state: any) => (
            <MenuItem
              sx={menuItemStyle}
              style={{fontSize: '2em'}}
              key={_state.id}
              onClick={() => {
                setState(_state.id);
                setcurrentState(_state.id);
                // clear any previously selected city
                setCity(null);
                setCitiesList([]);
                handleStateClose();
                // notify parent about selected province (clear city)
                onLocationChange?.({
                  stateName: _state.name,
                  cityName: null,
                });
              }}
            >
              {_state.name}
            </MenuItem>
          ))}
        </Menu>
        <br />
        <Button
          aria-controls={openCity ? "city-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={openCity ? "true" : undefined}
          onClick={handleCityClick}
          disabled={!currentState}
          aria-disabled={!currentState}
          sx={buttonStyle}
        >
          {/* Select a City */}
          {!currentState
            ? "Select a province first"
            : citiesList.find((c: any) => c.id == city)?.name || "Select a city"}
        </Button>

        <Menu
          className="menu"
          id="city-menu"
          anchorEl={anchorCity}
          open={openCity}
          onClose={handleCityClose}
          slotProps={{
            paper: {
              sx: menuStyle,
            },
            list: {
              "aria-labelledby": "basic-button",
            },
          }}
        >
          {citiesList.map((_city: any) => (
            <MenuItem
              sx={menuItemStyle}
              style={{fontSize: '2em'}}
              key={_city.id}
              onClick={() => {
                setCity(_city.id);
                handleCityClose();
                // notify parent about selected city
                onLocationChange?.({
                  stateName: stateList.find((s) => s.id == state)?.name ?? null,
                  cityName: _city.name,
                });
              }}
            >
              {_city.name}
            </MenuItem>
          ))}
        </Menu>
      </div>
    </>
  );
}
