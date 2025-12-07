import type { Route } from "./+types/ranking";
import Header from "../components/header/header";
import rankingIcon from "/assets/icons/rankingIcon.svg";
import "../styles/rankings.css";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableRow from "@mui/material/TableRow";
import rankOneIcon from "/assets/icons/rank_one.svg";
import rankTwoIcon from "/assets/icons/rank_two.svg";
import rankThreeIcon from "/assets/icons/rank_three.svg";
import { authCheck } from "~/utils/authCheck";
import TableCell from "@mui/material/TableCell";
import Paper from "@mui/material/Paper";
import TableBody from "@mui/material/TableBody";
import petPFP from "/assets/icons/defaultPetPFP.svg";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ranking" },
    { name: "description", content: "ranking page" },
  ];
}

interface RankedPet {
  name: string;
  imageUrl: string;
}

export default function Ranking() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  // keeps track of which tab we are on
  const [value, setValue] = useState(0);

  // list to store all global names
  const [globalList, setGlobalList] = useState<RankedPet[]>([]);
  const [provincialList, setProvincialList] = useState<RankedPet[]>([]);
  const [cityList, setCityList] = useState<RankedPet[]>([]);
  let data: RankedPet[] = [];

  // fetches the last uploaded image for a specific pet
  const fetchLastPetImage = async (petId: string): Promise<string> => {
    try {
      const response = await fetch(`http://localhost:8000/pet/${petId}/last-image`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return data.imageUrl || "";
      }
    } catch (error) {
      console.error("Error fetching pet images:", error);
    }
    return "";
  };

  useEffect(() => {
    (async () => {
      try {
        await authCheck();
        setAuthorized(true);
      } catch (e) {
        window.location.href = "/login";
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await authCheck();
        setAuthorized(true);

        // Fetch user profile data for the logged-in user
        const userResponse = await fetch("http://localhost:8000/user/me", {
          credentials: "include",
        });

        // if succeeded, proceed
        if (userResponse.ok) {
          const userData = await userResponse.json();

          // user location comes in the format: "City, Province"
          const userLocation = userData.location;

          // Fetch the json for the global rankings
          const globalResponse = await fetch(
            "http://localhost:8000/posts/rank/global"
          );

          // extract info if response is ok
          if (globalResponse.ok) {
            const globalData = await globalResponse.json();

            // only keep the unique pet ids in the json of all posts (a pet may have more than one post!)
            const onlyPetIds = [
              ...new Set(globalData.map((post: any) => post.petId)),
            ];

            // for every id, get the pet and its last image
            const petData = await Promise.all(
              onlyPetIds.map(async (id: any) => {
                const petResponse = await fetch(
                  `http://localhost:8000/pet/${id}`
                );

                // if we successfully retrieved the data, extract the name and get the image
                if (petResponse.ok) {
                  const pet = await petResponse.json();
                  const imageUrl = await fetchLastPetImage(id);
                  return { name: pet.name, imageUrl };
                } else {
                  // otherwise the response failed, just return nothing
                  return null;
                }
              })
            );

            // filter out nulls, set the list
            setGlobalList(petData.filter((pet) => pet !== null) as RankedPet[]);
          }

          // Fetch the json for the province rankings based on user's location
          const provinceResponse = await fetch(
            `http://localhost:8000/posts/rank/province/${userLocation}`
          );

          // extract info if response is ok
          if (provinceResponse.ok) {
            const provincialData = await provinceResponse.json();

            // only keep the unique pet ids in the json of all posts (a pet may have more than one post!)
            const onlyPetIds = [
              ...new Set(provincialData.map((post: any) => post.petId)),
            ];

            // for every id, get the pet and its last image
            const petData = await Promise.all(
              onlyPetIds.map(async (id: any) => {
                const petResponse = await fetch(
                  `http://localhost:8000/pet/${id}`
                );

                // if we successfully retrieved the data, extract the name and get the image
                if (petResponse.ok) {
                  const pet = await petResponse.json();
                  const imageUrl = await fetchLastPetImage(id);
                  return { name: pet.name, imageUrl };
                } else {
                  // otherwise the response failed, just return nothing
                  return null;
                }
              })
            );

            // filter out nulls, set the list
            setProvincialList(petData.filter((pet) => pet !== null) as RankedPet[]);
          }

          // Fetch the json for the city rankings based on user's location
          const cityResponse = await fetch(
            `http://localhost:8000/posts/rank/city/${userLocation}`
          );

          // extract info if response is ok
          if (cityResponse.ok) {
            const cityData = await cityResponse.json();

            // only keep the unique pet ids in the json of all posts (a pet may have more than one post!)
            const onlyPetIds = [
              ...new Set(cityData.map((post: any) => post.petId)),
            ];

            // for every id, get the pet and its last image
            const petData = await Promise.all(
              onlyPetIds.map(async (id: any) => {
                const petResponse = await fetch(
                  `http://localhost:8000/pet/${id}`
                );

                // if we successfully retrieved the data, extract the name and get the image
                if (petResponse.ok) {
                  const pet = await petResponse.json();
                  const imageUrl = await fetchLastPetImage(id);
                  return { name: pet.name, imageUrl };
                } else {
                  // otherwise the response failed, just return nothing
                  return null;
                }
              })
            );

            // filter out nulls, set the list
            setCityList(petData.filter((pet) => pet !== null) as RankedPet[]);
          }
        }
      } catch (e) {
        console.log("Failed to fetch data for rankings.");
      }
    })();
  }, []);

  if (authorized === null) {
    return null;
  }

  function changeTab(event: React.SyntheticEvent, value: any): void {
    // hightlight selected tab
    setValue(value);
  }

  // gets the correct svg based the rank
  function getBadge(rank: number) {
    if (rank === 1) {
      return rankOneIcon;
    } else if (rank === 2) {
      return rankTwoIcon;
    } else if (rank === 3) {
      return rankThreeIcon;
    }
  }

  // creates a custom svg with the given rank
  function getCustomBadge(rank: number) {
    return (
      <Paper id="customBadge" variant="outlined">
        {rank}
      </Paper>
    );
  }

  // set to the correct data list based on the currently selected tab before rendering
  if (value === 0) {
    data = globalList;
  } else if (value === 1) {
    data = provincialList;
  } else if (value === 2) {
    data = cityList;
  }

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "var{--bg-color}" }}>
        <div className="rankings">
          <img src={rankingIcon} alt="" />
          <h1 id="title">Rankings</h1>
        </div>
        <Tabs
          value={value}
          onChange={changeTab}
          centered={true}
          id="filterBar"
          variant="fullWidth"
        >
          <Tab label="Global" className="filterTab" />
          <Tab label="Provincial" className="filterTab" />
          <Tab label="Local" className="filterTab" />
        </Tabs>
        <Table>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={index}
                className={`rankItem ${index % 2 === 0 ? "evenItem" : "oddItem"}`}
              >
                <TableCell className="badge">
                  {index + 1 < 4 ? (
                    <img src={getBadge(index + 1)} alt="" />
                  ) : (
                    getCustomBadge(index + 1)
                  )}
                </TableCell>
                <TableCell>
                  <div className="petItem">
                    <h1 className="name">{row.name}</h1>
                    <img src={row.imageUrl || petPFP} alt={row.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </>
  );
}
