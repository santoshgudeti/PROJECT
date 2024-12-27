import React, { useState } from "react";
import "./ResponseDisplay.css";

const ResponseDisplay = ({ data }) => {
  console.log("Received data:", data);

  if (!data || data.length === 0) {
    console.log("No data available to display.");
    return <p>No data available. Upload files to see the results.</p>;
  }

  const sortedData = data
    .map((result) => {
      const matchingResult = result.matchingResult?.[0]?.["Resume Data"] || {};
      const matchingPercentage = matchingResult?.["Matching Percentage"] || 0;
      console.log(`Processing result: ${JSON.stringify(result)}`);
      return { ...result, matchingResult, matchingPercentage };
    })
    .sort((a, b) => b.matchingPercentage - a.matchingPercentage);

  console.log("Sorted data:", sortedData);

  // State for expanding/collapsing lists
  const [expandedSkills, setExpandedSkills] = useState({});
  const [expandedDesignations, setExpandedDesignations] = useState({});

  const toggleExpand = (index, type) => {
    if (type === "skills") {
      setExpandedSkills((prev) => ({ ...prev, [index]: !prev[index] }));
    } else if (type === "designations") {
      setExpandedDesignations((prev) => ({ ...prev, [index]: !prev[index] }));
    }
  };

  const renderList = (items = [], isExpanded, toggle) => {
    const maxItems = 5;
    const displayItems = isExpanded ? items : items.slice(0, maxItems);
    return (
      <>
        <ul className="bullet-list">
          {displayItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        {items.length > maxItems && !isExpanded && (
          <span className="more-link" onClick={toggle}>
            More...
          </span>
        )}
        {isExpanded && (
          <span className="less-link" onClick={toggle}>
            Show Less
          </span>
        )}
      </>
    );
  };

  return (
    <div className="table-container responsedisplay">
      <h3 className="MR">Matching Results</h3>
      <div className="table-responsive rd1">
        <table className="table table-hover table-dark rd2">
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
            {sortedData.map((result, index) => {
              const resumeData = result.matchingResult || {};
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{resumeData?.name || "N/A"}</td>
                  <td className="email-column">{resumeData?.email || "N/A"}</td>
                  <td>{resumeData?.total_experience || "0"} years</td>
                  <td>{resumeData?.mobile_number || "N/A"}</td>
                  <td>
                    {renderList(
                      resumeData?.skills || ["N/A"],
                      expandedSkills[index],
                      () => toggleExpand(index, "skills")
                    )}
                  </td>
                  <td>
                    {renderList(
                      resumeData?.designation || ["N/A"],
                      expandedDesignations[index],
                      () => toggleExpand(index, "designations")
                    )}
                  </td>
                  <td>{resumeData?.degree?.join(", ") || "N/A"}</td>
                  <td>{resumeData?.company_names?.join(", ") || "N/A"}</td>
                  <td>{result.matchingPercentage || "0"}%</td>
                  <td>
                    <a
                      href={`http://localhost:5000${resumeData.path || `/uploads/resumes/${result.resume}`}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
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

export default ResponseDisplay;


/*
import React, { useState, useEffect } from "react";
import "./ResponseDisplay.css";
import axios from 'axios'; // or import other methods like fetch

const ResponseDisplay = ({ data }) => {
  console.log("Received data:", data);

  const [localResumes, setLocalResumes] = useState([]);
  const [expandedSkills, setExpandedSkills] = useState([]);
  const [expandedDesignations, setExpandedDesignations] = useState([]);

  useEffect(() => {
    axios.get('/api/local-resumes')
      .then(response => {
        if (response.data && response.data.resumes) {
          setLocalResumes(response.data.resumes);
        } else {
          console.warn('No resumes found in the response.');
        }
      })
      .catch(error => {
        console.error('Error fetching local resumes:', error.message);
        setLocalResumes([]);  // Set empty state to handle the error gracefully
      });
  }, []);
  
  

  if (!data || data.length === 0) {
    console.log("No data available to display.");
    return <p>No data available. Upload files to see the results.</p>;
  }

  const sortedData = data
    .map((result) => {
      const matchingResult = result.matchingResult?.[0]?.["Resume Data"] || {};
      const matchingPercentage = matchingResult?.["Matching Percentage"] || 0;
      return { ...result, matchingResult, matchingPercentage };
    })
    .sort((a, b) => b.matchingPercentage - a.matchingPercentage);

  console.log("Sorted data:", sortedData);

  const toggleExpand = (index, type) => {
    if (type === "skills") {
      setExpandedSkills(prev => ({ ...prev, [index]: !prev[index] }));
    } else if (type === "designations") {
      setExpandedDesignations(prev => ({ ...prev, [index]: !prev[index] }));
    }
  };

  const renderList = (items = [], isExpanded, toggle) => {
    const maxItems = 5;
    const displayItems = isExpanded ? items : items.slice(0, maxItems);
    return (
      <>
        <ul className="bullet-list">
          {displayItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        {items.length > maxItems && !isExpanded && (
          <span className="more-link" onClick={toggle}>
            More...
          </span>
        )}
        {isExpanded && (
          <span className="less-link" onClick={toggle}>
            Show Less
          </span>
        )}
      </>
    );
  };

  return (
    <div className="table-container responsedisplay">
      <h3 className="MR">Matching Results</h3>
      <div className="table-responsive rd1">
        <table className="table table-hover table-dark rd2">
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
            {sortedData.map((result, index) => {
              const resumeData = result.matchingResult || {};

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{resumeData?.name || "N/A"}</td>
                  <td className="email-column">{resumeData?.email || "N/A"}</td>
                  <td>{resumeData?.total_experience || "0"} years</td>
                  <td>{resumeData?.mobile_number || "N/A"}</td>
                  <td>
                    {renderList(
                      resumeData?.skills || ["N/A"],
                      expandedSkills[index],
                      () => toggleExpand(index, "skills")
                    )}
                  </td>
                  <td>
                    {renderList(
                      resumeData?.designation || ["N/A"],
                      expandedDesignations[index],
                      () => toggleExpand(index, "designations")
                    )}
                  </td>
                  <td>{resumeData?.degree?.join(", ") || "N/A"}</td>
                  <td>{resumeData?.company_names?.join(", ") || "N/A"}</td>
                  <td>{result.matchingPercentage || "0"}%</td>
                  <td>
                    <a
                      href={localResumes.find(file => file.filename === result.resume)?.path || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
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

export default ResponseDisplay;
*/