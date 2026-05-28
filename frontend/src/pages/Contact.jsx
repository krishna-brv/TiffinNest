import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, ShieldCheck, Utensils } from 'lucide-react';

const Contact = () => (
  <div className="app-shell">
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="dashboard-hero rounded-2xl p-6 sm:p-8 shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-100 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>
        <h1 className="text-4xl font-extrabold text-white">Contact TiffinNest</h1>
        <p className="mt-2 text-cyan-50">Reach the admin team for account, provider, or order-support questions.</p>
      </div>

      <div className="dashboard-panel rounded-2xl p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="dashboard-card rounded-2xl p-5">
            <Mail className="w-7 h-7 text-teal-700 mb-4" />
            <p className="text-sm font-bold uppercase text-slate-500">Email</p>
            <a href="mailto:admin@tiffinnest.example" className="mt-1 block font-extrabold text-slate-950 hover:text-teal-700">
              admin@tiffinnest.example
            </a>
          </div>
          <div className="dashboard-card rounded-2xl p-5">
            <MessageSquare className="w-7 h-7 text-amber-700 mb-4" />
            <p className="text-sm font-bold uppercase text-slate-500">Support</p>
            <p className="mt-1 font-extrabold text-slate-950">
              Use email for account, order, or provider-profile help.
            </p>
          </div>
          <div className="dashboard-card rounded-2xl p-5">
            <ShieldCheck className="w-7 h-7 text-indigo-700 mb-4" />
            <p className="text-sm font-bold uppercase text-slate-500">Privacy</p>
            <p className="mt-1 font-extrabold text-slate-950">
              Do not share passwords, reset tokens, or payment details in support messages.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-600">
        <Utensils className="w-4 h-4" />
        <span className="font-bold">TiffinNest</span>
      </div>
    </div>
  </div>
);

export default Contact;
