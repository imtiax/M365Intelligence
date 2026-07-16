import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_DEMO_ROUTE = 'isPublicDemoRoute';
export const PublicDemoRoute = () => SetMetadata(IS_PUBLIC_DEMO_ROUTE, true);
