declare module 'qr-scanner' {
  // NodeNext resolves this package as a module namespace in this project setup.
  // Use the package's shipped declaration file as the source of truth for default import typing.
  import QrScanner from 'qr-scanner/types/qr-scanner'

  export default QrScanner
}
