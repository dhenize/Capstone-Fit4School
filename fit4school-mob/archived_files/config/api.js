import { Platform } from 'react-native';

export const API_CONFIG = {
  BASE_URL: 'https://fit4school.6minds.site/fit4school', 
  ENDPOINTS: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    COMPLETE_PROFILE: '/auth/complete-profile',
    CHECK_STUDENT: '/auth/student',
    VERIFY_STUDENT: '/auth/verify-student',
    
    ITEMS: '/items',
    ITEMS_DISPLAY: '/items/display',
    ITEMS_FILTER: '/items/filter',
    ITEMS_SIZES: '/items/sizes',
    ORDERS: '/orders',
  }
};