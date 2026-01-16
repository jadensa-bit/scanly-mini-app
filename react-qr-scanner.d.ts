declare module 'react-qr-scanner' {
  import { FC, ReactNode } from 'react';

  interface QrScannerProps {
    delay?: number;
    onError?: (error: any) => void;
    onScan?: (data: any) => void;
    style?: React.CSSProperties;
    className?: string;
    facingMode?: 'user' | 'environment';
    resolution?: number;
    showViewFinder?: boolean;
    legacyMode?: boolean;
    constraints?: any;
  }

  const QrScanner: FC<QrScannerProps>;
  export default QrScanner;
}
