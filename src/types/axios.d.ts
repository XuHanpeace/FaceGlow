import 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig<D = unknown> {
    /**
     * FaceGlow: prevent infinite 401-refresh-retry loops.
     * When true, 401 interceptor will not retry again.
     */
    _fgRetried?: boolean;

    /**
     * FaceGlow: skip auto-inject Authorization header for this request.
     */
    _fgSkipAuthHeader?: boolean;

    /**
     * FaceGlow: skip 401 refresh interceptor for this request (e.g. refresh/login endpoints).
     */
    _fgSkip401Refresh?: boolean;

    /**
     * FaceGlow: reserved for Phase2 auto-uid injection.
     */
    _fgSkipAutoUid?: boolean;
  }
}


