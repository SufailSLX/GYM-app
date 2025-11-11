import React from "react";
import "./Loader.css";

const Loader = () => {
  return (
    <div className="loader">
      <div className="circle">
        <div className="dot"></div>
        <div className="outline"></div>
      </div>
      <div className="circle">
        <div className="dot"></div>
        <div className="outline"></div>
      </div>
      <div className="circle">
        <div className="dot"></div>
        <div className="outline"></div>
      </div>
      <div className="circle">
        <div className="dot"></div>
        <div className="outline"></div>
      </div>
    </div>
  );
};

export default Loader;
