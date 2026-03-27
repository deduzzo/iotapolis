export default function Footer() {
  return (
    <footer className="py-16 px-4 border-t border-white/5">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <h3 className="text-xl font-bold gradient-text mb-1">IotaPolis</h3>
          <p className="text-gray-500 text-sm">Decentralized community platform on IOTA 2.0</p>
        </div>
        <div className="flex gap-6 text-sm text-gray-400">
          <a href="https://github.com/deduzzo/iotapolis" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          <a href="https://github.com/deduzzo/iotapolis/releases" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Releases</a>
          <a href="/docs" className="hover:text-white transition-colors">Docs</a>
        </div>
        <p className="text-gray-600 text-xs">MIT License</p>
      </div>
    </footer>
  );
}
