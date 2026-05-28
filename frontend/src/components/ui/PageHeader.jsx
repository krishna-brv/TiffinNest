const PageHeader = ({ eyebrow, title, description, actions, className = '' }) => (
  <div className={`page-header ${className}`}>
    <div>
      {eyebrow && <p className="text-xs font-bold uppercase text-teal-700">{eyebrow}</p>}
      <h1 className="mt-1 text-3xl font-extrabold tracking-normal text-slate-950 sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
