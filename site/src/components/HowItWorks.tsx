const steps = [
  { num: '01', title: 'Create Your Wallet', desc: 'Generate a BIP39 mnemonic. Your Ed25519 keypair is your identity — no email, no password, no server.' },
  { num: '02', title: 'Join the Community', desc: 'Register on-chain with a single transaction. Post threads, vote, moderate — all signed by you.' },
  { num: '03', title: 'Exchange Value', desc: 'Tip creators, subscribe to content, trade services through multi-sig escrow. The smart contract handles everything.' },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16 scroll-reveal">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">How It Works</span>
        </h2>
      </div>
      <div className="space-y-12">
        {steps.map((step, i) => (
          <div key={step.num} className="scroll-reveal flex flex-col md:flex-row items-start gap-6 glass rounded-2xl p-8" style={{ transitionDelay: `${i * 0.15}s` }}>
            <div className="text-5xl font-bold gradient-text shrink-0 w-20">{step.num}</div>
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
