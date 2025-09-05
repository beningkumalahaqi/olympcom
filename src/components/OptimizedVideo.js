'use client'

import { useEffect, useRef } from 'react'

export default function OptimizedVideo({ 
  src, 
  className = '', 
  style = {}, 
  preload = 'metadata',
  ...props 
}) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && src) {
      // Add preload link to head for better caching
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = src
      link.as = 'video'
      link.type = 'video/mp4'
      
      // Only add if not already present
      const existingLink = document.querySelector(`link[href="${src}"]`)
      if (!existingLink) {
        document.head.appendChild(link)
      }

      // Cleanup function
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      }
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={style}
      preload={preload}
      {...props}
    />
  )
}
