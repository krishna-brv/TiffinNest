const variants = {
  primary: 'bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-400',
  accent: 'bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-300',
  warm: 'bg-amber-500 text-slate-950 hover:bg-amber-400 focus:ring-amber-300',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300',
  secondary: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-300',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300',
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
