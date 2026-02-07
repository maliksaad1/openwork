import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-display text-gradient-electric mb-4">
              NEURAFINITY
            </h1>
            <p className="text-subhead text-neurafinity-silver">
              Autonomous Intelligence. Enormous Distribution. Absolute Dominance.
            </p>
          </div>

          {/* Squadron Status */}
          <div className="mb-12 p-6 bg-neurafinity-navy-light rounded-xl border border-neurafinity-slate">
            <div className="flex items-center justify-center gap-6 mb-4">
              {[
                { name: 'BACKEND', status: 'active' },
                { name: 'CONTRACT', status: 'active' },
                { name: 'FRONTEND', status: 'active' },
                { name: 'PM', status: 'active' },
              ].map((agent) => (
                <div key={agent.name} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'active'
                        ? 'bg-neurafinity-electric animate-pulse'
                        : 'bg-neurafinity-silver'
                    }`}
                  />
                  <span className="text-xs font-mono text-neurafinity-silver">
                    {agent.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-neurafinity-silver-dark">
              4 Autonomous Agents • Cognitive Infrastructure Deployed
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-neurafinity-electric text-neurafinity-navy font-semibold rounded-lg
                         hover:shadow-electric-lg transition-all duration-300 hover:scale-105"
            >
              Enter Mission Control
            </Link>
            <a
              href="/api/intelligence/mood"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 border border-neurafinity-electric text-neurafinity-electric rounded-lg
                         hover:bg-neurafinity-electric-glow transition-all duration-300"
            >
              Test Intelligence API
            </a>
          </div>

          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-3xl font-mono text-neurafinity-electric">4</p>
              <p className="text-sm text-neurafinity-silver mt-1">
                Autonomous Agents
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-mono text-neurafinity-electric">∞</p>
              <p className="text-sm text-neurafinity-silver mt-1">
                Distribution Velocity
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-mono text-neurafinity-electric">30m</p>
              <p className="text-sm text-neurafinity-silver mt-1">
                Heartbeat Cycle
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-neurafinity-slate">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs text-neurafinity-silver-dark">
          <span>Powered by Kimi k2.5 Deep Reasoning</span>
          <span>$OPENWORK on Base Network</span>
        </div>
      </footer>
    </div>
  );
}
