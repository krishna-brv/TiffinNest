const Field = ({
  label,
  className = '',
  inputClassName = '',
  as = 'input',
  children,
  ...props
}) => {
  const Component = as;

  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      {children || (
        <Component
          className={`field-control ${inputClassName}`}
          {...props}
        />
      )}
    </label>
  );
};

export default Field;
