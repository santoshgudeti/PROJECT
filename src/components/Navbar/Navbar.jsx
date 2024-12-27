import React, { useRef, useState } from "react";
import SMlogo from "../../assets/SMlogo.png";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import "./Navbar.css";
import axios from "axios";

const Navbar = ({ setResponseData }) => {
  const fileInputRef = useRef(null);
  const jobFileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedJobFiles, setSelectedJobFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    console.log("Selected resumes:", files.map((file) => file.name));
    setSelectedFiles(files);
  };

  const handleJobFileSelect = (event) => {
    const files = Array.from(event.target.files);
    console.log("Selected job descriptions:", files.map((file) => file.name));
    setSelectedJobFiles(files);
  };

  const handleUploadClick = () => {
    console.log("Opening file selection dialog for resumes.");
    fileInputRef.current.click();
  };

  const handleJobUploadClick = () => {
    console.log("Opening file selection dialog for job descriptions.");
    jobFileInputRef.current.click();
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
    console.log("Toggling profile menu. Now:", !showProfileMenu);
  };

  const handleSubmitFiles = async () => {
    if (!selectedFiles.length || !selectedJobFiles.length) {
      alert("Please select both resumes and job descriptions.");
      console.log("Submission failed: Missing files.");
      return;
    }

    setLoading(true);
    console.log("Submitting files. Resumes:", selectedFiles, "Job Descriptions:", selectedJobFiles);
    try {
      const formData = new FormData();

      // Append all selected resumes and job descriptions directly
      selectedFiles.forEach((file) => formData.append("resumes", file));
      selectedJobFiles.forEach((file) =>
        formData.append("job_description", file)
      );

      // Make API request
      const response = await axios.post(
        "http://localhost:5000/api/submit",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Response received from server:", response.data);

      // Update response data if valid results are returned
      setResponseData(response.data?.results || []);
      console.log("responseDATA is", response.data);
    } catch (error) {
      console.error("Error submitting files:", error.message);
      alert("An error occurred during submission. Please try again.");
    } finally {
      setLoading(false);
      console.log("File submission process completed.");
    }
  };

  return (
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img src={SMlogo} alt="Logo" className="navbar-logo" />
          </a>
  
          <div className="navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button className="upload-job-button" onClick={handleJobUploadClick}>
                  Upload Job Description
                </button>
              </li>
              <button className="upload-resume-button" onClick={handleUploadClick}>
                  Upload Resumes
                </button>
              <li className="nav-item">
                <button
                  className="submit-job-button "
                  onClick={handleSubmitFiles}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Loading...
                    </>
                  ) : (
                    "Submit Job"
                  )}
                </button>
              </li>
              <li className="nav-item">
               
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  multiple
                  accept=".pdf"
                />
                <input
                  type="file"
                  ref={jobFileInputRef}
                  style={{ display: "none" }}
                  onChange={handleJobFileSelect}
                  
                  accept=".pdf"
                />
              </li>
            </ul>
          </div>
  
          <div className="profile-container" onClick={toggleProfileMenu}>
            <span className="profile">
              <FaUser style={{ marginRight: "10px" }} />
              Profile
            </span>
            {showProfileMenu && (
              <div className="profile-menu">
                <ul>
                  <li>
                    <FaUser /> Name: Ganga
                  </li>
                  <li>
                    <FaEnvelope /> Email: ganga@example.com
                  </li>
                  <li>
                    <FaPhone /> Contact: +1234567890
                  </li>
                  <li>
                    <FaBuilding /> Company: Example Inc.
                  </li>
                  <li>
                    <FaCog /> Settings
                  </li>
                  <li>
                    <FaSignOutAlt /> Sign Out
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  };
  
  export default Navbar;
  




/*   
This code is working dont disturb it 
import React, { useRef, useState } from "react";
import SMlogo from "../../assets/SMlogo.png";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import "./Navbar.css";
import axios from "axios";

const Navbar = ({ setResponseData }) => {
  const fileInputRef = useRef(null);
  const jobFileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedJobFiles, setSelectedJobFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    console.log("Selected resumes:", files.map((file) => file.name));
    setSelectedFiles(files);
  };

  const handleJobFileSelect = (event) => {
    const files = Array.from(event.target.files);
    console.log("Selected job descriptions:", files.map((file) => file.name));
    setSelectedJobFiles(files);
  };

  const handleUploadClick = () => {
    console.log("Opening file selection dialog for resumes.");
    fileInputRef.current.click();
  };

  const handleJobUploadClick = () => {
    console.log("Opening file selection dialog for job descriptions.");
    jobFileInputRef.current.click();
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
    console.log("Toggling profile menu. Now:", !showProfileMenu);
  };

  const handleSubmitFiles = async () => {
    if (!selectedFiles.length || !selectedJobFiles.length) {
      alert("Please select both resumes and job descriptions.");
      console.log("Submission failed: Missing files.");
      return;
    }

    setLoading(true);
    console.log("Submitting files. Resumes:", selectedFiles, "Job Descriptions:", selectedJobFiles);
    try {
      const formData = new FormData();

      // Append all selected resumes and job descriptions directly
      selectedFiles.forEach((file) => formData.append("resumes", file));
      selectedJobFiles.forEach((file) =>
        formData.append("job_description", file)
      );

      // Make API request
      const response = await axios.post(
        "http://localhost:5000/api/submit",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Response received from server:", response.data);

      // Update response data if valid results are returned
      setResponseData(response.data?.results || []);
    } catch (error) {
      console.error("Error submitting files:", error.message);
      alert("An error occurred during submission. Please try again.");
    } finally {
      setLoading(false);
      console.log("File submission process completed.");
    }
  };

  return (
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img src={SMlogo} alt="Logo" className="navbar-logo" />
          </a>
  
          <div className="navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button className="upload-job-button" onClick={handleJobUploadClick}>
                  Upload Job Description
                </button>
              </li>
              <button className="upload-resume-button" onClick={handleUploadClick}>
                  Upload Resumes
                </button>
              <li className="nav-item">
                <button
                  className="submit-job-button "
                  onClick={handleSubmitFiles}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Loading...
                    </>
                  ) : (
                    "Submit Job"
                  )}
                </button>
              </li>
              <li className="nav-item">
               
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  multiple
                  accept=".pdf"
                />
                <input
                  type="file"
                  ref={jobFileInputRef}
                  style={{ display: "none" }}
                  onChange={handleJobFileSelect}
                  
                  accept=".pdf"
                />
              </li>
            </ul>
          </div>
  
          <div className="profile-container" onClick={toggleProfileMenu}>
            <span className="profile">
              <FaUser style={{ marginRight: "10px" }} />
              Profile
            </span>
            {showProfileMenu && (
              <div className="profile-menu">
                <ul>
                  <li>
                    <FaUser /> Name: Ganga
                  </li>
                  <li>
                    <FaEnvelope /> Email: ganga@example.com
                  </li>
                  <li>
                    <FaPhone /> Contact: +1234567890
                  </li>
                  <li>
                    <FaBuilding /> Company: Example Inc.
                  </li>
                  <li>
                    <FaCog /> Settings
                  </li>
                  <li>
                    <FaSignOutAlt /> Sign Out
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  };
  
  export default Navbar;
  



*/