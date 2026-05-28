const Surface = ({ children, className = '', as: Component = 'div' }) => (
  <Component className={`surface ${className}`}>
    {children}
  </Component>
);

export default Surface;
