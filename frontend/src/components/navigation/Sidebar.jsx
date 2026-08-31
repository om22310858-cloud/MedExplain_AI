import { NavLink } from 'react-router-dom'

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  HeartPulse,
  History,
  Home,
  Lightbulb,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
  WandSparkles,
  X,
} from 'lucide-react'

import Logo from '../branding/Logo'


/* ============================================================
   MAIN NAVIGATION
============================================================ */

const mainNavigation = [

  {
    name: 'Dashboard',
    path: '/',
    icon: Home,
  },

  {
    name: 'Reports',
    path: '/reports',
    icon: FileText,
  },

  {
    name: 'Risk Assessment',
    path: '/risk-assessment',
    icon: HeartPulse,
  },

  {
    name: 'Health History',
    path: '/health-history',
    icon: History,
  },

  {
    name: 'What-If Analysis',
    path: '/what-if',
    icon: WandSparkles,
  },

  {
    name: 'Guidance',
    path: '/guidance',
    icon: Lightbulb,
  },

  {
    name: 'Health Records',
    path: '/health-records',
    icon: ShieldCheck,
  },

]


/* ============================================================
   ACCOUNT NAVIGATION
============================================================ */

const accountNavigation = [

  {
    name: 'Profile',
    path: '/profile',
    icon: UserRound,
  },

  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
  },

]


/* ============================================================
   SIDEBAR
============================================================ */

function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {

  return (

    <aside
      className={`
        fixed
        left-0
        top-0
        z-50
        flex
        h-screen
        flex-col
        border-r
        border-slate-200/80
        bg-white
        shadow-sm
        transition-all
        duration-300
        ease-in-out

        ${collapsed ? 'w-[82px]' : 'w-[260px]'}

        ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }
      `}
    >

      {/* ====================================================
          BRAND
      ==================================================== */}

      <div
        className={`
          flex
          h-[88px]
          shrink-0
          items-center
          border-b
          border-slate-100

          ${
            collapsed
              ? 'justify-center px-3'
              : 'px-5'
          }
        `}
      >

        <Logo collapsed={collapsed} />


        {/* Mobile close */}

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="
            ml-auto
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            text-slate-400
            hover:bg-slate-50
            hover:text-slate-700
            lg:hidden
          "
          aria-label="Close navigation"
        >

          <X size={18} />

        </button>

      </div>


      {/* ====================================================
          NAVIGATION
      ==================================================== */}

      <div className="flex-1 overflow-y-auto px-3 py-6">

        {!collapsed && (

          <p
            className="
              mb-3
              px-3
              text-[10px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-slate-400
            "
          >
            Main
          </p>

        )}


        <nav className="space-y-1">

          {mainNavigation.map((item) => {

            const Icon = item.icon

            return (

              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.name : undefined}
                onClick={() => setMobileOpen(false)}

                className={({ isActive }) => `
                  group
                  flex
                  items-center
                  rounded-xl
                  px-3
                  py-3
                  transition-all
                  duration-200

                  ${
                    collapsed
                      ? 'justify-center'
                      : 'gap-3'
                  }

                  ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }
                `}
              >

                {({ isActive }) => (

                  <>

                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.3 : 2}
                      className="shrink-0"
                    />


                    {!collapsed && (

                      <span
                        className={`
                          text-[13px]
                          ${
                            isActive
                              ? 'font-semibold'
                              : 'font-medium'
                          }
                        `}
                      >
                        {item.name}
                      </span>

                    )}


                    {!collapsed && isActive && (

                      <span
                        className="
                          ml-auto
                          h-1.5
                          w-1.5
                          rounded-full
                          bg-teal-500
                        "
                      />

                    )}

                  </>

                )}

              </NavLink>

            )

          })}

        </nav>


        {/* ==================================================
            DIVIDER
        ================================================== */}

        <div className="my-6 border-t border-slate-100" />


        {/* ==================================================
            ACCOUNT
        ================================================== */}

        {!collapsed && (

          <p
            className="
              mb-3
              px-3
              text-[10px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-slate-400
            "
          >
            Account
          </p>

        )}


        <nav className="space-y-1">

          {accountNavigation.map((item) => {

            const Icon = item.icon

            return (

              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.name : undefined}
                onClick={() => setMobileOpen(false)}

                className={({ isActive }) => `
                  flex
                  items-center
                  rounded-xl
                  px-3
                  py-3
                  transition-all

                  ${
                    collapsed
                      ? 'justify-center'
                      : 'gap-3'
                  }

                  ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }
                `}
              >

                {({ isActive }) => (

                  <>

                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.2 : 2}
                    />

                    {!collapsed && (

                      <span
                        className={`
                          text-[13px]
                          ${
                            isActive
                              ? 'font-semibold'
                              : 'font-medium'
                          }
                        `}
                      >
                        {item.name}
                      </span>

                    )}

                  </>

                )}

              </NavLink>

            )

          })}

        </nav>

      </div>


      {/* ====================================================
          USER PROFILE
      ==================================================== */}

      <div className="shrink-0 border-t border-slate-100 p-3">

        <NavLink
          to="/profile"
          title={collapsed ? 'User Profile' : undefined}
          onClick={() => setMobileOpen(false)}

          className={`
            mb-2
            flex
            items-center
            rounded-xl
            bg-slate-50
            p-2.5
            transition
            hover:bg-teal-50

            ${
              collapsed
                ? 'justify-center'
                : 'gap-3'
            }
          `}
        >

          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-teal-100
              text-sm
              font-bold
              text-teal-700
            "
          >
            S
          </div>


          {!collapsed && (

            <div className="min-w-0">

              <p className="truncate text-xs font-semibold text-slate-800">
                User Profile
              </p>

              <p className="truncate text-[10px] text-slate-400">
                Health account
              </p>

            </div>

          )}

        </NavLink>


        {/* LOGOUT */}

        <button
          type="button"

          className={`
            flex
            w-full
            items-center
            rounded-xl
            px-3
            py-3
            text-slate-400
            transition

            hover:bg-red-50
            hover:text-red-600

            ${
              collapsed
                ? 'justify-center'
                : 'gap-3'
            }
          `}

          title={collapsed ? 'Logout' : undefined}
        >

          <LogOut size={18} />

          {!collapsed && (

            <span className="text-[13px] font-medium">
              Logout
            </span>

          )}

        </button>

      </div>


      {/* ====================================================
          COLLAPSE BUTTON
      ==================================================== */}

      <button
        type="button"

        onClick={() =>
          setCollapsed((value) => !value)
        }

        aria-label={
          collapsed
            ? 'Expand sidebar'
            : 'Collapse sidebar'
        }

        className="
          absolute
          -right-3
          top-[72px]
          hidden
          h-7
          w-7
          items-center
          justify-center
          rounded-full
          border
          border-slate-200
          bg-white
          text-slate-500
          shadow-sm
          transition

          hover:border-teal-200
          hover:text-teal-600

          lg:flex
        "
      >

        {collapsed ? (
          <ChevronRight size={15} />
        ) : (
          <ChevronLeft size={15} />
        )}

      </button>

    </aside>

  )
}


export default Sidebar