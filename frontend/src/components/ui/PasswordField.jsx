import { Eye, EyeOff } from 'lucide-react';

const PasswordField = ({
  label,
  value,
  onChange,
  visible,
  onToggle,
  name = 'password',
  autoComplete = 'current-password',
  minLength,
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
    <span className="relative block">
      <input
        name={name}
        type={visible ? 'text' : 'password'}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className="field-control pr-11"
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-2.5 flex items-center rounded-md px-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </span>
  </label>
);

export default PasswordField;
