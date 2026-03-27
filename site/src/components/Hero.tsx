export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(108,99,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(108,99,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
            <span className="gradient-text">IotaPolis</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto">
            The decentralized community platform powered by IOTA 2.0
          </p>
          <p className="text-base text-gray-500 mb-10 max-w-xl mx-auto">
            Forum, wallet, payments, marketplace, and escrow — all on-chain, all yours.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <a href="https://github.com/deduzzo/iotapolis" target="_blank" rel="noopener noreferrer" className="glass px-8 py-3 rounded-xl text-white font-semibold hover:bg-white/10 transition-all duration-300 hover:scale-105">
            GitHub
          </a>
          <a href="/docs" className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105">
            Documentation
          </a>
          <a href="https://github.com/deduzzo/iotapolis/releases" target="_blank" rel="noopener noreferrer" className="glass px-8 py-3 rounded-xl text-white font-semibold hover:bg-white/10 transition-all duration-300 hover:scale-105">
            Download
          </a>
        </div>
      </div>
    </section>
  );
}
