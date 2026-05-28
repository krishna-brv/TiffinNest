const MetricCard = ({ label, value, icon: Icon, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="dashboard-card rounded-lg p-4">
      <div className={`mb-4 inline-flex rounded-lg p-2 ${tones[tone] || tones.slate}`}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 truncate text-2xl font-extrabold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
};

export default MetricCard;
