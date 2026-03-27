const features = [
  { icon: '\u{1F517}', title: 'Fully Decentralized', desc: 'Every action is signed by your wallet and verified on-chain. No intermediaries, no censorship.' },
  { icon: '\u{1F45B}', title: 'Integrated Wallet', desc: 'Ed25519 wallet derived from BIP39 mnemonic. Your keys, your identity.' },
  { icon: '\u{1F4B8}', title: 'On-Chain Payments', desc: 'Tips, subscriptions, and content purchases — all handled by the smart contract.' },
  { icon: '\u{1F91D}', title: 'Multi-Sig Escrow', desc: '2-of-3 escrow for services between users. Dispute resolution built in.' },
  { icon: '\u{1F3EA}', title: 'Marketplace', desc: 'Buy and sell content, services, and badges. 5% marketplace fee managed on-chain.' },
  { icon: '\u{1F30D}', title: '8 Languages', desc: 'Internationalized UI with react-i18next. Community without borders.' },
  { icon: '\u{1F3A8}', title: '7 Themes', desc: 'Dark mode, light mode, and 5 more. Make it yours.' },
  { icon: '\u{1F5A5}\u{FE0F}', title: 'Desktop App', desc: 'Electron app with auto-updates for Windows, macOS, and Linux.' },
];

export default function Features() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16 scroll-reveal">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">Features</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          A complete decentralized platform, not just a forum.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <div key={f.title} className="scroll-reveal glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(108,99,255,0.15)]" style={{ transitionDelay: `${i * 0.05}s` }}>
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
