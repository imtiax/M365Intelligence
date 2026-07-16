import { Module } from '@nestjs/common';
import { PublicDemoController } from './public-demo.controller';
import { PublicDemoService } from './public-demo.service';
import { PublicDemoStore } from './public-demo.store';

@Module({
  controllers: [PublicDemoController],
  providers: [PublicDemoService, PublicDemoStore],
})
export class PublicDemoModule {}
