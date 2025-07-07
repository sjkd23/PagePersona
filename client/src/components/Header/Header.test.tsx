import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from './Header'
import Logo from './Logo'
import AuthenticatedNav from './AuthenticatedNav'
import UnauthenticatedNav from './UnauthenticatedNav'

describe('Header Module', () => {
  describe('Logo', () => {
    it('renders logo text', () => {
      render(<Logo />)
      expect(screen.getByText('PagePersona')).toBeInTheDocument()
    })
  })

  describe('UnauthenticatedNav', () => {
    it('renders login and signup buttons', () => {
      render(<UnauthenticatedNav />)
      expect(screen.getByText('Log In')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })
  })

  describe('AuthenticatedNav', () => {
    it('renders authenticated navigation', () => {
      render(<AuthenticatedNav userName="John Doe" />)
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument()
      expect(screen.getByText('Log Out')).toBeInTheDocument()
    })
  })

  describe('Header', () => {
    it('renders unauthenticated header by default', () => {
      render(<Header />)
      expect(screen.getByText('PagePersona')).toBeInTheDocument()
      expect(screen.getByText('Log In')).toBeInTheDocument()
    })

    it('renders authenticated header when user is logged in', () => {
      render(<Header isAuthenticated={true} userName="Jane Doe" />)
      expect(screen.getByText('PagePersona')).toBeInTheDocument()
      expect(screen.getByText('Welcome, Jane Doe!')).toBeInTheDocument()
    })
  })
})
