import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { FaExpand, FaCompress } from "react-icons/fa";
import "./CandidateFiltering.css";

const CandidateFiltering = () => {
  const [candidates, setCandidates] = useState([]);
  const [expandedLists, setExpandedLists] = useState({});
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("apiResponseUpdated", (newResponse) => {
      setCandidates((prevCandidates) => {
        const exists = prevCandidates.some(
          (candidate) =>
            candidate.resumeId === newResponse.resumeId &&
            candidate.jobDescriptionId === newResponse.jobDescriptionId
        );

        if (exists) {
          console.log("Duplicate record detected and ignored:", newResponse);
          return prevCandidates;
        }

        return [newResponse, ...prevCandidates];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/candidate-filtering"
        );
        const data = await response.json();

        const uniqueCandidates = data.filter((candidate, index, self) => {
          return (
            index ===
            self.findIndex(
              (c) =>
                c.resumeId === candidate.resumeId &&
                c.jobDescriptionId === candidate.jobDescriptionId
            )
          );
        });

        console.log("Fetched candidates:", uniqueCandidates);
        setCandidates(uniqueCandidates);
      } catch (error) {
        console.error("Error fetching candidate data:", error.message);
      }
    };

    fetchCandidates();
  }, []);

  const handleResumeLink = (resumeId) => {
    return `http://localhost:5000/api/resumes/${resumeId}`;
  };

  const sortedCandidates = candidates
    .map((candidate) => ({
      ...candidate,
      matchingPercentage:
        candidate.matchingResult?.[0]?.["Resume Data"]?.["Matching Percentage"] ||
        0,
    }))
    .sort((a, b) => b.matchingPercentage - a.matchingPercentage);

  const toggleExpand = (index, type) => {
    setExpandedLists((prev) => ({
      ...prev,
      [`${index}-${type}`]: !prev[`${index}-${type}`],
    }));
  };

  const renderListWithExpand = (items, index, type) => {
    const maxItems = 3;
    const isExpanded = expandedLists[`${index}-${type}`];
    const visibleItems = isExpanded ? items : items.slice(0, maxItems);

    return (
      <>
        <ul className="bullet-list">
          {visibleItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        {items.length > maxItems && (
          <span
            className="toggle-link"
            onClick={() => toggleExpand(index, type)}
          >
            {isExpanded ? "Show Less" : "More..."}
          </span>
        )}
      </>
    );
  };

  return (
    <div
      className={`table-container CandidateFiltering ${
        isFullScreen ? "fullscreen" : ""
      }`}
    >
      <div className="table-header">
        <h3>All Candidates Results</h3>
        <div className="controls">
          <button
            className="screen-toggle"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? (
              <>
                <FaCompress style={{ marginRight: "5px" }} />
                Exit Full Screen
              </>
            ) : (
              <>
                <FaExpand style={{ marginRight: "5px" }} />
                Full Screen
              </>
            )}
          </button>
        </div>
      </div>
      <div className="table-responsive cf1">
        <table className="table table-hover table-dark cf2">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Email</th>
              <th>Total Experience</th>
              <th>Mobile Number</th>
              <th>Skills</th>
              <th>Designation</th>
              <th>Degree</th>
              <th>Company Names</th>
              <th>Matching Percentage</th>
              <th>Resume</th>
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.map((candidate, index) => {
              const resumeData = candidate.matchingResult?.[0]?.["Resume Data"] || {};
              return (
                <tr key={candidate._id || index}>
                  <td>{index + 1}</td>
                  <td>{resumeData.name || "N/A"}</td>
                  <td>{resumeData.email || "N/A"}</td>
                  <td>{resumeData.total_experience || "0"} years</td>
                  <td>{resumeData.mobile_number || "N/A"}</td>
                  <td>
                    {resumeData.skills?.length
                      ? renderListWithExpand(resumeData.skills, index, "skills")
                      : "N/A"}
                  </td>
                  <td>
                    {resumeData.designation?.length
                      ? renderListWithExpand(resumeData.designation, index, "designation")
                      : "N/A"}
                  </td>
                  <td>{resumeData.degree?.join(", ") || "N/A"}</td>
                  <td>{resumeData.company_names?.join(", ") || "N/A"}</td>
                  <td>{resumeData["Matching Percentage"] || "0"}%</td>
                  <td>
                    <a 
                      href={handleResumeLink(candidate.resumeId?._id)} 
                      target="_blank"
                      className="view-link"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                    <a 
                      href={`${handleResumeLink(candidate.resumeId?._id)}?download=true`} 
                      target="_blank"
                      className="download-link"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidateFiltering;




/* import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { FaExpand, FaCompress } from "react-icons/fa";
import "./CandidateFiltering.css";

const CandidateFiltering = () => {
  const [candidates, setCandidates] = useState([]);
  const [expandedLists, setExpandedLists] = useState({});
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [userDefinedTop, setUserDefinedTop] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("apiResponseUpdated", (newResponse) => {
      setCandidates((prevCandidates) => {
        const exists = prevCandidates.some(
          (candidate) =>
            candidate.resumeId === newResponse.resumeId &&
            candidate.jobDescriptionId === newResponse.jobDescriptionId
        );

        if (exists) {
          console.log("Duplicate record detected and ignored:", newResponse);
          return prevCandidates;
        }

        return [newResponse, ...prevCandidates];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/candidate-filtering"
        );
        const data = await response.json();

        const uniqueCandidates = data.filter((candidate, index, self) => {
          return (
            index ===
            self.findIndex(
              (c) =>
                c.resumeId === candidate.resumeId &&
                c.jobDescriptionId === candidate.jobDescriptionId
            )
          );
        });

        console.log("Fetched candidates:", uniqueCandidates);

        setCandidates(uniqueCandidates);
      } catch (error) {
        console.error("Error fetching candidate data:", error.message);
      }
    };

    fetchCandidates();
  }, []);

  const handleResumeLink = (resumeId) => {
    return `http://localhost:5000/api/resumes/${resumeId}`;
  };

  const sortedCandidates = candidates
    .map((candidate) => ({
      ...candidate,
      matchingPercentage:
        candidate.matchingResult?.[0]?.["Resume Data"]?.["Matching Percentage"] ||
        0,
    }))
    .sort((a, b) => b.matchingPercentage - a.matchingPercentage);

  const toggleExpand = (index, type) => {
    setExpandedLists((prev) => ({
      ...prev,
      [`${index}-${type}`]: !prev[`${index}-${type}`],
    }));
  };

  const renderListWithExpand = (items, index, type) => {
    const maxItems = 3;
    const isExpanded = expandedLists[`${index}-${type}`];
    const visibleItems = isExpanded ? items : items.slice(0, maxItems);

    return (
      <>
        <ul className="bullet-list">
          {visibleItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        {items.length > maxItems && (
          <span
            className="toggle-link"
            onClick={() => toggleExpand(index, type)}
          >
            {isExpanded ? "Show Less" : "More..."}
          </span>
        )}
      </>
    );
  };

  const isCandidateSelected = (id) =>
    selectedCandidates.some((candidate) => candidate._id === id);

  const toggleCandidateSelection = (id) => {
    setSelectedCandidates((prev) => {
      const exists = prev.some((candidate) => candidate._id === id);
      if (exists) {
        return prev.filter((candidate) => candidate._id !== id);
      } else {
        const candidate = candidates.find((c) => c._id === id);
        return candidate ? [...prev, candidate] : prev;
      }
    });
  };

  const selectTop = (count) => {
    const topCandidates = sortedCandidates.slice(0, count);
    const alreadySelected = topCandidates.every((candidate) =>
      isCandidateSelected(candidate._id)
    );

    if (alreadySelected) {
      setSelectedCandidates((prev) =>
        prev.filter(
          (candidate) =>
            !topCandidates.some((topCandidate) => topCandidate._id === candidate._id)
        )
      );
    } else {
      setSelectedCandidates((prev) => [
        ...prev,
        ...topCandidates.filter(
          (topCandidate) =>
            !prev.some((candidate) => candidate._id === topCandidate._id)
        ),
      ]);
    }
  };

  const handleUserDefinedSelection = () => {
    const count = parseInt(userDefinedTop, 10);
    if (!isNaN(count) && count > 0 && count <= sortedCandidates.length) {
      selectTop(count);
    }
  };

  const handleDownload = () => {
    const selectedResumes = selectedCandidates.map(
      (candidate) => handleResumeLink(candidate._id)
    );

    if (selectedResumes.length === 0) {
      console.log("No resumes selected for download.");
      return;
    }

    selectedResumes.forEach((url) => {
      if (url) {
        const newTab = window.open(url, "_blank", "noopener,noreferrer");
        if (!newTab) {
          console.error("Failed to open a new tab. Please check browser settings.");
        }
      }
    });

    console.log("Resumes opened in new tabs:", selectedResumes);
  };

  return (
    <div
      className={`table-container CandidateFiltering ${
        isFullScreen ? "fullscreen" : ""
      }`}
    >
      <div className="table-header">
        <h3>All Candidates Results</h3>
        <div className="controls">
          <button
            className="Selection"
            onClick={() => setIsSelectionMode(!isSelectionMode)}
          >
            {isSelectionMode ? "Cancel Selection" : "Select Resumes"}
          </button>
          {isSelectionMode && (
            <>
              <button className="Select10" onClick={() => selectTop(10)}>
                {sortedCandidates
                  .slice(0, 10)
                  .every((candidate) => isCandidateSelected(candidate._id))
                  ? "Unselect Top 10"
                  : "Select Top 10"}
              </button>
              <input
                className="NUMBER"
                type="number"
                placeholder="Enter number"
                value={userDefinedTop}
                onChange={(e) => setUserDefinedTop(e.target.value)}
              />
              <button className="select-topN" onClick={handleUserDefinedSelection}>
                Submit {userDefinedTop || ""}
              </button>
              <button
                className="downloadselected"
                onClick={handleDownload}
                disabled={selectedCandidates.length === 0}
              >
                Download Resumes
              </button>
            </>
          )}
          <button
            className="screen-toggle"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? (
              <>
                <FaCompress style={{ marginRight: "5px" }} />
                Exit Full Screen
              </>
            ) : (
              <>
                <FaExpand style={{ marginRight: "5px" }} />
                Full Screen
              </>
            )}
          </button>
        </div>
      </div>
      <div className="table-responsive cf1">
        <table className="table table-hover table-dark cf2">
          <thead>
            <tr>
              {isSelectionMode && <th>Select</th>}
              <th>Rank</th>
              <th>Name</th>
              <th>Email</th>
              <th>Total Experience</th>
              <th>Mobile Number</th>
              <th>Skills</th>
              <th>Designation</th>
              <th>Degree</th>
              <th>Company Names</th>
              <th>Matching Percentage</th>
              <th>Resume</th>
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.map((candidate, index) => {
              const resumeData = candidate.matchingResult?.[0]?.["Resume Data"] || {};
              return (
                <tr key={candidate._id || index}>
                  {isSelectionMode && (
                    <td>
                      <input
                        type="checkbox"
                        checked={isCandidateSelected(candidate._id)}
                        onChange={() => toggleCandidateSelection(candidate._id)}
                      />
                    </td>
                  )}
                  <td>{index + 1}</td>
                  <td>{resumeData.name || "N/A"}</td>
                  <td>{resumeData.email || "N/A"}</td>
                  <td>{resumeData.total_experience || "0"} years</td>
                  <td>{resumeData.mobile_number || "N/A"}</td>
                  <td>
                    {resumeData.skills?.length
                      ? renderListWithExpand(resumeData.skills, index, "skills")
                      : "N/A"}
                  </td>
                  <td>
                    {resumeData.designation?.length
                      ? renderListWithExpand(resumeData.designation, index, "designation")
                      : "N/A"}
                  </td>
                  <td>{resumeData.degree?.join(", ") || "N/A"}</td>
                  <td>{resumeData.company_names?.join(", ") || "N/A"}</td>
                  <td>{resumeData["Matching Percentage"] || "0"}%</td>
                  <td>
                    <a
                      href={handleResumeLink(candidate.resumeId?._id)} // Use resumeId._id
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Resume
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidateFiltering;
*/