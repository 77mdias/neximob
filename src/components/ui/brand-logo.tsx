interface BrandLogoProps {
  variant?: "horizontal" | "mark" | "responsive";
  className?: string;
}

export function BrandLogo({ variant = "horizontal", className = "" }: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <img
          src="/brand/logo-mark.svg"
          alt="Neximob"
          width={385}
          height={316}
          className="nx-only-light h-7 w-auto"
        />
        <img
          src="/brand/logo-mark-dark.svg"
          alt="Neximob"
          width={385}
          height={316}
          className="nx-only-dark h-7 w-auto"
        />
      </span>
    );
  }

  if (variant === "responsive") {
    return (
      <span className={`inline-flex items-center ${className}`}>
        {/* Mobile estreito (< 480px): somente o símbolo para liberar espaço ao seletor de mês */}
        <span className="inline-flex items-center min-[480px]:hidden">
          <img
            src="/brand/logo-mark.svg"
            alt="Neximob"
            width={385}
            height={316}
            className="nx-only-light h-7 w-auto"
          />
          <img
            src="/brand/logo-mark-dark.svg"
            alt="Neximob"
            width={385}
            height={316}
            className="nx-only-dark h-7 w-auto"
          />
        </span>
        {/* >= 480px: lockup horizontal oficial */}
        <span className="hidden items-center min-[480px]:inline-flex">
          <img
            src="/brand/logo-horizontal.svg"
            alt="Neximob"
            width={216}
            height={44}
            className="nx-only-light h-7 w-auto"
          />
          <img
            src="/brand/logo-horizontal-dark.svg"
            alt="Neximob"
            width={216}
            height={44}
            className="nx-only-dark h-7 w-auto"
          />
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src="/brand/logo-horizontal.svg"
        alt="Neximob"
        width={216}
        height={44}
        className="nx-only-light h-8 w-auto"
      />
      <img
        src="/brand/logo-horizontal-dark.svg"
        alt="Neximob"
        width={216}
        height={44}
        className="nx-only-dark h-8 w-auto"
      />
    </span>
  );
}
