import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_LINKS = [
  { to: '/', label: 'Overview', exact: true },
  { to: '/accounts', label: 'Accounts' },
  { to: '/import', label: 'Import' },
  { to: '/categories', label: 'Categories' },
]

export function Navbar() {
  const { session, signOut } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const user = session?.user
  const name = user?.user_metadata?.full_name as string | undefined
  const avatar = user?.user_metadata?.avatar_url as string | undefined
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function isActive(to: string, exact?: boolean) {
    return exact ? location.pathname === to : location.pathname.startsWith(to)
  }

  return (
    <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-semibold tracking-tight mr-2">
          Ledger
        </Link>
        {NAV_LINKS.map(({ to, label, exact }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm transition-colors ${
              isActive(to, exact) ? 'text-white font-medium' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {avatar ? (
            <img src={avatar} alt={name ?? 'User'} className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-700" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-200">
              {initials}
            </div>
          )}
          {name && <span className="text-sm text-gray-300 hidden sm:block">{name.split(' ')[0]}</span>}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1 z-50">
            {name && (
              <div className="px-4 py-2 border-b border-gray-800">
                <p className="text-sm font-medium text-white truncate">{name}</p>
                {user?.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
              </div>
            )}
            <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
              Settings
            </Link>
            <button
              onClick={() => { setMenuOpen(false); signOut() }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
