import type { Framework } from '@stackforge/core'

export function ViteLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 410 404" className={className} aria-hidden>
      <defs>
        <linearGradient id="vite-a" x1="6" y1="33" x2="235" y2="344" gradientUnits="userSpaceOnUse">
          <stop stopColor="#41D1FF" />
          <stop offset="1" stopColor="#BD34FE" />
        </linearGradient>
        <linearGradient id="vite-b" x1="194" y1="8.8" x2="236" y2="293" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFEA83" />
          <stop offset=".08" stopColor="#FFDD35" />
          <stop offset="1" stopColor="#FFA800" />
        </linearGradient>
      </defs>
      <path
        d="M399.6 59.5 215.9 388a10 10 0 0 1-17.4.1L11.2 59.5a10 10 0 0 1 10.5-14.8l183.8 32.9a10 10 0 0 0 3.6 0l180-32.8a10 10 0 0 1 10.5 14.7Z"
        fill="url(#vite-a)"
      />
      <path
        d="M292.9 1.6 156.8 28.3a5 5 0 0 0-4 4.6l-8.4 141.2a5 5 0 0 0 6.1 5.2l37.9-8.8a5 5 0 0 1 6 5.9l-11.3 55.2a5 5 0 0 0 6.4 5.8l23.4-7.1a5 5 0 0 1 6.4 5.8l-17.9 86.7c-1.1 5.4 6.1 8.4 9.1 3.7l2-3.1 110.8-221.1a5 5 0 0 0-5.4-7.2l-39 7.5a5 5 0 0 1-5.7-6.3L298.8 7.9a5 5 0 0 0-5.9-6.3Z"
        fill="url(#vite-b)"
      />
    </svg>
  )
}

export function NextLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 180" className={className} aria-hidden>
      <circle cx="90" cy="90" r="90" fill="currentColor" />
      <path
        d="M149.5 157.5 69.1 54H54v72h12.1V69.4l73.8 95.4a90.4 90.4 0 0 0 9.6-7.3Z"
        className="fill-bg"
      />
      <rect x="115" y="54" width="12" height="72" className="fill-bg" />
    </svg>
  )
}

export function ReactLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="-11.5 -10.2 23 20.5" className={className} aria-hidden>
      <circle r="2.05" fill="#58c4dc" />
      <g stroke="#58c4dc" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  )
}

export function FrameworkLogo({ framework, className }: { framework: Framework; className?: string }) {
  return framework === 'next' ? <NextLogo className={className} /> : <ViteLogo className={className} />
}

export function AppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="116" fill="var(--accent)" />
      <g fill="#fff">
        <path d="M256 104 408 184 256 264 104 184Z" opacity=".95" />
        <path d="M136 244 256 308 376 244 408 262 256 342 104 262Z" opacity=".7" />
        <path d="M136 322 256 386 376 322 408 340 256 420 104 340Z" opacity=".45" />
      </g>
    </svg>
  )
}
