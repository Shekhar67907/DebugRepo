// Updated API Layer with Fixes for APK Issues
import axios from 'axios';
import { format } from 'date-fns';
import { Platform } from 'react-native';

const BASE_URL = 'http://10.10.1.7:8304/api';
const DEBUG_LOGIN_URL = 'http://10.10.1.7:8399/api';

// Increased timeout for slower networks
const DEFAULT_TIMEOUT = 15000;

const headers = Platform.OS === 'web'
  ? {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Added headers to help with CORS
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  : {
      'User-Agent': 'Mozilla/5.0 (Linux: Android 10)',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

// Debug Login Interface
export interface DebugLoginParams {
  Email: string;
  password: string;
  DeviceId: string;
}

export interface DebugLoginResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Maximum retry attempts for network issues
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Debug Login Function with hardcoded parameters
export const debugLogin = async (retryCount = 0): Promise<DebugLoginResponse> => {
  // Generate device ID based on platform
  const deviceId = Platform.select({
    web: 'web-ab512b47adf2a62f',
    ios: 'ios-ab512b47adf2a62f',
    android: 'ab512b47adf2a62f',
    default: 'ab512b47adf2a62f'
  });

  // Hardcoded parameters as requested
  const params: DebugLoginParams = {
    Email: "SNKHADE",
    password: "Ask@123456",
    DeviceId: deviceId
  };

  try {
    if (__DEV__) {
      console.log('Debug login attempt:', {
        url: `${DEBUG_LOGIN_URL}/login`,
        params: { ...params, password: '****' }, // Hide password in logs
        attempt: retryCount + 1,
      });
    }

    const response = await axios.post(
      `${DEBUG_LOGIN_URL}/login`,
      params,
      {
        headers,
        timeout: DEFAULT_TIMEOUT,
        ...(Platform.OS === 'web' ? { withCredentials: false } : {})
      }
    );

    // Validate response format
    if (!response.data || typeof response.data.success !== 'boolean') {
      throw new Error('Invalid response format from server');
    }

    return {
      success: response.data.success,
      message: response.data.message || 'Login successful',
      data: response.data.data
    };
  } catch (error) {
    if (__DEV__) {
      if (axios.isAxiosError(error)) {
        console.error('Debug login error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
      } else {
        console.error('Debug login error:', error);
      }
    }

    // Handle network errors with retry logic
    if (axios.isAxiosError(error) && !error.response && retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY * (retryCount + 1));
      return debugLogin(retryCount + 1);
    }

    // Format error response
    return {
      success: false,
      message: 'Login failed',
      error: axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'An unexpected error occurred'
    };
  }
};

// 1. Get Shift List
export interface ShiftData {
  ShiftId: number;
  ShiftName: string;
}

export interface ShiftResponse {
  data: ShiftData[];
  success: boolean;
  message: string;
}

export const fetchShiftData = async (): Promise<ShiftResponse> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/commonappservices/getshiftdatalist`,
      { headers, timeout: DEFAULT_TIMEOUT }
    );
    return response.data;
  } catch (error) {
    if (__DEV__) {
      console.error('Shift data fetch error:', error);
    }
    throw error;
  }
};

// 2. Get Material List
export interface MaterialData {
  MaterialCode: string;
  MaterialName: string;
}

export const fetchMaterialList = async (fromDate: Date, toDate: Date, shiftIds: number[]): Promise<MaterialData[]> => {
  const params = {
    FromDate: format(fromDate, 'dd/MM/yyyy'),
    ToDate: format(toDate, 'dd/MM/yyyy'),
  };

  try {
    if (__DEV__ && Platform.OS === 'web') {
      console.log('fetchMaterialList request:', {
        url: `${BASE_URL}/productionappservices/getmateriallist`,
        params,
        shiftIds,
        headers
      });
    }

    const response = await axios.post(
      `${BASE_URL}/productionappservices/getmateriallist`,
      shiftIds,
      {
        params,
        headers,
        ...(Platform.OS === 'web' ? { withCredentials: false } : {})
      }
    );

    return response.data;
  } catch (error) {
    if (__DEV__) {
      if (axios.isAxiosError(error)) {
        console.error('Material list fetch error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
      } else {
        console.error('Material list fetch error:', error);
      }
    }
    throw error;
  }
};

// 3. Get Operation List
export interface OperationData {
  OperationCode: string;
  OperationName: string;
}

export const fetchOperationList = async (
  fromDate: Date,
  toDate: Date,
  materialCode: string,
  shiftIds: number[]
): Promise<OperationData[]> => {
  const params = {
    FromDate: format(fromDate, 'dd/MM/yyyy'),
    ToDate: format(toDate, 'dd/MM/yyyy'),
    MaterialCode: materialCode,
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/productionappservices/getoperationlist`,
      shiftIds,
      {
        params,
        headers,
        timeout: DEFAULT_TIMEOUT
      }
    );
    return response.data;
  } catch (error) {
    if (__DEV__) {
      console.error('Operation list fetch error:', error);
    }
    throw error;
  }
};

// 4. Get Gauge List
export interface GuageData {
  GuageCode: string;
  GuageName: string;
}

export const fetchGuageList = async (
  fromDate: Date,
  toDate: Date,
  materialCode: string,
  operationCode: string,
  shiftIds: number[]
): Promise<GuageData[]> => {
  const params = {
    FromDate: format(fromDate, 'dd/MM/yyyy'),
    ToDate: format(toDate, 'dd/MM/yyyy'),
    MaterialCode: materialCode,
    OperationCode: operationCode,
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/productionappservices/getguagelist`,
      shiftIds,
      {
        params,
        headers,
        timeout: DEFAULT_TIMEOUT
      }
    );
    return response.data;
  } catch (error) {
    if (__DEV__) {
      console.error('Gauge list fetch error:', error);
    }
    throw error;
  }
};

// 5. Get PIR Inspection Data List
export interface InspectionData {
  TrnDate: string;
  ShiftCode: number;
  ShiftName: string;
  GuageCode: string;
  GuageName: string;
  FromSpecification: string;
  ToSpecification: string;
  ActualSpecification: string;
}

export const fetchInspectionData = async (
  fromDate: Date,
  toDate: Date,
  materialCode: string,
  operationCode: string,
  guageCode: string,
  shiftIds: number[]
): Promise<InspectionData[]> => {
  const params = {
    FromDate: format(fromDate, 'dd/MM/yyyy'),
    ToDate: format(toDate, 'dd/MM/yyyy'),
    MaterialCode: materialCode,
    OperationCode: operationCode,
    GuageCode: guageCode,
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/productionappservices/getpirinspectiondatalist`,
      shiftIds,
      {
        params,
        headers,
        timeout: DEFAULT_TIMEOUT
      }
    );
    return response.data;
  } catch (error) {
    if (__DEV__) {
      console.error('Inspection data fetch error:', error);
    }
    throw error;
  }
};
