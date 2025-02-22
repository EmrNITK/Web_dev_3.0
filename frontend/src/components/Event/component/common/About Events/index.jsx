import React from "react";
import "../../../../../assets/css/aboutevents.css";

const About = (props) => {
  console.log("Props:", props);

  const redirectToForm = (heading) => {
    let link;
    switch (heading) {
      case "RoboSoccer":
        link = "https://forms.gle/MZSAEnEvv11XBVyx7";
        break;
      case "Pixar":
        link = "https://forms.gle/5RWNAjqp7UYJ1SDC9";
        break;
      case "Maze Up":
        link = "https://forms.gle/ZY3dkV15YYB583RWA";
        break;
      case "Bit Coding":
        link = "https://forms.gle/SFSvJ848TpZWwTPW8";
        break;
      case "Simulator":
        link = "https://forms.gle/CSagSyCtWpr4Sqgt5";
        break;
      case "SynthAI":
        link = "https://forms.gle/Eh81pS8gFJN2ThsD6";
        break;

      default:
        console.error("Unknown heading:", heading);
        return;
    }
    window.open(link);
  };
  const redirectToForm_rule = (heading) => {
    let link;
    switch (heading) {
      case "RoboSoccer":
        link = "https://drive.google.com/file/d/1AFEnxY75gNZvOg3PiNuVbNWl-a7jmF5X/view?usp=drive_link";
        break;
      case "Pixar":
        link = "https://drive.google.com/file/d/1tTE076A6yubjnk0Ho2ml0TU9xnyHAigZ/view?usp=drive_link";
        break;
      case "Maze Up":
        link = "https://drive.google.com/file/d/1UyyxiNyVL98Pk52Ms5vSHR1E3QnVjzRX/view?usp=drive_link";
        break;
      case "Bit Coding":
        link = "https://drive.google.com/file/d/1BEmSrYGehjxaiHgYNTjP85qg2QAO0SPD/view?usp=drive_link";
        break;
      case "Simulator":
        link = "https://drive.google.com/file/d/14k0VuQubu8wOO4PCaH3Trm5xha9UjS2X/view?usp=drive_link";
        break;
      case "SynthAI":
        link = "https://drive.google.com/file/d/10_8Gamai6ZLx95KbEhYTNmEh_y1aITr6/view?usp=drive_link";
        break;

      default:
        console.error("Unknown heading:", heading);
        return;
    }
    window.open(link);
  };

  return (
    <div className="about-wrapper">
      <div className="max-width about">
        <div className="about-title">{props.heading}</div>
        <div className="about-content">{props.content}</div>
        <div>
          <button onClick={() => redirectToForm(props.heading)} className="register-button">REGISTER NOW</button>
          <button onClick={() => redirectToForm_rule(props.heading)} className="rule-button">RULE BOOK</button>
        </div>
      </div>
    </div>
  );
};

export default About;
