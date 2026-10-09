import 'reflect-metadata';

process.env.NODE_ENV ??= 'test';
process.env.MONGODB_URI ??=
  process.env.TEST_MONGODB_URI ??
  'mongodb://127.0.0.1:27017/bootyard_backend_e2e';
process.env.MONGOOSE_AUTO_INDEX = 'true';
process.env.JWT_ACCESS_SECRET ??=
  'e2e-access-secret-that-is-longer-than-thirty-two-characters';
process.env.JWT_REFRESH_SECRET ??=
  'e2e-refresh-secret-that-is-longer-than-thirty-two-characters';
process.env.BCRYPT_ROUNDS ??= '10';
process.env.COOKIE_SECURE = 'false';
