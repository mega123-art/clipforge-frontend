interface VibeClipLogoProps {
  size?: number
  className?: string
}

export default function VibeClipLogo({ size = 32, className = '' }: VibeClipLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="512" height="512" rx="96" fill="#09090B"/>

      {/* Play button shape */}
      <path
        d="M156 128C156 114.745 170.745 106.837 181.778 114.223L380.222 247.223C390.083 253.83 390.083 268.17 380.222 274.777L181.778 407.777C170.745 415.163 156 407.255 156 394V128Z"
        fill="#06B6D4"
      />

      {/* Cut line */}
      <rect x="140" y="248" width="74" height="16" fill="#09090B"/>
      <rect x="298" y="248" width="74" height="16" fill="#09090B"/>

      {/* Scissor handles */}
      <circle cx="218" cy="214" r="24" stroke="#09090B" strokeWidth="14" fill="none"/>
      <circle cx="218" cy="298" r="24" stroke="#09090B" strokeWidth="14" fill="none"/>

      {/* Scissor blades */}
      <path d="M236 238L306 194" stroke="#09090B" strokeWidth="16" strokeLinecap="round"/>
      <path d="M236 274L306 318" stroke="#09090B" strokeWidth="16" strokeLinecap="round"/>

      {/* Scissor pivot */}
      <circle cx="242" cy="256" r="8" fill="#09090B"/>
    </svg>
  )
}
