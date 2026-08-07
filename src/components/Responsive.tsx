import { useState, useEffect } from 'react';

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkResponsive = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  return { isMobile, isTablet, isDesktop };
}

interface ResponsiveProps {
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
}

export function Responsive({ mobile, tablet, desktop }: ResponsiveProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (isMobile && mobile) return <>{mobile}</>;
  if (isTablet && tablet) return <>{tablet}</>;
  if (isDesktop && desktop) return <>{desktop}</>;
  
  // Fallback to mobile if no specific match
  return <>{mobile || tablet || desktop}</>;
}

interface HideOnProps {
  children: React.ReactNode;
  breakpoint?: 'mobile' | 'tablet' | 'desktop';
}

export function HideOn({ children, breakpoint = 'mobile' }: HideOnProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const shouldHide = 
    breakpoint === 'mobile' && isMobile ||
    breakpoint === 'tablet' && isTablet ||
    breakpoint === 'desktop' && isDesktop;

  return shouldHide ? null : <>{children}</>;
}

interface ShowOnProps {
  children: React.ReactNode;
  breakpoint?: 'mobile' | 'tablet' | 'desktop';
}

export function ShowOn({ children, breakpoint = 'mobile' }: ShowOnProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const shouldShow = 
    breakpoint === 'mobile' && isMobile ||
    breakpoint === 'tablet' && isTablet ||
    breakpoint === 'desktop' && isDesktop;

  return shouldShow ? <>{children}</> : null;
}
