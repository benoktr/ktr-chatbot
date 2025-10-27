
import React, { useMemo } from 'react';

const Snowfall: React.FC = () => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => {
      const size = Math.random() * 3 + 1;
      const style = {
        left: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        opacity: Math.random() * 0.5 + 0.3,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${Math.random() * 10 + 5}s`,
      };
      return <div key={i} className="snowflake" style={style}></div>;
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {snowflakes}
    </div>
  );
};

export default Snowfall;
