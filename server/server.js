const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const bodyParser = require('body-parser');
const { Schema } = mongoose;
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs'); // File system module
const path = require('path'); // Path module
const PDFDocument = require('pdfkit');

// Initialize Express app
const app = express();
const PORT = 5000;

// Create an HTTP server to support WebSockets
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// Connect to MongoDB
mongoose
  .connect('mongodb+srv://ApplicationTrackingSystem:ApplicationTrackingSystem@skillmatrix.ntv9d.mongodb.net/?retryWrites=true&w=majority&appName=SkillMatrix')
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Define Mongoose Schemas
const ApiResponseSchema = new Schema({
  resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
  jobDescriptionId: { type: Schema.Types.ObjectId, ref: 'JobDescription', required: true },
  matchingResult: Object,
  createdAt: { type: Date, default: Date.now },
});

const ResumeSchema = new Schema({
  title: String,
  pdf: Buffer,
  filename: String,
  uploadedAt: { type: Date, default: Date.now },
});

const JobDescriptionSchema = new Schema({
  title: String,
  description: Buffer,
  filename: String,
  uploadedAt: { type: Date, default: Date.now },
});

const Resume = mongoose.model('Resume', ResumeSchema);
const JobDescription = mongoose.model('JobDescription', JobDescriptionSchema);
const ApiResponse = mongoose.model('ApiResponse', ApiResponseSchema);

// Multer Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('WebSocket client connected.');
  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected.');
  });
});

// Emit event on new ApiResponse creation
const emitApiResponseUpdate = (newResponse) => {
  io.emit('apiResponseUpdated', newResponse);
};

// Ensure directories exist
const resumeDirectory = path.join(__dirname, 'uploads/resumes');
const jobDescriptionDirectory = path.join(__dirname, 'uploads/job_descriptions');

if (!fs.existsSync(resumeDirectory)) {
  fs.mkdirSync(resumeDirectory, { recursive: true });
}

if (!fs.existsSync(jobDescriptionDirectory)) {
  fs.mkdirSync(jobDescriptionDirectory, { recursive: true });
}


// Serve static files for resumes
app.use('/uploads/resumes', express.static(resumeDirectory));
app.use('/uploads/job_descriptions', express.static(jobDescriptionDirectory));

app.post('/api/submit', upload.fields([{ name: 'resumes' }, { name: 'job_description' }]), async (req, res) => {
  try {
    const { files } = req;

    if (!files || !files.resumes || !files.job_description) {
      return res.status(400).json({ error: 'Resumes and job descriptions are required.' });
    }

    const results = [];
    const savedJobDescriptions = {};

    // Helper function for saving files and handling API responses
    const processFiles = async (fileType, filesArray, savedFilesMap, saveModel) => {
      for (const file of filesArray) {
        if (!savedFilesMap[file.originalname]) {
          const savedFile = new saveModel({
            title: file.originalname,
            pdf: file.buffer,
            filename: file.originalname,
          });
          await savedFile.save();
          savedFilesMap[file.originalname] = savedFile._id;
        }

        const filePath = path.join(fileType === 'resume' ? resumeDirectory : jobDescriptionDirectory, file.originalname);
        fs.writeFileSync(filePath, file.buffer);
      }
    };

    // Save job descriptions
    await processFiles('job_description', files.job_description, savedJobDescriptions, JobDescription);

    // Process resumes
    for (const resume of files.resumes) {
      const savedResume = new Resume({
        title: resume.originalname,
        pdf: resume.buffer,
        filename: resume.originalname,
      });
      await savedResume.save();

      // Save locally
      const resumePath = path.join(resumeDirectory, resume.originalname);
      fs.writeFileSync(resumePath, resume.buffer);

      for (const jobDescription of files.job_description) {
        const jobDescriptionId = savedJobDescriptions[jobDescription.originalname];

        const existingApiResponse = await ApiResponse.findOne({
          resumeId: savedResume._id,
          jobDescriptionId: jobDescriptionId,
        });

        if (existingApiResponse) {
          console.log(`Duplicate found for Resume: ${resume.originalname} and Job Description: ${jobDescription.originalname}. Skipping.`);
          continue;
        }

        const formData = new FormData();
        formData.append('resumes', resume.buffer, resume.originalname);
        formData.append('job_description', jobDescription.buffer, jobDescription.originalname);

        try {
          const apiResponse = await axios.post(
            'http://13.201.34.119:8001/candidates',
            formData,
            { headers: formData.getHeaders() }
          );

          if (apiResponse.data && apiResponse.data['POST Response']) {
            const savedResponse = new ApiResponse({
              resumeId: savedResume._id,
              jobDescriptionId: jobDescriptionId,
              matchingResult: apiResponse.data['POST Response'],
            });
            await savedResponse.save();
            emitApiResponseUpdate(savedResponse);
            results.push({
              resume: resume.originalname,
              jobDescription: jobDescription.originalname,
              matchingResult: apiResponse.data['POST Response'],
            });
          } else {
            console.warn(`No matching data for Resume: ${resume.originalname} and Job Description: ${jobDescription.originalname}`);
          }
        } catch (error) {
          console.error(`Error with external API for ${resume.originalname}:`, error.message);
        }
      }
    }

    res.status(200).json({ message: 'Files processed and stored successfully.', results });
  } catch (error) {
    handleError(res, error, 'Failed to process files.');
  }
});


