import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Utensils } from 'lucide-react';

const Terms = () => (
  <div className="app-shell">
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="dashboard-hero rounded-2xl p-6 sm:p-8 shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-100 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/15 p-3">
            <FileText className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white">Terms and Conditions</h1>
            <p className="mt-1 text-cyan-50">Basic usage terms for TiffinNest.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-panel rounded-2xl p-6 sm:p-8 space-y-6">
        {[
          ['Use of Service', 'TiffinNest connects customers with independent home food providers. Users must provide accurate account, address, and order information.'],
          ['Food Providers', 'Providers are responsible for menu accuracy, food quality, hygiene, availability, and timely order handling.'],
          ['Orders and Routines', 'Customers may create one-time or routine orders. Routine schedules, skips, pauses, and cancellations depend on provider availability.'],
          ['User Conduct', 'Users must not misuse the platform, submit false information, harass other users, or attempt unauthorized access.'],
          ['Reviews', 'Reviews should reflect genuine delivered meal experiences and must not include abusive, misleading, or illegal content.'],
          ['Account Actions', 'Users may update or delete their account from the account dashboard. Deleting an account can permanently remove related records.'],
          ['Limitations', 'This demo platform does not provide payment processing, legal food certification, or emergency support.'],
          ['Changes', 'These terms may be updated as the product evolves. Continued use means acceptance of the latest terms.'],
        ].map(([title, body]) => (
          <section key={title}>
            <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
            <p className="mt-2 text-slate-700 leading-relaxed">{body}</p>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-600">
        <Utensils className="w-4 h-4" />
        <span className="font-bold">TiffinNest</span>
      </div>
    </div>
  </div>
);

export default Terms;
