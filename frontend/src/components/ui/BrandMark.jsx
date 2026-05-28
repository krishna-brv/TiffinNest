import { Utensils } from 'lucide-react';

const BrandMark = ({ compact = false }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
      <Utensils className="h-5 w-5" />
    </div>
    {!compact && (
      <div>
        <p className="text-lg font-extrabold leading-none tracking-normal text-slate-950">TiffinNest</p>
        <p className="mt-0.5 text-[11px] font-bold uppercase text-slate-500">Community meals</p>
      </div>
    )}
  </div>
);

export default BrandMark;
