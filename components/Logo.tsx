/**
 * The Bolt mark: a lock drawn as an eye watching over a keyhole. Two SVGs,
 * one per surface; the match to the surface is done in CSS (Tailwind's
 * dark: variant, wired to the html data-theme attribute) so there is no
 * client side flash while the page hydrates. Never recolor, stretch, or
 * add a shadow behind either file (project/assets/Logos/README.md).
 */
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  const style = { width: size, height: size };

  return (
    <span className={`inline-flex overflow-hidden rounded-[var(--radius-100)] ${className}`}>
      <img src="/logo/bolt-logo-light.svg" alt="Bolt" style={style} className="block dark:hidden" />
      <img src="/logo/bolt-logo-dark.svg" alt="Bolt" style={style} className="hidden dark:block" />
    </span>
  );
}
