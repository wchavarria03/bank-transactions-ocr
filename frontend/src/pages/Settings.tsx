import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

export function Settings() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsCard
            title="Categories"
            description="Manage spending categories and auto-classification rules."
            href="/categories"
          />
          <SettingsCard
            title="Accounts"
            description="View and edit your bank accounts."
            href="/accounts"
          />
        </div>
      </main>
    </div>
  )
}

function SettingsCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link to={href} className="block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors">
      <p className="font-semibold mb-1">{title}</p>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  )
}
