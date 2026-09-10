import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2, Shield } from 'lucide-react'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-card">
          <div className="admin-loading-icon">
            <Shield size={32} />
          </div>
          <Loader2 className="admin-spinner" size={24} />
          <p>Verifying Security Credentials...</p>
        </div>
      </div>
    )
  }

  const isAuthenticated = Boolean(user || isDemoAdmin)

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
