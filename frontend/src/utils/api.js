// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token')
}

// Base fetch function with auth
const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken()

  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Add Content-Type for JSON requests (except for FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.reload()
      }

      throw new Error(data.message || `Request failed (${response.status})`)
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Helper: clean empty params before sending
function cleanParams(params) {
  const clean = {}
  for (const [key, val] of Object.entries(params)) {
    if (val !== '' && val !== null && val !== undefined) {
      clean[key] = val
    }
  }
  return clean
}

function buildQuery(params) {
  const cleaned = cleanParams(params)
  const qs = new URLSearchParams(cleaned).toString()
  return qs ? `?${qs}` : ''
}

// Auth API
export const authAPI = {
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (userData) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  registerGuest: (formData) =>
    apiFetch('/auth/register-guest', {
      method: 'POST',
      body: formData
    }),

  logout: () =>
    apiFetch('/auth/logout', { method: 'POST' }),

  getProfile: () => apiFetch('/auth/profile'),

  updateProfile: (userData) =>
    apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),

  changePassword: (current_password, new_password) =>
    apiFetch('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ current_password, new_password })
    })
}

// Assets API
export const assetsAPI = {
  getAll: (params = {}) => apiFetch(`/assets${buildQuery(params)}`),

  getById: (id) => apiFetch(`/assets/${id}`),

  getHistory: (id) => apiFetch(`/assets/${id}/history`),

  create: (data) => {
    if (data instanceof FormData) {
      return apiFetch('/assets', { method: 'POST', body: data })
    }
    return apiFetch('/assets', { method: 'POST', body: JSON.stringify(data) })
  },

  update: (id, data) => {
    if (data instanceof FormData) {
      return apiFetch(`/assets/${id}`, { method: 'POST', body: data })
    }
    return apiFetch(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  updateCondition: (id, condition, notes) =>
    apiFetch(`/assets/${id}/condition`, {
      method: 'PATCH',
      body: JSON.stringify({ condition, notes })
    }),

  updateStatus: (id, status, notes) =>
    apiFetch(`/assets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    }),

  delete: (id) =>
    apiFetch(`/assets/${id}`, { method: 'DELETE' })
}

// Loans API
export const loansAPI = {
  getAll: (params = {}) => apiFetch(`/loans${buildQuery(params)}`),

  getMyLoans: (status) => {
    const q = status ? `?status=${status}` : ''
    return apiFetch(`/loans/my-loans${q}`)
  },

  getById: (id) => apiFetch(`/loans/${id}`),

  create: (loanData) =>
    apiFetch('/loans', {
      method: 'POST',
      body: JSON.stringify(loanData)
    }),

  approve: (id) =>
    apiFetch(`/loans/${id}/approve`, { method: 'PATCH' }),

  reject: (id, rejection_reason) =>
    apiFetch(`/loans/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason })
    }),

  returnAsset: (id, condition_when_returned, notes) =>
    apiFetch(`/loans/${id}/return`, {
      method: 'PATCH',
      body: JSON.stringify({ condition_when_returned, notes })
    })
}

// Users API
export const usersAPI = {
  getAll: (params = {}) => apiFetch(`/users${buildQuery(params)}`),

  getById: (id) => apiFetch(`/users/${id}`),

  update: (id, userData) =>
    apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),

  verifyGuest: (id, status) =>
    apiFetch(`/users/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  toggleStatus: (id) =>
    apiFetch(`/users/${id}/toggle-status`, { method: 'PATCH' }),

  delete: (id) =>
    apiFetch(`/users/${id}`, { method: 'DELETE' })
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiFetch('/dashboard/stats')
}

// Agreements API
export const agreementsAPI = {
  getAll: (params = {}) => apiFetch(`/agreements${buildQuery(params)}`),

  getById: (id) => apiFetch(`/agreements/${id}`),

  markAsViolated: (id, violation_notes) =>
    apiFetch(`/agreements/${id}/violate`, {
      method: 'PATCH',
      body: JSON.stringify({ violation_notes })
    })
}

// Payments API
export const paymentsAPI = {
  getAll: (params = {}) => apiFetch(`/payments${buildQuery(params)}`),

  getById: (id) => apiFetch(`/payments/${id}`),

  update: (id, data) => {
    if (data instanceof FormData) {
      return apiFetch(`/payments/${id}`, { method: 'PATCH', body: data })
    }
    return apiFetch(`/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
}

// Reports API
export const reportsAPI = {
  downloadExcel: async (endpoint, filename) => {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/octet-stream'
      }
    })
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  },

  downloadAssetsExcel: () => reportsAPI.downloadExcel('/reports/assets/excel', 'Laporan_Aset.xlsx'),
  downloadAssetsByConditionExcel: () => reportsAPI.downloadExcel('/reports/assets/by-condition/excel', 'Laporan_Aset_Per_Kondisi.xlsx'),
  downloadRevenueExcel: () => reportsAPI.downloadExcel('/reports/revenue/excel', 'Laporan_Dana_Masuk.xlsx'),
  downloadLoansExcel: () => reportsAPI.downloadExcel('/reports/loans/excel', 'Laporan_Peminjaman.xlsx'),
}

// Activity Logs API
export const activityLogsAPI = {
  getAll: (params = {}) => apiFetch(`/activity-logs${buildQuery(params)}`),
}

export default {
  authAPI, assetsAPI, loansAPI, usersAPI, dashboardAPI,
  agreementsAPI, paymentsAPI, reportsAPI, activityLogsAPI,
}
