import rankOneIcon from "/assets/icons/rankOne.svg";
import rankTwoIcon from "/assets/icons/rankTwo.svg";

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
  const rankThreeIcon = "/assets/icons/rankThree.svg";
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
