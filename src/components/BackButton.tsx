import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function BackButton() {
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  return (
    <button className="back-button" type="button" onClick={goBack}>
      <ArrowLeft size={18} aria-hidden="true" />
      <span>Back</span>
    </button>
  )
}
