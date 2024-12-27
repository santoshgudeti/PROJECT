import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Mainpage from "./components/Mainpage/Mainpage";
import Sidebar from "./components/Mainpage/Sidebar/Sidebar";
import CandidateFiltering from "./components/CandidateFiltering/CandidateFiltering";
import ResponseDisplay from "./components/Navbar/ResponseDisplay";
import "./App.css";

function App() {
  const [activeComponent, setActiveComponent] = useState("main"); // Track the active page/component
  const [resumeData, setResumeData] = useState([]); // State to store resume data
  const [responseData, setResponseData] = useState(null); // State to store API response data

  const handleComponentChange = (component) => setActiveComponent(component);
 
  // Update ResponseData based on filtered results or processing
  const updateCandidatesData = (newData) => {
    setResponseData(newData);
  };


 

  return (
    <Router>
      <div className="APPA">
       
        <Navbar setResponseData={setResponseData} />

        <Sidebar onComponentChange={handleComponentChange} activeComponent={activeComponent} />

        <div className="main-content">
  
          {activeComponent === "candidateFiltering" && (
            <CandidateFiltering data={resumeData} updateCandidatesData={updateCandidatesData} />
          )}
          {activeComponent === "main" && <Mainpage />}
        
          {responseData && <ResponseDisplay data={responseData} />}
          </div>

              
      </div>
    </Router>
  );
}

export default App;

 
/*   

import React, { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Mainpage from "./components/Mainpage/Mainpage";
import Sidebar from "./components/Mainpage/Sidebar/Sidebar";
import CandidateFiltering from "./components/CandidateFiltering/CandidateFiltering";
import ResponseDisplay from "./components/Navbar/ResponseDisplay";

function App() {
  const [activeComponent, setActiveComponent] = useState("main");
  const [resumeData, setResumeData] = useState([]); // State to store resume data
  const [responseData, setResponseData] = useState(null); // State to store API response data

  const handleComponentChange = (component) => setActiveComponent(component);
  
  const handleResumeUpload = (data) => {
    if (data && data.length > 0) {
      setResumeData(data);
    } else {
      console.warn("No data available from resume upload.");
    }
  };

  // Update ResponseData based on filtered results or processing
  const updateCandidatesData = (newData) => {
    setResponseData(newData);
  };

  return (
    <Router>
      <div className="APPA">
       
        <Navbar setResponseData={setResponseData} />

        <Sidebar onComponentChange={handleComponentChange} activeComponent={activeComponent} />

        <div className="main-content">
  
          {activeComponent === "candidateFiltering" && (
            <CandidateFiltering data={resumeData} updateCandidatesData={updateCandidatesData} />
          )}
          {activeComponent === "main" && <Mainpage />}
        
          {responseData && <ResponseDisplay data={responseData} />}
        </div>
 {activeComponent === "main" && (
          <div className="text-animate">
            {texts.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>
        )} 
       
      </div>
    </Router>
  );
}

export default App;

*/
