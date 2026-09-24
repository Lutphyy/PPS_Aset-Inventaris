import { useState } from 'react'

import Sidebar from './components/Sidebar'
import Header from './components/Header'

import Dashboard from './pages/Dashboard'
import DataAset from './pages/DataAset'

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />

      case 'data-aset':
        return <DataAset />

      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app">

      {/* SIDEBAR */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* HEADER / NAVBAR */}
        <Header />

        {/* PAGE CONTENT */}
        {renderPage()}

      </main>

    </div>
  )
}

export default App