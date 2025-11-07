import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { authenticateSalesforce, SalesforceCredentials } from './auth'
import { SalesforceApiResponse } from '@/types/salesforce'

export class SalesforceRestClient {
  private axiosInstance: AxiosInstance
  private accessToken: string | null = null
  private instanceUrl: string
  private credentials: SalesforceCredentials

  constructor(credentials: SalesforceCredentials) {
    this.credentials = credentials
    this.instanceUrl = credentials.instanceUrl

    this.axiosInstance = axios.create({
      baseURL: this.instanceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to inject access token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        if (!this.accessToken) {
          await this.authenticate()
        }
        config.headers.Authorization = `Bearer ${this.accessToken}`
        return config
      },
      (error) => Promise.reject(error)
    )

    // Add response interceptor to handle token expiration
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // If token expired, re-authenticate and retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          await this.authenticate()
          originalRequest.headers.Authorization = `Bearer ${this.accessToken}`
          return this.axiosInstance(originalRequest)
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * Authenticate with Salesforce and store access token
   */
  private async authenticate(): Promise<void> {
    const authResponse = await authenticateSalesforce(this.credentials)
    this.accessToken = authResponse.access_token
    this.instanceUrl = authResponse.instance_url
    this.axiosInstance.defaults.baseURL = this.instanceUrl
  }

  /**
   * Make a GET request to Salesforce
   */
  async get<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const startTime = Date.now()
      const response: AxiosResponse<T> = await this.axiosInstance.get(endpoint, config)
      const responseTime = Date.now() - startTime

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Make a POST request to Salesforce
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const startTime = Date.now()
      const response: AxiosResponse<T> = await this.axiosInstance.post(endpoint, data, config)
      const responseTime = Date.now() - startTime

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Make a PUT request to Salesforce
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const startTime = Date.now()
      const response: AxiosResponse<T> = await this.axiosInstance.put(endpoint, data, config)
      const responseTime = Date.now() - startTime

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Make a PATCH request to Salesforce
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const startTime = Date.now()
      const response: AxiosResponse<T> = await this.axiosInstance.patch(endpoint, data, config)
      const responseTime = Date.now() - startTime

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Make a DELETE request to Salesforce
   */
  async delete<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const startTime = Date.now()
      const response: AxiosResponse<T> = await this.axiosInstance.delete(endpoint, config)
      const responseTime = Date.now() - startTime

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Make a custom request with any HTTP method
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<SalesforceApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request(config)

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Handle axios errors and return standardized error response
   */
  private handleError(error: any): SalesforceApiResponse {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        success: false,
        error: {
          message: error.response.data?.message || error.message,
          errorCode: error.response.data?.errorCode || 'UNKNOWN_ERROR',
          fields: error.response.data?.fields,
        },
        statusCode: error.response.status,
        headers: this.extractHeaders(error.response.headers),
      }
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        error: {
          message: 'No response received from Salesforce',
          errorCode: 'NO_RESPONSE',
        },
        statusCode: 0,
        headers: {},
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        success: false,
        error: {
          message: error.message,
          errorCode: 'REQUEST_ERROR',
        },
        statusCode: 0,
        headers: {},
      }
    }
  }

  /**
   * Extract headers from axios response
   */
  private extractHeaders(headers: any): Record<string, string> {
    const extracted: Record<string, string> = {}

    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        extracted[key] = value
      }
    }

    return extracted
  }
}
