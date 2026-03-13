import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('api.thecatapi.com')) {
    const authReq = req.clone({
      setHeaders: {
        'x-api-key': environment.catApiKey, // Store key in environment
      },
    });
    return next(authReq);
  }
  return next(req);
};
