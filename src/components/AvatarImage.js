'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function AvatarImage({ src, alt, width, height, className }) {
  const [imageSrc, setImageSrc] = useState(src || '/default-avatar.svg')
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setImageSrc('/default-avatar.svg')
      setHasError(true)
    }
  }

  // Ensure the container maintains aspect ratio
  const containerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    position: 'relative',
    overflow: 'hidden'
  }

  return (
    <div style={containerStyle} className={className}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-cover"
        onError={handleError}
        priority={false}
        sizes={`${width}px`}
      />
    </div>
  )
}
