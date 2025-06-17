import React, { useState, useRef } from 'react';
import { Upload, FileText, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AnalysisResult {
  matchScore: string;
  missingSkills: string[];
  feedback: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError('');
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or DOCX file only.');
      return;
    }
    
    // Validate file size (2MB = 2 * 1024 * 1024 bytes)
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB.');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please upload your resume.');
      return;
    }
    
    if (!jobDescription.trim()) {
      setError('Please paste the job description.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      // Convert file to base64
      const base64Resume = await convertFileToBase64(file);
      
      // Create FormData and append the base64 string and job description
      const formData = new FormData();
      formData.append('resume', base64Resume);
      formData.append('jobDescription', jobDescription.trim());
      
      const response = await fetch('https://ashhar.app.n8n.cloud/webhook-test/ats-resume', {
        method: 'POST',
        headers: {"Content-Type": "application/json",
      }, body: JSON.stringify({resume: base64Resume, jobDescription,}),});
      
      if (!response.ok) {
        throw new Error('Failed to analyze resume. Please try again.');
      }
      
      const data = await response.json();
      
      // Parse the response - adjust based on actual API response format
      setResult({
        matchScore: data.matchScore || data.match_score || '0%',
        missingSkills: data.missingSkills || data.missing_skills || [],
        feedback: data.feedback || data.analysis || 'Analysis completed successfully.',
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing your resume.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setJobDescription('');
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-12 pt-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Is your resume good enough?
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            A free and fast AI resume checker doing 16 crucial checks to ensure your resume 
            is ready to perform and get you interview callbacks.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 mb-8">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* File Upload */}
              <div className="space-y-4">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : file 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="space-y-4">
                    {file ? (
                      <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <div>
                          <p className="text-lg font-semibold text-green-700">File uploaded successfully!</p>
                          <p className="text-gray-600">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-xl font-semibold text-gray-700 mb-2">
                            Drag and drop your resume here
                          </p>
                          <p className="text-gray-500 mb-4">or</p>
                          <button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Upload Your Resume
                          </button>
                          <p className="text-sm text-gray-500 mt-3">
                            PDF or DOCX files only • Max 2MB
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Privacy Guarantee */}
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Privacy guaranteed</span>
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-3">
                <label htmlFor="jobDescription" className="block text-lg font-semibold text-gray-800">
                  Paste Job Description
                </label>
                <textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Copy and paste the job description you're applying for..."
                  className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700"
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !file || !jobDescription.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-lg font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Your Resume...</span>
                  </>
                ) : (
                  <span>Check My Fit</span>
                )}
              </button>
            </form>
          ) : (
            /* Results Display */
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Analysis Complete!</h2>
                <p className="text-gray-600">Here's how your resume matches the job requirements</p>
              </div>

              {/* Match Score */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 text-center">
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">Match Score</h3>
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {result.matchScore}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-orange-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-orange-600" />
                  Missing Skills
                </h3>
                {result.missingSkills.length > 0 ? (
                  <ul className="space-y-2">
                    {result.missingSkills.map((skill, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{skill}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 italic">Great! No missing skills identified.</p>
                )}
              </div>

              {/* Feedback */}
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Feedback
                </h3>
                <p className="text-gray-700 leading-relaxed">{result.feedback}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                >
                  Check Another Resume
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                >
                  Save Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;