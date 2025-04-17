// Updated API Layer with Fixes for APK Issues
import axios from 'axios';
import { format } from 'date-fns';
import { Platform } from 'react-native';

const BASE_URL = 'http://10.10.1.7:8304/api';

const headers = Platform.OS === 'web'
  ? {
      'Content-Type': 'application/json',
    }
  : {
      'User-Agent': 'Mozilla/5.0 (Linux: Android 10)',
      'Content-Type': 'application/json',
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
      { headers, timeout: 10000 }
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
        timeout: 10000
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
        timeout: 10000
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
        timeout: 10000
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