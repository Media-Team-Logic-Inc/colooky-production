import { useEffect } from 'react';
import { useSubscriptionStore } from '../store/subscription';
import { subscriptionAPI } from '../lib/api';

export const useSubscription = () => {
  const { usage, setUsage } = useSubscriptionStore();

  const fetchUsage = async () => {
    try {
      const response = await subscriptionAPI.getUsage();
      setUsage(response.data.usage);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const validatePromoCode = async (code: string, tier: string) => {
    try {
      const response = await subscriptionAPI.validatePromoCode(code, tier);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Invalid promo code');
    }
  };

  return {
    usage,
    fetchUsage,
    validatePromoCode,
  };
};