// Endpoint to fetch all API responses
app.get('/api/candidate-filtering', async (req, res) => {
  try {
    const responses = await ApiResponse.find()
      .populate('resumeId', 'title filename')
      .populate('jobDescriptionId', 'title filename')
      .sort({ createdAt: -1 });

    res.status(200).json(responses);
  } catch (error) {
    console.error('Error fetching candidate filtering data:', error.message);
    res.status(500).json({ error: 'Failed to fetch candidate filtering data.' });
  }
});

// New GET endpoint for resume PDF files
// Endpoint to fetch and convert resume data into PDF
// Serve the PDF for a given resume ID
app.get('/api/resumes/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { download } = req.query; // Check for "download" query parameter

    // Validate the ObjectId
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ error: 'Invalid resume ID.' });
    }

    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    // Decode Base64 to binary
    const binaryPdf = Buffer.from(resume.pdf, 'base64');
    const disposition = download === 'true' 
    ? `attachment; filename="${resume.filename}"`
    : `inline; filename="${resume.filename}"`;
    // Serve the PDF directly
    res.writeHead(200, {
     

      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'Content-Length': binaryPdf.length,
    });

    res.end(binaryPdf); // Send the binary PDF data to the client
  } catch (error) {
    console.error('Error retrieving resume PDF:', error.message);
    res.status(500).json({ error: 'Failed to retrieve resume PDF.' });
  }
  
});


// Endpoint to fetch all stored resume in locally filenames


