"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CheckSquare, ClipboardList, Home, LogOut, Menu, Database, ChevronDown, ChevronRight, KeyRound, Video } from 'lucide-react'

export default function AdminLayout({ children, darkMode, toggleDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userDepartment, setUserDepartment] = useState("")
  const [userDepartmentMap, setUserDepartmentMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  // Configuration constants
  const GOOGLE_SHEET_ID = '1d7cv-LcuvL5ckeVyXreqB--E2Hp1_HRadzXjiUnIAKs'
  const SHEET_NAME = 'Whatsapp'
  const DOER_NAME_COLUMN = "Doer's Name"
  const DEPARTMENT_COLUMN = "ID" // This should match your sheet's department column

  // Your Google Apps Script URL
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyo7fg3XgjpAHjztPI1q_01tR6DN69EZN-gfK81Bq2ae5EPADuR5lrhy6WMjRhavjoVng/exec' // Replace with your actual Apps Script URL

  // Fetch user department mapping from Google Sheets
  useEffect(() => {
    const fetchUserDepartments = async () => {
      try {
        setIsLoading(true)
        
        // Call your Google Apps Script to fetch the Whatsapp sheet data
        const response = await fetch(`${APPS_SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Check if we have table data
        if (!data.table || !data.table.rows) {
          throw new Error("Invalid data format received from sheet")
        }
        
        // Process the sheet data
        const rows = data.table.rows
        const headers = rows[0]?.c || []
        
        // Find column indices based on your sheet structure
        let doerNameIndex = -1
        let departmentIndex = -1
        
        // Based on your screenshot, the columns are:
        // A: Department, B: Given By, C: Doer's Name, D: password, E: Role, F: ID
        headers.forEach((header, index) => {
          const headerValue = header?.v || ''
          if (headerValue === "Doer's Name") {
            doerNameIndex = index
          }
          if (headerValue === "ID") {
            departmentIndex = index
          }
        })
        
        // If headers not found, use positional indices based on your sheet structure
        if (doerNameIndex === -1) doerNameIndex = 2 // Column C (Doer's Name)
        if (departmentIndex === -1) departmentIndex = 5 // Column F (ID)
        
        console.log("Column indices - Doer Name:", doerNameIndex, "Department:", departmentIndex)
        
        // Create mapping from sheet data
        const newMap = {}
        
        // Skip header row (index 0) and process data rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (row && row.c && row.c.length > Math.max(doerNameIndex, departmentIndex)) {
            const doerName = row.c[doerNameIndex]?.v
            const department = row.c[departmentIndex]?.v
            
            if (doerName && department) {
              const username = doerName.toString().trim().toLowerCase()
              const dept = department.toString().trim()
              newMap[username] = dept
              
              console.log(`Mapped: "${username}" -> "${dept}"`)
            }
          }
        }
        
        console.log("Final user department mapping:", newMap)
        setUserDepartmentMap(newMap)
        
        // Update current user's department if logged in
        const storedUsername = sessionStorage.getItem('username')
        if (storedUsername) {
          const lowercaseUsername = storedUsername.toLowerCase().trim()
          console.log("Looking up department for user:", lowercaseUsername)
          
          if (newMap[lowercaseUsername]) {
            const userDept = newMap[lowercaseUsername]
            console.log("Found department for user:", userDept)
            setUserDepartment(userDept)
            sessionStorage.setItem('department', userDept)
          } else {
            console.log("No department found for user:", lowercaseUsername)
            console.log("Available users in map:", Object.keys(newMap))
          }
        }
        
        setIsLoading(false)
        
      } catch (error) {
        console.error("Error fetching user departments:", error)
        setIsLoading(false)
        
        // Fallback to hardcoded map if API fails
        const fallbackMap = {
          'admin': 'Plant',
          'rahul sir': 'Plant',
          'subir roy': 'Plant',
          'kunal khosie': 'Plant',
          'manish verma': 'Plant',
          'vaibhav sir': 'Plant',
          'poshan': 'Plant',
          'store keeper': 'Plant',
          'tanker driver': 'Plant',
          'electrician': 'Plant',
          'rehan ashraf': 'Office',
          'neha garg': 'Office',
          'tripli agrawal': 'Office',
          'apurva ray': 'Office',
          'khileshwari': 'Office',
          'ankita': 'Office',
          'raghav': 'Office'
        }
        setUserDepartmentMap(fallbackMap)
        
        // Set department for current user from fallback
        const storedUsername = sessionStorage.getItem('username')
        if (storedUsername) {
          const lowercaseUsername = storedUsername.toLowerCase().trim()
          if (fallbackMap[lowercaseUsername]) {
            setUserDepartment(fallbackMap[lowercaseUsername])
            sessionStorage.setItem('department', fallbackMap[lowercaseUsername])
          }
        }
      }
    }

    fetchUserDepartments()
  }, [])

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username')
    const storedRole = sessionStorage.getItem('role')
    const storedDepartment = sessionStorage.getItem('department')

    if (!storedUsername) {
      navigate("/login")
      return
    }

    setUsername(storedUsername)
    setUserRole(storedRole || "user")
    
    // Only set department from sessionStorage if userDepartmentMap is not loaded yet
    if (Object.keys(userDepartmentMap).length === 0) {
      setUserDepartment(storedDepartment || "")
    }
  }, [navigate])

  // Update user department when userDepartmentMap changes
  useEffect(() => {
    if (Object.keys(userDepartmentMap).length > 0 && username) {
      const lowercaseUsername = username.toLowerCase().trim()
      if (userDepartmentMap[lowercaseUsername]) {
        const dept = userDepartmentMap[lowercaseUsername]
        setUserDepartment(dept)
        sessionStorage.setItem('department', dept)
        console.log("Updated user department to:", dept)
      }
    }
  }, [userDepartmentMap, username])

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('department')
    navigate("/login")
  }

  // Data categories configuration - these should match your sheet names
  const dataCategories = [
    { id: "sales", name: "Plant", link: "/dashboard/data/sales" },
    { id: "managing-director", name: "Office", link: "/dashboard/data/managing-director" },
  ]

  // Navigation routes configuration
  const routes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: Database,
      active: location.pathname === "/dashboard/admin",
      showFor: ["admin", "user"]
    },
    {
      href: "/dashboard/assign-task",
      label: "Assign Task",
      icon: CheckSquare,
      active: location.pathname === "/dashboard/assign-task",
      showFor: ["admin"]
    },
    {
      href: "/dashboard/delegation",
      label: "Delegation",
      icon: ClipboardList,
      active: location.pathname === "/dashboard/delegation",
      showFor: ["admin", "user"]
    },
    {
      href: "#",
      label: "Data",
      icon: Database,
      active: location.pathname.includes("/dashboard/data"),
      submenu: true,
      showFor: ["admin", "user"]
    },
    {
      href: "/dashboard/license",
      label: "License",
      icon: KeyRound,
      active: location.pathname === "/dashboard/license",
      showFor: ["admin", "user"] // show both
    },

    {
      href: "/dashboard/traning-video",
      label: "Training Video",
      icon: Video,
      active: location.pathname === "/dashboard/traning-video",
      showFor: ["admin", "user"] //  show both
    },
  ]

  // Get accessible departments based on user role and department
  const getAccessibleDepartments = () => {
    // Don't wait for loading to complete - show departments immediately
    const role = sessionStorage.getItem('role') || 'user'
    const currentUsername = sessionStorage.getItem('username') || ''
    
    console.log("Getting accessible departments for:", {
      role,
      username: currentUsername,
      userDepartment,
      userDepartmentMap,
      isLoading
    })
    
    // Admin can see all departments
    if (role === "admin") {
      console.log("Admin user - showing all departments")
      return dataCategories
    }
    
    // For regular users, get their department from the mapping
    const lowercaseUsername = currentUsername.toLowerCase().trim()
    let actualDepartment = userDepartment
    
    // If we don't have department set, try to get it from the map
    if (!actualDepartment && userDepartmentMap[lowercaseUsername]) {
      actualDepartment = userDepartmentMap[lowercaseUsername]
    }
    
    // If still loading and no department found, try fallback mapping
    if (!actualDepartment && isLoading) {
      const fallbackMap = {
        'admin': 'Plant',
        'rahul sir': 'Plant',
        'subir roy': 'Plant',
        'kunal khosie': 'Plant',
        'manish verma': 'Plant',
        'vaibhav sir': 'Plant',
        'poshan': 'Plant',
        'store keeper': 'Plant',
        'tanker driver': 'Plant',
        'electrician': 'Plant',
        'rehan ashraf': 'Office',
        'neha garg': 'Office',
        'tripli agrawal': 'Office',
        'apurva ray': 'Office',
        'khileshwari': 'Office',
        'ankita': 'Office',
        'raghav': 'Office',
        'suraj': 'Office'
      }
      actualDepartment = fallbackMap[lowercaseUsername]
    }
    
    console.log("User department:", actualDepartment)
    
    if (!actualDepartment) {
      console.log("No department found for user")
      return []
    }
    
    // Match department to available categories
    const accessibleDepts = dataCategories.filter(cat => {
      const catNameLower = cat.name.toLowerCase().trim()
      const actualDeptLower = actualDepartment.toLowerCase().trim()
      
      const isMatch = (
        actualDeptLower === catNameLower ||
        (actualDeptLower === 'plant' && catNameLower === 'plant') ||
        (actualDeptLower === 'office' && catNameLower === 'office')
      )
      
      console.log(`Checking ${cat.name} against ${actualDepartment}: ${isMatch}`)
      return isMatch
    })
    
    console.log("Accessible departments:", accessibleDepts)
    return accessibleDepts
  }

  // Filter routes based on user role
  const getAccessibleRoutes = () => {
    const userRole = sessionStorage.getItem('role') || 'user'
    return routes.filter(route => route.showFor.includes(userRole))
  }

  // Check if the current path is a data category page
  const isDataPage = location.pathname.includes("/dashboard/data/")

  // If it's a data page, expand the submenu by default
  useEffect(() => {
    if (isDataPage && !isDataSubmenuOpen) {
      setIsDataSubmenuOpen(true)
    }
  }, [isDataPage, isDataSubmenuOpen])

  // Get accessible routes and departments
  const accessibleRoutes = getAccessibleRoutes()
  const accessibleDepartments = getAccessibleDepartments()

  // Remove the full-page loading - let content render while data loads in background

  return (
    <div className={`flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50`}>
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-blue-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
          <Link to="/dashboard/admin" className="flex items-center gap-2 font-semibold text-blue-700">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <span>Checklist & Delegation</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {accessibleRoutes.map((route) => (
              <li key={route.label}>
                {route.submenu ? (
                  <div>
                    <button
                      onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        route.active
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                          : "text-gray-700 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                        {route.label}
                      </div>
                      {isDataSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {isDataSubmenuOpen && (
                      <ul className="mt-1 ml-6 space-y-1 border-l border-blue-100 pl-2">
                        {accessibleDepartments.map((category) => (
                          <li key={category.id}>
                            <Link
                              to={category.link || `/dashboard/data/${category.id}`}
                              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                location.pathname === (category.link || `/dashboard/data/${category.id}`)
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 "
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                        {accessibleDepartments.length === 0 && (
                          <li className="px-3 py-2">
                            <div className="text-sm text-gray-500 italic bg-gray-50 rounded-md p-3 border border-gray-200">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>No departments accessible</span>
                              </div>
                              {process.env.NODE_ENV === 'development' && (
                                <div className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded border border-red-200">
                                  <strong>Debug Info:</strong><br/>
                                  Username: "{username}"<br/>
                                  User Department: "{userDepartment}"<br/>
                                  User Role: "{userRole}"<br/>
                                  Available Categories: {dataCategories.map(cat => cat.name).join(', ')}<br/>
                                  Department Map: {JSON.stringify(userDepartmentMap)}
                                </div>
                              )}
                            </div>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={route.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      route.active
                        ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                    {route.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{username ? username.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">
                  {username || "User"} {userRole === "admin" ? "(Admin)" : ""}
                </p>
                <p className="text-xs text-blue-600">
                  {username ? `${username.toLowerCase()}@example.com` : "user@example.com"}
                </p>
                {process.env.NODE_ENV === 'development' && userDepartment && (
                  <p className="text-xs text-gray-500">
                    {/* Dept: "{userDepartment}" */}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                >
                  {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646A9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  <span className="sr-only">{darkMode ? "Light mode" : "Dark mode"}</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden absolute left-4 top-3 z-50 text-blue-700 p-2 rounded-md hover:bg-blue-100"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Mobile sidebar - Similar structure as desktop but collapsed for brevity */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            {/* Mobile sidebar content - same as desktop sidebar */}
            <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
              <Link
                to="/dashboard/admin"
                className="flex items-center gap-2 font-semibold text-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <span>Checklist & Delegation</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 bg-white">
              <ul className="space-y-1">
                {accessibleRoutes.map((route) => (
                  <li key={route.label}>
                    {route.submenu ? (
                      <div>
                        <button
                          onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                          className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            route.active
                              ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                              : "text-gray-700 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                            {route.label}
                          </div>
                          {isDataSubmenuOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {isDataSubmenuOpen && (
                          <ul className="mt-1 ml-6 space-y-1 border-l border-blue-100 pl-2">
                            {accessibleDepartments.map((category) => (
                              <li key={category.id}>
                                <Link
                                  to={category.link || `/dashboard/data/${category.id}`}
                                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                    location.pathname === (category.link || `/dashboard/data/${category.id}`)
                                      ? "bg-blue-50 text-blue-700 font-medium"
                                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                  }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {category.name}
                                </Link>
                              </li>
                            ))}
                            {accessibleDepartments.length === 0 && (
                              <li className="px-3 py-2">
                                <div className="text-sm text-gray-500 italic bg-gray-50 rounded-md p-3 border border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{isLoading ? 'Loading departments...' : 'No departments accessible'}</span>
                                  </div>
                                  {process.env.NODE_ENV === 'development' && (
                                    <div className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded border border-red-200">
                                      <strong>Debug Info:</strong><br/>
                                      Username: "{username}"<br/>
                                      User Department: "{userDepartment}"<br/>
                                      User Role: "{userRole}"<br/>
                                      Is Loading: {isLoading ? 'Yes' : 'No'}<br/>
                                      Available Categories: {dataCategories.map(cat => cat.name).join(', ')}<br/>
                                      Department Map: {JSON.stringify(userDepartmentMap)}
                                    </div>
                                  )}
                                </div>
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={route.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          route.active
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                        {route.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{username ? username.charAt(0).toUpperCase() : 'U'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {username || "User"} {userRole === "admin" ? "(Admin)" : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      {username ? `${username.toLowerCase()}@example.com` : "user@example.com"}
                    </p>
                    {process.env.NODE_ENV === 'development' && userDepartment && (
                       <p className="text-xs text-gray-500">
                        Dept: "{userDepartment}"
                       </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {toggleDarkMode && (
                    <button
                      onClick={toggleDarkMode}
                      className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                    >
                      {darkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646A9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      <span className="sr-only">{darkMode ? "Light mode" : "Dark mode"}</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 "
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Log out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-blue-200 bg-white px-4 md:px-6">
          <div className="flex md:hidden w-8"></div>
          <h1 className="text-lg font-semibold text-blue-700">Checklist & Delegation</h1>
          <div className="w-8"></div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          {children}
          <div className="fixed md:left-64 left-0 right-0 bottom-0 py-1 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center text-sm shadow-md z-10">
            <a
              href="https://www.botivate.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Powered by-<span className="font-semibold">Botivate</span>
            </a>
          </div>
        </main>
      </div>
    </div>
  )
}