"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { format } from "date-fns"
import axios from "axios"
import "./StudentLeaveData.css"
import StudentNavbar from "../Land/StudentNavbar"

const BASE_URL = "http://localhost:8080"

const StudentLeaveData = () => {
  const navigate = useNavigate()
  const studentId = localStorage.getItem("studentId")

  const [activeTab, setActiveTab] = useState("request")
  const [faculties, setFaculties] = useState([])
  const [leaveHistory, setLeaveHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    facultyId: "",
    subject: "",
    reason: "",
    fromDate: null,
    toDate: null,
  })

  useEffect(() => {
    if (!studentId) {
      toast.error("Please login to access this page")
      navigate("/login")
      return
    }

    const fetchFaculties = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${BASE_URL}/api/faculty`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setFaculties(response.data)
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch faculties")
      }
    }

    const fetchLeaveHistory = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!studentId) {
          toast.error("Student ID not found")
          setIsLoading(false)
          return
        }
        const response = await axios.get(`${BASE_URL}/api/student-leave/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setLeaveHistory(response.data)
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch leave history")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFaculties()
    if (studentId) {
      fetchLeaveHistory()
    }
  }, [studentId, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target

    // For fromDate, validate that it's not in the past
    if (name === "fromDate") {
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day for fair comparison

      if (selectedDate < today) {
        toast.error("From date cannot be in the past")
        return
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form data
    if (!formData.facultyId) {
      toast.error("Please select a faculty")
      return
    }

    if (!formData.subject || !formData.reason) {
      toast.error("Please fill all required fields")
      return
    }

    if (!formData.fromDate || !formData.toDate) {
      toast.error("Please select both from and to dates")
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")

      await axios.post(`${BASE_URL}/api/student-leave/request/${studentId}`, formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      toast.success("Leave request submitted successfully")

      // Reset form
      setFormData({
        facultyId: "",
        subject: "",
        reason: "",
        fromDate: null,
        toDate: null,
      })

      // Refresh leave history
      const response = await axios.get(`${BASE_URL}/api/student-leave/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setLeaveHistory(response.data)

      // Switch to history tab
      setActiveTab("history")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit leave request")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-300">
            <span className="inline-block w-3 h-3 mr-1">⏱️</span> Pending
          </span>
        )
      case "APPROVED":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-300">
            <span className="inline-block w-3 h-3 mr-1">✅</span> Approved
          </span>
        )
      case "REJECTED":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 border border-red-300">
            <span className="inline-block w-3 h-3 mr-1">❌</span> Rejected
          </span>
        )
      default:
        return <span className="px-2 py-1 rounded-full text-xs border">{status}</span>
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return format(date, "PPP") // Format: Jan 1, 2021
  }

  return (
    <div className="stud-leave-page">
      <StudentNavbar />
      <div className="stud-leave-container">
        <div className="stud-leave-sidebar">
          <h2>Student Leave Management</h2>
          <div className="stud-leave-sidebar-btns">
            <button
              className={` ${activeTab === "request" ? "stud-leave-req-btn" : ""}`}
              onClick={() => setActiveTab("request")}
            >
              Request Leave
            </button>
            <button
              className={` ${activeTab === "history" ? "stud-leave-his-btn" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Leave History
            </button>
          </div>
        </div>

        <div className="stud-leave-main-content">
          <div className="stud-leave-form">
            <h2>Student Leave Request Form</h2>
            {activeTab === "request" ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 mt-4">
                  <div className="form-group">
                    <label htmlFor="facultyId" className="block text-sm font-medium">
                      Faculty
                    </label>
                    <select
                      id="facultyId"
                      name="facultyId"
                      value={formData.facultyId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name} - {faculty.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject" className="block text-sm font-medium">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Enter subject"
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reason" className="block text-sm font-medium">
                      Reason
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      placeholder="Enter reason for leave"
                      rows={4}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fromDate" className="block text-sm font-medium">
                        From Date
                      </label>
                      <input
                        id="fromDate"
                        name="fromDate"
                        type="date"
                        value={formData.fromDate || ""}
                        onChange={handleDateChange}
                        min={new Date().toISOString().split("T")[0]} // Set minimum date to today
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="toDate" className="block text-sm font-medium">
                        To Date
                      </label>
                      <input
                        id="toDate"
                        name="toDate"
                        type="date"
                        value={formData.toDate || ""}
                        onChange={handleDateChange}
                        min={formData.fromDate || ""}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="stud-leave-submit-btn">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isLoading ? "Submitting..." : "Submit Leave Request"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {isLoading ? (
                  <div className="text-center py-8">Loading leave history...</div>
                ) : leaveHistory.length === 0 ? (
                  <div className="text-center py-8">No leave requests found.</div>
                ) : (
                  <div className="stud-leave-table-container">
                    <table className="stud-leave-table">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left">Subject</th>
                          <th className="p-2 text-left">Faculty</th>
                          <th className="p-2 text-left">From</th>
                          <th className="p-2 text-left">To</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveHistory.map((leave) => (
                          <tr key={leave.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{leave.subject}</td>
                            <td className="p-2">{leave.facultyName}</td>
                            <td className="p-2">{formatDate(leave.fromDate)}</td>
                            <td className="p-2">{formatDate(leave.toDate)}</td>
                            <td className="p-2">{getStatusBadge(leave.status)}</td>
                            <td className="p-2">{leave.comments || "No comments"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentLeaveData

