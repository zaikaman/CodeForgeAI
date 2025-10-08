import React, { ReactNode } from 'react'
import { Header } from './Header'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`app-layout ${className}`}>
      <Header />
      <main className="layout-main">
        {children}
      </main>
    </div>
  )
}