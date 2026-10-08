import Link from "next/link"

export function FooterPrivacy() {
  return (
    <footer className="mt-auto border-t bg-card py-4 text-center text-xs text-muted-foreground">
      <Link href="/privacy" className="underline hover:text-foreground">
        Informativa Privacy
      </Link>
    </footer>
  )
}
