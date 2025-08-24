'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AvatarImage from './AvatarImage'
import { useSession, signOut } from 'next-auth/react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { ChevronDown, User, LogOut, Settings, Home, Users, Menu as MenuIcon, X, MessageSquare, Megaphone } from 'lucide-react'

export default function Navigation() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:justify-start">
          {/* Mobile hamburger menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Logo - centered on mobile, left on desktop */}
          <div className="flex-1 flex justify-center md:justify-start md:flex-initial">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-indigo-600">🎭 OlympCom</span>
            </Link>
          </div>
            
          {/* Desktop navigation */}
          <div className="hidden md:flex md:ml-10 md:space-x-8">
            <Link href="/" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
            <Link href="/directory" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Directory
            </Link>
            {session && (
              <>
                <Link href="/announcements" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Announcements
                </Link>
                <Link href="/feed" className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Feed
                </Link>
              </>
            )}
          </div>

          {/* Mobile user avatar */}
          <div className="md:hidden">
            {session && (
              <AvatarImage
                className="h-8 w-8 rounded-full"
                src={session.user.profilePic}
                alt={session.user.name}
                width={32}
                height={32}
              />
            )}
          </div>

          {/* Desktop user menu / auth buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4 md:ml-auto">
            {status === 'loading' && (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            )}
            
            {!session && status !== 'loading' && (
              <div className="flex space-x-2">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}

            {session && (
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex w-full justify-center items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <AvatarImage
                      className="h-8 w-8 rounded-full mr-2"
                      src={session.user.profilePic}
                      alt={session.user.name}
                      width={32}
                      height={32}
                    />
                    <span className="hidden sm:inline">{session.user.name}</span>
                    <ChevronDown className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/profile"
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } flex items-center px-4 py-2 text-sm`}
                          >
                            <User className="mr-3 h-4 w-4" />
                            Profile
                          </Link>
                        )}
                      </Menu.Item>
                      
                      {session.user.role === 'ADMIN' && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin"
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } flex items-center px-4 py-2 text-sm`}
                            >
                              <Settings className="mr-3 h-4 w-4" />
                              Admin Dashboard
                            </Link>
                          )}
                        </Menu.Item>
                      )}
                      
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => signOut()}
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } flex w-full items-center px-4 py-2 text-sm text-left`}
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <Link
                href="/"
                className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5 mr-3" />
                Home
              </Link>
              <Link
                href="/directory"
                className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="w-5 h-5 mr-3" />
                Directory
              </Link>
              {session && (
                <>
                  <Link
                    href="/announcements"
                    className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Megaphone className="w-5 h-5 mr-3" />
                    Announcements
                  </Link>
                  <Link
                    href="/feed"
                    className="text-gray-900 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <MessageSquare className="w-5 h-5 mr-3" />
                    Feed
                  </Link>
                </>
              )}
              
              {session && (
                <>
                  <div className="border-t border-gray-200 pt-4 pb-3">
                    <div className="flex items-center px-3">
                      <AvatarImage
                        className="h-10 w-10 rounded-full"
                        src={session.user.profilePic}
                        alt={session.user.name}
                        width={40}
                        height={40}
                      />
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">{session.user.name}</div>
                        <div className="text-sm font-medium text-gray-500">{session.user.email}</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 px-2">
                      <Link
                        href="/profile"
                        className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium flex items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="w-5 h-5 mr-3" />
                        Profile
                      </Link>
                      
                      {session.user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium flex items-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="w-5 h-5 mr-3" />
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <button
                        onClick={() => {
                          signOut()
                          setIsMobileMenuOpen(false)
                        }}
                        className="text-gray-700 hover:text-indigo-600 w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center"
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {!session && status !== 'loading' && (
                <div className="border-t border-gray-200 pt-4 pb-3 space-y-1">
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
