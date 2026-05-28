import BrandMark from './BrandMark';

const AuthLayout = ({ title, subtitle, children, asideTitle, asideBody }) => (
  <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_26rem]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <BrandMark />
          <div className="mt-10">
            <h1 className="text-3xl font-extrabold tracking-normal text-slate-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </section>
      <aside className="hidden border-l border-slate-200 bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-teal-300">Tiffin operations</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-normal">{asideTitle}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">{asideBody}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
          Accounts stay focused on the workflows that matter: saved addresses, kitchen availability, meal plans, and order status.
        </div>
      </aside>
    </div>
  </main>
);

export default AuthLayout;
