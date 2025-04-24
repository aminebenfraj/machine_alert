import axios from "axios"

const API_URL = "https://machine-alert.onrender.com"

// Get all calls with optional filtering
export const getCalls = async (filters = {}) => {
  try {
    console.log("Fetching calls with filters:", filters)
    const response = await axios.get(API_URL, { params: filters })
    console.log("Calls API response:", response)

    let callsData = []

    if (response && response.data && Array.isArray(response.data)) {
      callsData = response.data
    } else if (Array.isArray(response)) {
      callsData = response
    }

    // Process calls to ensure they have remainingTime
    return callsData.map((call) => {
      if (call.status === "Pendiente" && !call.remainingTime && call.remainingTime !== 0) {
        // Calculate remaining time (90 minutes from call time)
        const callTime = new Date(call.callTime).getTime()
        const currentTime = new Date().getTime()
        const elapsedSeconds = Math.floor((currentTime - callTime) / 1000)
        const totalSeconds = 90 * 60 // 90 minutes in seconds
        const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

        return {
          ...call,
          remainingTime: remainingSeconds,
        }
      }
      return call
    })
  } catch (error) {
    console.error("Error in getCalls:", error)
    return []
  }
}

// Create a new call
export const createCall = async (data) => {
  try {
    console.log("Creating call with data:", data)

    // Ensure the call has a remainingTime property set to 90 minutes
    const callData = {
      ...data,
      remainingTime: 90 * 60, // 90 minutes in seconds
    }

    const response = await axios.post(API_URL, callData)
    console.log("Create call response:", response)
    
    // Return the response data with remainingTime if not present
    if (response && response.data) {
      if (!response.data.remainingTime && response.data.remainingTime !== 0) {
        response.data.remainingTime = 90 * 60; // 90 minutes in seconds
      }
    }
    
    return response
  } catch (error) {
    console.error("Error in createCall:", error)
    throw error
  }
}

// Mark a call as completed
export const completeCall = async (id, userRole = "LOGISTICA") => {
  try {
    console.log(`Completing call ${id} as ${userRole}...`);
    
    // Include the user role in the request to ensure proper authorization
    const response = await axios.put(`${API_URL}/${id}/complete`, {
      status: "Realizada",
      completionTime: new Date(),
      userRole: userRole // Send the user role for authorization
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Include any auth headers if needed
      }
    })
    
    console.log(`Call ${id} completed successfully:`, response);
    return response
  } catch (error) {
    console.error("Error in completeCall:", error)
    throw error
  }
}

// Check for expired calls manually
export const checkExpiredCalls = async () => {
  try {
    const response = await axios.post(`${API_URL}/check-expired`)
    return response
  } catch (error) {
    console.error("Error in checkExpiredCalls:", error)
    throw error
  }
}

// Export calls to CSV
export const exportCalls = async (filters = {}) => {
  try {
    const queryString = new URLSearchParams(filters).toString()
    window.open(`${API_URL}/export?${queryString}`, "_blank")
  } catch (error) {
    console.error("Error in exportCalls:", error)
    throw error
  }
}

// Format time for display
export const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
}

// Format time with hours for longer durations
export const formatTimeWithHours = (seconds) => {
  if (seconds === null || seconds === undefined) return "00:00:00"
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Calculate progress percentage (for progress bars)
export const calculateProgress = (remainingTime) => {
  const totalTime = 90 * 60 // 90 minutes in seconds
  return Math.max(0, Math.min(100, (remainingTime / totalTime) * 100))
}
export const deleteCall = async (id) => {
  try {
    console.log(`Deleting call with ID: ${id}`);
    const response = await axios.delete(`${API_URL}/${id}`);
    console.log("Delete call response:", response);
    return response;
  } catch (error) {
    console.error("Error in deleteCall:", error);
    throw error;
  }
};