app.get('/api/local-resumes', (req, res) => {
  try {
    const resumeDirectory = path.join(__dirname, 'uploads/resumes');
    const allFiles = fs.readdirSync(resumeDirectory);

    if (allFiles.length === 0) {
      return res.status(404).json({ error: 'No resumes found.' });
    }

    const fileDetails = allFiles.map((filename) => ({
      filename,
      path: `/uploads/resumes/${filename}`,
    }));

    res.status(200).json({ resumes: fileDetails });
  } catch (error) {
    console.error('Error fetching local resumes:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




/* app.get('/api/resumes', (req, res) => {
  try {
    const { filenames } = req.query;
    if (!filenames || !Array.isArray(filenames)) {
      return res.status(400).json({ error: 'Invalid or missing filenames array.' });
    }

    const allFiles = fs.readdirSync(resumeDirectory);
    const matchingFiles = filenames
      .filter((filename) => allFiles.includes(filename))
      .map((filename) => ({
        filename,
        path: `/uploads/resumes/${filename}`,
      }));

    res.status(200).json({ matchingFiles });
  } catch (error) {
    console.error('Error matching resume files:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});*/

  /*  app.get('/get-resume-path', (req, res) => {
  const filename = req.query.filename; // filename from the data object (e.g., "3.pdf")
  const resumePath = path.join(__dirname, 'upload/resumes', filename);

  res.json({ path: resumePath }); // Send back the path
});*/
// Start the server

/* 

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const bodyParser = require('body-parser');
const { Schema } = mongoose;
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs'); // File system module
const path = require('path'); // Path module
const PDFDocument = require('pdfkit');

// Initialize Express app
const app = express();
const PORT = 5000;

// Create an HTTP server to support WebSockets
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect('mongodb+srv://ApplicationTrackingSystem:ApplicationTrackingSystem@skillmatrix.ntv9d.mongodb.net/?retryWrites=true&w=majority&appName=SkillMatrix')
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Define Mongoose Schemas
const ApiResponseSchema = new Schema({
  resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
  jobDescriptionId: { type: Schema.Types.ObjectId, ref: 'JobDescription', required: true },
  matchingResult: Object,
  createdAt: { type: Date, default: Date.now },
});

const ResumeSchema = new Schema({
  title: String,
  pdf: Buffer,
  filename: String,
  uploadedAt: { type: Date, default: Date.now },
});

const JobDescriptionSchema = new Schema({
  title: String,
  description: Buffer,
  filename: String,
  uploadedAt: { type: Date, default: Date.now },
});

const Resume = mongoose.model('Resume', ResumeSchema);
const JobDescription = mongoose.model('JobDescription', JobDescriptionSchema);
const ApiResponse = mongoose.model('ApiResponse', ApiResponseSchema);

// Multer Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('WebSocket client connected.');
  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected.');
  });
});

// Emit event on new ApiResponse creation
const emitApiResponseUpdate = (newResponse) => {
  io.emit('apiResponseUpdated', newResponse);
};

const resumeDirectory = path.join(__dirname, 'uploads', 'resumes');
const jobDescriptionDirectory = path.join(__dirname, 'uploads', 'job_descriptions');

// Ensure the directories exist
if (!fs.existsSync(resumeDirectory)) {
  fs.mkdirSync(resumeDirectory, { recursive: true });
}
if (!fs.existsSync(jobDescriptionDirectory)) {
  fs.mkdirSync(jobDescriptionDirectory, { recursive: true });
}

// Update the `/api/submit` endpoint to save files locally
app.post('/api/submit', upload.fields([{ name: 'resumes' }, { name: 'job_description' }]), async (req, res) => {
  try {
    const { files } = req;

    if (!files || !files.resumes || !files.job_description) {
      return res.status(400).json({ error: 'Resumes and job descriptions are required.' });
    }

    console.log('Uploading Files:', { resumes: files.resumes, jobDescriptions: files.job_description });

    const results = [];
    const savedJobDescriptions = {};

    // Save job descriptions
    for (const jobDescription of files.job_description) {
      // Save to MongoDB
      if (!savedJobDescriptions[jobDescription.originalname]) {
        const savedJobDescription = new JobDescription({
          title: jobDescription.originalname,
          description: jobDescription.buffer,
          filename: jobDescription.originalname,
        });
        await savedJobDescription.save();
        savedJobDescriptions[jobDescription.originalname] = savedJobDescription._id;
      }

      // Save locally
      const jobDescriptionPath = path.join(jobDescriptionDirectory, jobDescription.originalname);
      fs.writeFileSync(jobDescriptionPath, jobDescription.buffer);
    }

    // Process resumes
    for (const resume of files.resumes) {
      console.log('Processing Resume:', resume.originalname);

      // Save to MongoDB
      const savedResume = new Resume({
        title: resume.originalname,
        pdf: resume.buffer,
        filename: resume.originalname,
      });
      await savedResume.save();

      // Save locally
      const resumePath = path.join(resumeDirectory, resume.originalname);
      fs.writeFileSync(resumePath, resume.buffer);

      for (const jobDescription of files.job_description) {
        const jobDescriptionId = savedJobDescriptions[jobDescription.originalname];

        // Check if this combination of resume and job description already exists
        const existingApiResponse = await ApiResponse.findOne({
          resumeId: savedResume._id,
          jobDescriptionId: jobDescriptionId,
        });

        if (existingApiResponse) {
          console.log(`Duplicate found for Resume: ${resume.originalname} and Job Description: ${jobDescription.originalname}. Skipping.`);
          continue;
        }

        const formData = new FormData();
        formData.append('resumes', resume.buffer, resume.originalname);
        formData.append('job_description', jobDescription.buffer, jobDescription.originalname);

        try {
          const apiResponse = await axios.post(
            'http://13.201.34.119:8001/candidates',
            formData,
            { headers: formData.getHeaders() }
          );

          if (apiResponse.data && apiResponse.data['POST Response']) {
            const savedResponse = new ApiResponse({
              resumeId: savedResume._id,
              jobDescriptionId: jobDescriptionId,
              matchingResult: apiResponse.data['POST Response'],
            });
            await savedResponse.save();
            results.push({
              resume: resume.originalname,
              jobDescription: jobDescription.originalname,
              matchingResult: apiResponse.data['POST Response'],
            });
            emitApiResponseUpdate(savedResponse);
          } else {
            console.warn(`No matching data for Resume: ${resume.originalname} and Job Description: ${jobDescription.originalname}`);
          }
        } catch (error) {
          console.error(`Error with external API for ${resume.originalname}:`, error.message);
        }
      }
    }

    res.status(200).json({ message: 'Files processed and stored successfully.', results });
  } catch (error) {
    console.error('Error processing files:', error.message);
    res.status(500).json({ error: 'Failed to process files.', details: error.message });
  }
});

// Endpoint to fetch all API responses
app.get('/api/candidate-filtering', async (req, res) => {
  try {
    const responses = await ApiResponse.find()
      .populate('resumeId', 'title filename')
      .populate('jobDescriptionId', 'title filename')
      .sort({ createdAt: -1 });

    res.status(200).json(responses);
  } catch (error) {
    console.error('Error fetching candidate filtering data:', error.message);
    res.status(500).json({ error: 'Failed to fetch candidate filtering data.' });
  }
});

// New GET endpoint for resume PDF files
// Endpoint to fetch and convert resume data into PDF
// Serve the PDF for a given resume ID
app.get('/api/resumes/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { download } = req.query; // Check for "download" query parameter

    // Validate the ObjectId
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ error: 'Invalid resume ID.' });
    }

    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    // Decode Base64 to binary
    const binaryPdf = Buffer.from(resume.pdf, 'base64');
    const disposition = download === 'true' 
    ? `attachment; filename="${resume.filename}"`
    : `inline; filename="${resume.filename}"`;
    // Serve the PDF directly
    res.writeHead(200, {
     

      'Content-Type': 'application/pdf',
      'Content-Disposition': disposition,
      'Content-Length': binaryPdf.length,
    });

    res.end(binaryPdf); // Send the binary PDF data to the client
  } catch (error) {
    console.error('Error retrieving resume PDF:', error.message);
    res.status(500).json({ error: 'Failed to retrieve resume PDF.' });
  }
  
});


// Endpoint to fetch all stored resume in locally filenames

app.get('/api/local-resumes', (req, res) => {
  try {
    const resumeDirectory = path.join(__dirname, 'uploads/resumes');
    const allFiles = fs.readdirSync(resumeDirectory);

    if (allFiles.length === 0) {
      return res.status(404).json({ error: 'No resumes found.' });
    }

    const fileDetails = allFiles.map((filename) => ({
      filename,
      path: `/uploads/resumes/${filename}`,
    }));

    res.status(200).json({ resumes: fileDetails });
  } catch (error) {
    console.error('Error fetching local resumes:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


*/