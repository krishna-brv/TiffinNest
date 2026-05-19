import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ChefHat, Utensils, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'customer') {
        navigate('/customer/dashboard');
      } else if (user.role === 'provider') {
        navigate('/provider/dashboard');
      }
    }
  }, [user, loading, navigate]);

  if (loading) return null; // Or a loading spinner

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 glass-panel m-4 rounded-2xl border border-white/30">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-lg">
            <Utensils className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tighter">TiffinNest</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/login')} className="px-6 py-2 text-gray-800 font-bold hover:text-orange-600 transition">Login</button>
          <button onClick={() => navigate('/register')} className="px-6 py-2 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition transform hover:scale-105">Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-block px-4 py-1 rounded-full bg-orange-100 text-orange-600 font-bold text-sm border border-orange-200">
              Homemade with care
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
              Delicious <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Home-Cooked</span> Tiffins, Delivered.
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl leading-relaxed">
              Connect with skilled home cooks in your community. Experience authentic, healthy, and affordable meals delivered with routine-friendly planning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => navigate('/register')} 
                className="group px-8 py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl shadow-xl hover:bg-orange-600 transition transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Order Your First Tiffin <ArrowRight className="group-hover:translate-x-1 transition" />
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="px-8 py-4 glass-panel font-bold text-lg rounded-2xl hover:bg-white/40 transition transform hover:-translate-y-1"
              >
                Become a Food Provider
              </button>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
              <div className="text-center">
                <p className="text-3xl font-black text-gray-900">500+</p>
                <p className="text-sm text-gray-600 font-bold uppercase">Active Chefs</p>
              </div>
              <div className="text-center border-l border-gray-300 pl-8">
                <p className="text-3xl font-black text-gray-900">10k+</p>
                <p className="text-sm text-gray-600 font-bold uppercase">Happy Eaters</p>
              </div>
              <div className="text-center border-l border-gray-300 pl-8">
                <p className="text-3xl font-black text-gray-900">4.9/5</p>
                <p className="text-sm text-gray-600 font-bold uppercase">Top Ratings</p>
              </div>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-[3rem] blur-2xl opacity-20 animate-pulse"></div>
            <img 
              src="/home_hero_dabba_1778081716855.png" 
              alt="Home Cooked Meal" 
              className="relative w-full h-auto rounded-[3rem] shadow-2xl border-4 border-white/50"
            />
            {/* Floating Badges */}
            <div className="absolute -top-6 -right-6 glass-panel p-4 rounded-2xl shadow-xl animate-bounce">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <ShieldCheck className="text-white w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Quality</p>
                  <p className="text-sm font-black text-gray-900">100% Healthy</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 glass-panel p-4 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="bg-red-500 p-2 rounded-lg">
                  <Heart className="text-white w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Support</p>
                  <p className="text-sm font-black text-gray-900">Local Kitchens</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/30">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Why Choose TiffinNest?</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed">
              We're more than just a food delivery app. We're a bridge between home kitchens and your dining table.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-10 rounded-[2.5rem] space-y-6 hover:translate-y-[-10px] transition duration-500 border border-white/50">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30">
                <ChefHat className="text-white w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Expert Home Chefs</h3>
              <p className="text-gray-700 leading-relaxed">
                Our providers are skilled home cooks who take pride in their family recipes and use high-quality ingredients.
              </p>
            </div>
            <div className="glass-panel p-10 rounded-[2.5rem] space-y-6 hover:translate-y-[-10px] transition duration-500 border border-white/50">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
                <Utensils className="text-white w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Zero Plastic Waste</h3>
              <p className="text-gray-700 leading-relaxed">
                We support reusable tiffins and practical delivery routines, reducing plastic waste while keeping food fresh.
              </p>
            </div>
            <div className="glass-panel p-10 rounded-[2.5rem] space-y-6 hover:translate-y-[-10px] transition duration-500 border border-white/50">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
                <Heart className="text-white w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Community Focused</h3>
              <p className="text-gray-700 leading-relaxed">
                By ordering here, you support local households and empower women entrepreneurs in your own neighborhood.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Utensils className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter">TiffinNest</span>
          </div>
          <p className="text-gray-600 font-medium">© 2026 TiffinNest. All rights reserved.</p>
          <div className="flex gap-6">
            <button type="button" onClick={() => navigate('/terms')} className="text-gray-600 hover:text-orange-600 font-bold transition">Terms</button>
            <button type="button" onClick={() => navigate('/contact')} className="text-gray-600 hover:text-orange-600 font-bold transition">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
