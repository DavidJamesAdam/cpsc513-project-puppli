import rankOneIcon from "../../assets/icons/rank_one.svg";
import rankTwoIcon from "../../assets/icons/rank_two.svg";
import rankThreeIcon from "../../assets/icons/rank_three.svg";

import "./profileBanner.css";

interface ProfileBannerProps {
  first: number;
  second: number;
  third: number;
}

export default function ProfileBanner({
  first,
  second,
  third,
}: ProfileBannerProps) {
  return (
    <div className="banner">
      <p className="award">
        <img src={rankOneIcon} alt="example.svg" className="icon" />
        <span> : {first}</span>
      </p>
      <p className="award">
        <img src={rankTwoIcon} alt="example.svg" className="icon" />
        <span> : {second}</span>
      </p>
      <p className="award">
        <img src={rankThreeIcon} alt="example.svg" className="icon" />
        <span> : {third}</span>
      </p>
    </div>
  );
}
