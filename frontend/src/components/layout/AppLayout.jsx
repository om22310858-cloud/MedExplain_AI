import { useState } from 'react'
import { Menu, X } from 'lucide-react'

import Sidebar from '../navigation/Sidebar'


function AppLayout({ children }) {

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)


  return (

    <div className="min-h-screen bg-[#f6faf9]">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />


      {/* =====================================================
          MOBILE MENU BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="
          fixed
          left-4
          top-4
          z-40
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-slate-200
          bg-white
          text-slate-700
          shadow-sm
          lg:hidden
        "
        aria-label="Open navigation"
      >

        <Menu size={20} />

      </button>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        className={`
          min-h-screen
          w-full
          transition-[padding]
          duration-300
          ease-in-out

          ${
            collapsed
              ? 'lg:pl-[82px]'
              : 'lg:pl-[260px]'
          }
        `}
      >

        <div
          className="
            min-h-screen
            w-full
            px-4
            py-5
            sm:px-6
            sm:py-6
            lg:px-8
            xl:px-10
          "
        >

          {children}

        </div>

      </main>


      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileOpen && (

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="
            fixed
            inset-0
            z-40
            bg-slate-900/20
            backdrop-blur-[1px]
            lg:hidden
          "
          aria-label="Close navigation"
        />

      )}

    </div>

  )
}


export default AppLayout