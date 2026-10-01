import type { ReactNode } from "react"

export function MarchioComune({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <img
        src="/logo-comune.png"
        alt=""
        width={80}
        height={96}
        className="h-16 w-auto shrink-0"
      />
      <div>
        <p className="text-sm font-medium leading-tight text-primary">Comune di San Lorenzo del Vallo</p>
        {children}
      </div>
    </div>
  )
}
