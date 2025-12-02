import { useState, useEffect } from 'react';

/**
 * Hook that provides a rotation key that changes every 30 minutes.
 * Used to ensure profile sorting rotates automatically without page reload.
 */
export const useRotationKey = () => {
  const getRotationKey = () => Math.floor(Date.now() / (30 * 60 * 1000));
  
  const [rotationKey, setRotationKey] = useState(getRotationKey);

  useEffect(() => {
    const checkRotation = () => {
      const newKey = getRotationKey();
      setRotationKey(prev => {
        if (newKey !== prev) {
          console.log('Profile rotation triggered:', { oldKey: prev, newKey });
          return newKey;
        }
        return prev;
      });
    };
    
    // Check every minute if rotation is needed
    const interval = setInterval(checkRotation, 60000);
    return () => clearInterval(interval);
  }, []);

  return rotationKey;
};
