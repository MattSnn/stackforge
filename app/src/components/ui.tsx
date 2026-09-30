import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={clsx(
        'relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40',
        checked ? 'bg-accent' : 'bg-line-strong',
      )}
    >
      <span
        className={clsx(
          'size-3.5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[15px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode; disabled?: boolean; hint?: string }[]
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-elevated p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={o.disabled}
          title={o.hint}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-md px-3 py-1 text-[12.5px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-35',
            value === o.value ? 'bg-panel text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
        size === 'sm' && 'h-7 px-2.5 text-[12px]',
        size === 'md' && 'h-8 px-3 text-[12.5px]',
        size === 'lg' && 'h-10 px-4 text-[13.5px]',
        variant === 'primary' &&
          'bg-accent text-accent-fg shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_6px_20px_-6px_var(--accent)] hover:brightness-110',
        variant === 'secondary' && 'border border-line bg-elevated text-fg hover:border-line-strong hover:bg-hover',
        variant === 'ghost' && 'text-muted hover:bg-hover hover:text-fg',
        variant === 'danger' && 'text-danger hover:bg-danger/10',
        className,
      )}
    />
  )
}

export function Section({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="animate-in rounded-2xl border border-line bg-panel p-5">
      <header className="mb-4 flex items-start gap-3">
        {icon && (
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent [&_svg]:size-4">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-[12.5px] text-muted">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-white/20 bg-white/10 px-1 py-px font-mono text-[10.5px] leading-none">
      {children}
    </kbd>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'ok' | 'warn' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
        tone === 'neutral' && 'bg-elevated text-muted ring-1 ring-line',
        tone === 'accent' && 'bg-accent/12 text-accent',
        tone === 'ok' && 'bg-ok/12 text-ok',
        tone === 'warn' && 'bg-warn/12 text-warn',
      )}
    >
      {children}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx('animate-spin', className)} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props
  return (
    <input
      spellCheck={false}
      autoComplete="off"
      {...rest}
      className={clsx(
        'h-9 w-full rounded-lg border bg-elevated px-3 text-[13px] text-fg transition-colors outline-none placeholder:text-subtle',
        invalid ? 'border-danger/60' : 'border-line hover:border-line-strong focus:border-accent/70',
        className,
      )}
    />
  )
}
