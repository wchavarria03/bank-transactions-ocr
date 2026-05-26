import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Navbar() {
  const { signOut } = useAuth()

  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-semibold tracking-tight">
        Ledger
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/settings" className="text-sm text-gray-400 hover:text-white transition-colors">
          Settings
        </Link>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
