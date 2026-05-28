import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, ClipboardList, HeartHandshake, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/authStore';
import BrandMark from '../components/ui/BrandMark';
import Button from '../components/ui/Button';

const getDashboardPath = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'provider') return '/provider/dashboard';
  return '/customer/dashboard';
};

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && user) {
      navigate(getDashboardPath(user.role));
    }
  }, [user, loading, navigate]);

  if (loading) return null;

  const features = [
    {
      title: 'Routine-first ordering',
      body: 'Customers can schedule daily, weekly, or monthly meals and still pause, skip, or cancel when plans change.',
      icon: CalendarDays,
    },
    {
      title: 'Provider control room',
      body: 'Home cooks manage availability, delivery slots, meal plans, incoming orders, and prep sheets from one place.',
      icon: ClipboardList,
    },
    {
      title: 'Local trust signals',
      body: 'Ratings, favorites, saved addresses, and account controls keep repeat ordering predictable.',
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <BrandMark />
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/login')}>Sign in</Button>
          <Button onClick={() => navigate('/register')}>Create account</Button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-12">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase text-teal-700">Home kitchens, organized</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-tight tracking-normal text-slate-950 sm:text-6xl">
            Daily tiffin routines without the daily coordination.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            TiffinNest connects customers with local home cooks and gives both sides a practical workflow for menus, schedules, prep, and order status.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate('/register')}>
              Start ordering <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/register')}>
              Register as provider
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <img
            src="/home_hero_dabba_1778081716855.png"
            alt="A neatly packed home-cooked tiffin meal"
            className="h-full min-h-80 w-full rounded-lg object-cover"
          />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 inline-flex rounded-lg bg-white p-2 text-teal-700 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-extrabold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <HeartHandshake className="h-4 w-4 text-teal-700" />
          Built for neighborhood kitchens
        </div>
        <div className="flex gap-5">
          <button type="button" onClick={() => navigate('/terms')} className="font-bold hover:text-slate-950">Terms</button>
          <button type="button" onClick={() => navigate('/contact')} className="font-bold hover:text-slate-950">Contact</button>
        </div>
      </footer>
    </main>
  );
};

export default Home;
