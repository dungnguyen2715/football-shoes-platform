import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Array<{ field: string; issue: string }>;
}

export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    details?: Array<{ field: string; issue: string }>,
  ) {
    super({ code, message, details }, status);
  }
}
