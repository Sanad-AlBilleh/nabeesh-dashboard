import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PostJob from './pages/PostJob'
import JobPipeline from './pages/JobPipeline'
import CandidateDetail from './pages/CandidateDetail'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                                         element={<Dashboard />} />
          <Route path="/jobs/new"                                 element={<PostJob />} />
          <Route path="/jobs/:jobId"                              element={<JobPipeline />} />
          <Route path="/jobs/:jobId/candidate/:candidateId"       element={<CandidateDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
