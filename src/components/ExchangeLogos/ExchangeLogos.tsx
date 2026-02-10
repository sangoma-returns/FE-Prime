interface ExchangeLogoProps {
  name: string;
  className?: string;
}

export function ExchangeLogo({ name, className = "w-5 h-5" }: ExchangeLogoProps) {
  const logos: Record<string, JSX.Element> = {
    Hyperliquid: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#1FBF75"/>
        <path d="M7 8L12 5L17 8V16L12 19L7 16V8Z" fill="white"/>
        <path d="M12 10V14M10 12H14" stroke="#1FBF75" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    Paradex: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#8B5CF6"/>
        <path d="M8 7H16L12 17H8L8 7Z" fill="white"/>
        <circle cx="14" cy="10" r="2" fill="#8B5CF6"/>
      </svg>
    ),
    Aster: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#EC4899"/>
        <path d="M12 6L14.5 11.5L20 12L15 16.5L16.5 22L12 18.5L7.5 22L9 16.5L4 12L9.5 11.5L12 6Z" fill="white"/>
      </svg>
    ),
    Binance: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#F0B90B"/>
        <path d="M12 7L14 9L12 11L10 9L12 7Z" fill="white"/>
        <path d="M8 11L10 13L8 15L6 13L8 11Z" fill="white"/>
        <path d="M16 11L18 13L16 15L14 13L16 11Z" fill="white"/>
        <path d="M12 15L14 17L12 19L10 17L12 15Z" fill="white"/>
        <rect x="10" y="11" width="4" height="4" transform="rotate(45 12 13)" fill="white"/>
      </svg>
    ),
    Bybit: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#F7A600"/>
        <path d="M8 8H12C14 8 15 9 15 11C15 13 14 14 12 14H10V17H8V8Z" fill="white"/>
        <path d="M10 10V12H12C12.5 12 13 11.5 13 11C13 10.5 12.5 10 12 10H10Z" fill="#F7A600"/>
        <rect x="15" y="13" width="2" height="4" rx="1" fill="white"/>
      </svg>
    ),
    OKX: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#000000"/>
        <rect x="7" y="7" width="4" height="4" rx="1" fill="white"/>
        <rect x="13" y="7" width="4" height="4" rx="1" fill="white"/>
        <rect x="7" y="13" width="4" height="4" rx="1" fill="white"/>
        <rect x="13" y="13" width="4" height="4" rx="1" fill="white"/>
      </svg>
    ),
  };

  return logos[name] || (
    <div className={`${className} rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] font-semibold`}>
      {name.charAt(0)}
    </div>
  );
}
